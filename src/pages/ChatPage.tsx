import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, Badge, Input, List, Tabs, Typography, message as antMessage } from 'antd';
import { MessageOutlined, UserOutlined, PaperClipOutlined, SendOutlined, SmileOutlined } from '@ant-design/icons';
import * as signalR from '@microsoft/signalr';
import { authStorage } from '../api/utils/auth-storage';

const { Text, Title } = Typography;

interface User {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: User;
  timestamp: string;
  isRead: boolean;
}

interface Chat {
  id: string;
  users: User[];
  messages: ChatMessage[];
  unreadCount: number;
  lastMessage: ChatMessage;
}

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const [activeChat, setActiveChat] = useState<string | null>(chatId || null);
  const [inputMessage, setInputMessage] = useState('');
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [realTimeMessages, setRealTimeMessages] = useState<ChatMessage[]>([]);

  // Mock данные
  const currentUser: User = {
    id: '1',
    name: 'Иван Иванов',
    status: 'online',
  };

  const users: User[] = [
    currentUser,
    { id: '2', name: 'Мария Петрова', status: 'online' },
    { id: '3', name: 'Алексей Смирнов', status: 'offline', lastSeen: '2 часа назад' },
  ];

  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      users: [users[0], users[1]],
      messages: [
        {
          id: '1',
          text: 'Привет! Как дела?',
          sender: users[1],
          timestamp: '12:30',
          isRead: true,
        },
        {
          id: '2',
          text: 'Привет! Все отлично, спасибо!',
          sender: users[0],
          timestamp: '12:35',
          isRead: true,
        },
      ],
      unreadCount: 0,
      lastMessage: {
        id: '2',
        text: 'Привет! Все отлично, спасибо!',
        sender: users[0],
        timestamp: '12:35',
        isRead: true,
      },
    },
    {
      id: '2',
      users: [users[0], users[2]],
      messages: [
        {
          id: '1',
          text: 'Когда будет готов проект?',
          sender: users[2],
          timestamp: '10:15',
          isRead: false,
        },
      ],
      unreadCount: 1,
      lastMessage: {
        id: '1',
        text: 'Когда будет готов проект?',
        sender: users[2],
        timestamp: '10:15',
        isRead: false,
      },
    },
  ]);

  const selectedChat = chats.find(chat => chat.id === activeChat) || null;

  // Инициализация SignalR соединения
  useEffect(() => {
    const token = authStorage.getAccessToken();
    if (!token) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://web.waypay.one:5001/chatHub', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => {
        console.log('SignalR Connected');
        setConnection(newConnection);
      })
      .catch(err => console.log('Connection error: ', err));

    newConnection.on('ReceiveMessage', (senderId, message, createdAt) => {
      const sender = users.find(u => u.id === senderId.toString()) || {
        id: senderId,
        name: `User ${senderId}`,
        status: 'online'
      };

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: message,
        sender,
        timestamp: createdAt,
        isRead: true
      };

      setRealTimeMessages(prev => [...prev, newMessage]);
    });

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !connection || !selectedChat) return;

    const receiver = selectedChat.users.find(u => u.id !== currentUser.id);
    
    if (receiver) {
      // Личное сообщение
      connection.invoke('SendPrivateMessage', receiver.id, inputMessage)
        .catch(err => console.error('Send error:', err));
    } else {
      // Групповое сообщение (можно добавить логику для чатов компаний)
      connection.invoke('SendGlobalMessage', inputMessage)
        .catch(err => console.error('Send error:', err));
    }

    setInputMessage('');
  };

  // Объединяем mock сообщения с реальными из SignalR
  const getCombinedMessages = () => {
    if (!selectedChat) return [];
    
    const chatMessages = selectedChat.messages;
    const relevantRealTimeMessages = realTimeMessages.filter(m => 
      selectedChat.users.some(u => u.id === m.sender.id)
    );
    
    return [...chatMessages, ...relevantRealTimeMessages];
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Левая панель - список чатов */}
      <div style={{ width: 350, borderRight: '1px solid #e8e8e8', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>Чаты</Title>
          <div style={{ background: 'rgba(0, 125, 136, 1)', borderRadius: 20, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            2
          </div>
        </div>

        <div style={{ margin: 10 }}>
          <Input.Search placeholder="Поиск чатов" />
        </div>

        <List
          dataSource={chats}
          style={{ flex: 1, overflowY: 'auto' }}
          renderItem={chat => (
            <List.Item 
              style={{ 
                cursor: 'pointer', 
                backgroundColor: activeChat === chat.id ? 'rgba(0, 125, 136, 0.3)' : 'transparent',
                padding: 15
              }}
              onClick={() => setActiveChat(chat.id)}
            >
              <Badge dot={chat.unreadCount > 0}>
                <Avatar icon={<UserOutlined />} />
              </Badge>
              <div style={{ marginLeft: 12, overflow: 'hidden' }}>
                <Text strong>
                  {chat.users.find(u => u.id !== currentUser.id)?.name}
                </Text>
                <Text type="secondary" ellipsis style={{ display: 'block' }}>
                  {chat.lastMessage.text}
                </Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {chat.lastMessage.timestamp}
              </Text>
            </List.Item>
          )}
        />
      </div>

      {/* Центральная панель - выбранный чат */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
        {selectedChat ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Badge dot={selectedChat.users.find(u => u.id !== currentUser.id)?.status === 'online'}>
                  <Avatar icon={<UserOutlined />} />
                </Badge>
                <div style={{ marginLeft: 12 }}>
                  <Text strong>{selectedChat.users.find(u => u.id !== currentUser.id)?.name}</Text>
                  <Text type="secondary" style={{ display: 'block' }}>
                    {selectedChat.users.find(u => u.id !== currentUser.id)?.status === 'online' 
                      ? 'online' 
                      : `был(а) ${selectedChat.users.find(u => u.id !== currentUser.id)?.lastSeen}`}
                  </Text>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, padding: 16, overflowY: 'auto', backgroundColor: '#fafafa' }}>
              {getCombinedMessages().map(msg => (
                <div 
                  key={msg.id} 
                  style={{ 
                    marginBottom: 16, 
                    display: 'flex', 
                    justifyContent: msg.sender.id === currentUser.id ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div 
                    style={{ 
                      maxWidth: '60%', 
                      padding: '8px 12px', 
                      borderRadius: 8,
                      backgroundColor: msg.sender.id === currentUser.id ? '#1890ff' : 'white',
                      color: msg.sender.id === currentUser.id ? 'white' : 'inherit',
                      border: msg.sender.id !== currentUser.id ? '1px solid #e8e8e8' : 'none'
                    }}
                  >
                    <Text>{msg.text}</Text>
                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                      {msg.timestamp}
                    </Text>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 16, display: 'flex', alignItems: 'center', borderTop: '1px solid #e8e8e8' }}>
              <PaperClipOutlined style={{ fontSize: 20, color: '#1890ff', cursor: 'pointer' }} />
              <Input
                placeholder="Написать сообщение..."
                suffix={<SmileOutlined />}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onPressEnter={handleSendMessage}
                style={{ flex: 1, margin: '0 12px' }}
              />
              <SendOutlined 
                style={{ fontSize: 20, color: '#1890ff', cursor: 'pointer' }} 
                onClick={handleSendMessage}
              />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#8c8c8c' }}>
            <MessageOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={4}>Выберите чат</Title>
            <Text type="secondary">Начните общение с кем-нибудь</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;