import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, Badge, Input, List, Menu, Tabs, Typography } from 'antd';
import {
  MessageOutlined,
  UserOutlined,
  SearchOutlined,
  MoreOutlined,
  PaperClipOutlined,
  SendOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

type ChatPageParams = {
  chatId?: string;
};

const { Text, Title } = Typography;

// Styled components
const ChatPageContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
`;

const ChatListPanel = styled.div`
  width: 350px;
  border-right: 1px solid #e8e8e8;
  background-color: white;
  display: flex;
  flex-direction: column;
`;

const ChatListHeader = styled.div`
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
`;

const ChatListActions = styled.div`
  display: flex;
  gap: 16px;
`;

const ChatSearchInput = styled(Input)`
  margin: 16px;
`;

const ChatList = styled(List)`
  flex: 1;
  overflow-y: auto;
`;

const ChatItem = styled(List.Item)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  background-color: ${props => props.$active ? '#e6f7ff' : 'transparent'};

  &:hover {
    background-color: #f5f5f5;
  }
`;

const ChatItemContent = styled.div`
  flex: 1;
  margin-left: 12px;
  overflow: hidden;
`;

const ChatItemTime = styled(Text)`
  font-size: 12px;
`;

const ChatMainPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
`;

const ChatHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatUserInfo = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const ChatUserDetails = styled.div`
  margin-left: 12px;
`;

const ChatActions = styled.div`
  display: flex;
  gap: 16px;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #fafafa;
`;

const Message = styled.div<{ $sent?: boolean }>`
  margin-bottom: 16px;
  display: flex;
  justify-content: ${props => props.$sent ? 'flex-end' : 'flex-start'};
`;

const MessageContent = styled.div<{ $sent?: boolean }>`
  max-width: 60%;
  padding: 8px 12px;
  border-radius: 8px;
  position: relative;
  background-color: ${props => props.$sent ? '#1890ff' : 'white'};
  color: ${props => props.$sent ? 'white' : 'inherit'};
  border: ${props => !props.$sent ? '1px solid #e8e8e8' : 'none'};
`;

const MessageTime = styled(Text)`
  font-size: 11px;
  margin-left: 8px;
`;

const ChatInputContainer = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
  border-top: 1px solid #e8e8e8;
`;

const MessageInput = styled(Input)`
  flex: 1;
  margin: 0 12px;
`;

const InputAction = styled.div`
  font-size: 20px;
  color: #1890ff;
  cursor: pointer;
`;

const ChatEmpty = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #8c8c8c;
`;

const ChatInfoPanel = styled.div`
  width: 350px;
  border-left: 1px solid #e8e8e8;
  background-color: white;
  display: flex;
  flex-direction: column;
`;

const ChatInfoHeader = styled.div`
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
`;

const ChatInfoContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const UserInfoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`;

const MediaSection = styled.div`
  padding: 16px 0;
`;

const FilesSection = styled.div`
  padding: 16px 0;
`;

const ChatInfoTabs = styled(Tabs)`
  margin-top: 16px;
`;

// Types and data
interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

interface Message {
  id: string;
  text: string;
  sender: User;
  timestamp: string;
  isRead: boolean;
}

interface Chat {
  id: string;
  users: User[];
  messages: Message[];
  unreadCount: number;
  lastMessage: Message;
}

const ChatPage: React.FC = () => {
  const { chatId } = useParams<ChatPageParams>();
  const [activeChat, setActiveChat] = useState<string | null>(chatId || null);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock данные
  const currentUser: User = {
    id: '1',
    name: 'Иван Иванов',
    avatar: '',
    status: 'online',
  };

  const users: User[] = [
    currentUser,
    {
      id: '2',
      name: 'Мария Петрова',
      avatar: '',
      status: 'online',
    },
    {
      id: '3',
      name: 'Алексей Смирнов',
      avatar: '',
      status: 'offline',
      lastSeen: '2 часа назад',
    },
  ];

  const chats: Chat[] = [
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
  ];

  const selectedChat = chats.find(chat => chat.id === activeChat) || null;

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    setShowChatInfo(false);
  };

  const handleUserClick = () => {
    setShowChatInfo(!showChatInfo);
  };

  const filteredChats = chats.filter(chat =>
    chat.users.some(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <ChatPageContainer>
      {/* Левая панель - список чатов */}
      <ChatListPanel>
        <ChatListHeader>
          <Title level={4} style={{ margin: 0 }}>
            Чаты
          </Title>
          <ChatListActions>
            <SearchOutlined />
            <MoreOutlined />
          </ChatListActions>
        </ChatListHeader>

        <ChatSearchInput
          placeholder="Поиск чатов"
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        <ChatList
          dataSource={filteredChats}
          renderItem={chat => (
            <ChatItem
              $active={activeChat === chat.id}
              onClick={() => handleChatSelect(chat.id)}
            >
              <Badge dot={chat.unreadCount > 0}>
                <Avatar
                  icon={<UserOutlined />}
                  src={chat.users.find(u => u.id !== currentUser.id)?.avatar}
                />
              </Badge>
              <ChatItemContent>
                <Text strong>
                  {chat.users.find(u => u.id !== currentUser.id)?.name}
                </Text>
                <Text type="secondary" ellipsis>
                  {chat.lastMessage.text}
                </Text>
              </ChatItemContent>
              <ChatItemTime type="secondary">
                {chat.lastMessage.timestamp}
              </ChatItemTime>
            </ChatItem>
          )}
        />
      </ChatListPanel>

      {/* Центральная панель - выбранный чат */}
      <ChatMainPanel>
        {selectedChat ? (
          <>
            <ChatHeader>
              <ChatUserInfo onClick={handleUserClick}>
                <Badge
                  dot={selectedChat.users.find(u => u.id !== currentUser.id)?.status === 'online'}
                  status="success"
                >
                  <Avatar
                    icon={<UserOutlined />}
                    src={selectedChat.users.find(u => u.id !== currentUser.id)?.avatar}
                  />
                </Badge>
                <ChatUserDetails>
                  <Text strong>
                    {selectedChat.users.find(u => u.id !== currentUser.id)?.name}
                  </Text>
                  <Text type="secondary">
                    {selectedChat.users.find(u => u.id !== currentUser.id)?.status === 'online'
                      ? 'online'
                      : `был(а) ${selectedChat.users.find(u => u.id !== currentUser.id)?.lastSeen}`}
                  </Text>
                </ChatUserDetails>
              </ChatUserInfo>
              <ChatActions>
                <SearchOutlined />
                <MoreOutlined />
              </ChatActions>
            </ChatHeader>

            <ChatMessages>
              {selectedChat.messages.map(message => (
                <Message
                  key={message.id}
                  $sent={message.sender.id === currentUser.id}
                >
                  <MessageContent $sent={message.sender.id === currentUser.id}>
                    <Text>{message.text}</Text>
                    <MessageTime type="secondary">
                      {message.timestamp}
                    </MessageTime>
                  </MessageContent>
                </Message>
              ))}
            </ChatMessages>

            <ChatInputContainer>
              <InputAction>
                <PaperClipOutlined />
              </InputAction>
              <MessageInput
                placeholder="Написать сообщение..."
                suffix={<SmileOutlined />}
              />
              <InputAction>
                <SendOutlined />
              </InputAction>
            </ChatInputContainer>
          </>
        ) : (
          <ChatEmpty>
            <MessageOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <Title level={4}>Выберите чат</Title>
            <Text type="secondary">Начните общение с кем-нибудь</Text>
          </ChatEmpty>
        )}
      </ChatMainPanel>

      {/* Правая панель - информация о чате (отображается при клике на пользователя) */}
      {showChatInfo && selectedChat && (
        <ChatInfoPanel>
          <ChatInfoHeader>
            <Title level={4} style={{ margin: 0 }}>
              Информация о чате
            </Title>
            <MoreOutlined />
          </ChatInfoHeader>

          <ChatInfoContent>
            <UserInfoSection>
              <Avatar
                size={64}
                icon={<UserOutlined />}
                src={selectedChat.users.find(u => u.id !== currentUser.id)?.avatar}
              />
              <Title level={5} style={{ marginTop: 16 }}>
                {selectedChat.users.find(u => u.id !== currentUser.id)?.name}
              </Title>
              <Text type="secondary">
                {selectedChat.users.find(u => u.id !== currentUser.id)?.status === 'online'
                  ? 'online'
                  : `был(а) ${selectedChat.users.find(u => u.id !== currentUser.id)?.lastSeen}`}
              </Text>
            </UserInfoSection>

            <ChatInfoTabs defaultActiveKey="1">
              <Tabs.TabPane tab="Медиа" key="1">
                <MediaSection>
                  <Text type="secondary">Нет медиафайлов</Text>
                </MediaSection>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Файлы" key="2">
                <FilesSection>
                  <Text type="secondary">Нет файлов</Text>
                </FilesSection>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Участники" key="3">
                <List
                  dataSource={selectedChat.users}
                  renderItem={user => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Badge dot={user.status === 'online'}>
                            <Avatar icon={<UserOutlined />} src={user.avatar} />
                          </Badge>
                        }
                        title={user.name}
                        description={
                          user.id === currentUser.id
                            ? 'Это вы'
                            : user.status === 'online'
                            ? 'online'
                            : `был(а) ${user.lastSeen}`
                        }
                      />
                    </List.Item>
                  )}
                />
              </Tabs.TabPane>
            </ChatInfoTabs>
          </ChatInfoContent>
        </ChatInfoPanel>
      )}
    </ChatPageContainer>
  );
};

export default ChatPage;