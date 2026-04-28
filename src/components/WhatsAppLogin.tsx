import React, { useState, useEffect, useCallback } from 'react';
import useWhatsApp from '../api/hooks/useWhatsApp';

interface QRCodeAuthProps {
  userId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  pollingInterval?: number;
}

const QRCodeAuth: React.FC<QRCodeAuthProps> = ({
  userId,
  onSuccess,
  onError,
  pollingInterval = 3000
}) => {
  const {
    isLoading,
    error,
    qrData,
    channelStatus,
    getQR,
    getChannelStatus,
    clearResults
  } = useWhatsApp();

  const [pollingActive, setPollingActive] = useState(true);
  const [countdown, setCountdown] = useState<number>(0);

  const fetchQR = useCallback(async () => {
    if (!userId) return;
    const result = await getQR(userId);
    if (result?.qrCode && result.expiresAt) {
      const expiresIn = Math.max(0, Math.floor(
        (new Date(result.expiresAt).getTime() - Date.now()) / 1000
      ));
      setCountdown(expiresIn);
    }
  }, [userId, getQR]);

  // Проверка статуса подключения
  const checkStatus = useCallback(async () => {
    const status = await getChannelStatus();
    
    if (status?.isConnected && status.status === 'connected') {
      setPollingActive(false);
      onSuccess?.();
    }
  }, [getChannelStatus, onSuccess]);

  // Обработка ошибок
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  // Загрузка QR при монтировании
  useEffect(() => {
    fetchQR();
    
    return () => {
      clearResults();
    };
  }, [fetchQR, clearResults]);

  // Периодическая проверка статуса
  useEffect(() => {
    if (!pollingActive) return;

    const interval = setInterval(() => {
      checkStatus();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingActive, checkStatus, pollingInterval]);

  // Таймер обратного отсчета для QR
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Обновление QR при истечении времени
  useEffect(() => {
    if (countdown === 0 && qrData) {
      fetchQR();
    }
  }, [countdown, qrData, fetchQR]);

  // Форматирование времени
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Рендер статуса подключения
  const renderStatus = () => {
    if (!channelStatus) return null;

    const statusConfig = {
      connected: { text: 'Подключено', className: 'status-connected', icon: '✅' },
      connecting: { text: 'Подключение...', className: 'status-connecting', icon: '🔄' },
      scanning: { text: 'Ожидание сканирования...', className: 'status-scanning', icon: '📱' },
      disconnected: { text: 'Отключено', className: 'status-disconnected', icon: '❌' }
    };

    const config = statusConfig[channelStatus.status];
    
    return (
      <div className={`qr-status ${config.className}`}>
        <span className="status-icon">{config.icon}</span>
        <span className="status-text">{config.text}</span>
        {channelStatus.deviceName && (
          <span className="device-name">({channelStatus.deviceName})</span>
        )}
      </div>
    );
  };

  return (
    <div className="qr-auth-container">
      <div className="qr-auth-header">
        <h2>Авторизация WhatsApp</h2>
        <p>Отсканируйте QR-код с помощью WhatsApp на вашем телефоне</p>
      </div>

      {renderStatus()}

      <div className="qr-code-wrapper">
        {isLoading && !qrData ? (
          <div className="qr-loading">
            <div className="spinner"></div>
            <p>Загрузка QR-кода...</p>
          </div>
        ) : qrData?.qrCode ? (
          <>
            <div className="qr-code">
              <img 
                src={qrData.qrCode} 
                alt="WhatsApp QR Code"
                className="qr-image"
              />
            </div>
            {countdown > 0 && (
              <div className="qr-timer">
                <div className="timer-progress">
                  <div 
                    className="timer-progress-bar"
                    style={{ 
                      width: `${(countdown / 60) * 100}%`,
                      transition: 'width 1s linear'
                    }}
                  />
                </div>
                <p className="timer-text">
                  QR-код действителен: {formatTime(countdown)}
                </p>
              </div>
            )}
          </>
        ) : error ? (
          <div className="qr-error">
            <p>Ошибка: {error}</p>
            <button onClick={fetchQR} className="btn-retry">
              Попробовать снова
            </button>
          </div>
        ) : null}
      </div>

      <div className="qr-instructions">
        <h3>Инструкция:</h3>
        <ol>
          <li>Откройте WhatsApp на вашем телефоне</li>
          <li>Перейдите в настройки (три точки) → WhatsApp Web</li>
          <li>Нажмите "Привязать устройство"</li>
          <li>Отсканируйте QR-код с экрана</li>
        </ol>
      </div>

      {channelStatus?.status === 'scanning' && (
        <div className="qr-waiting">
          <div className="pulse-animation"></div>
          <p>Ожидание сканирования...</p>
          <p className="waiting-hint">
            После сканирования кода произойдет автоматическое подключение
          </p>
        </div>
      )}

      <style>{`
        .qr-auth-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .qr-auth-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .qr-auth-header h2 {
          margin: 0 0 8px 0;
          color: #075e54;
        }

        .qr-auth-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .qr-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .status-connected {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .status-connecting {
          background: #fff3e0;
          color: #ed6c02;
        }

        .status-scanning {
          background: #e3f2fd;
          color: #0288d1;
        }

        .status-disconnected {
          background: #ffebee;
          color: #d32f2f;
        }

        .qr-code-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .qr-code {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .qr-image {
          width: 250px;
          height: 250px;
          display: block;
        }

        .qr-timer {
          margin-top: 16px;
          text-align: center;
        }

        .timer-progress {
          width: 100%;
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .timer-progress-bar {
          height: 100%;
          background: #25d366;
          transition: width 1s linear;
        }

        .timer-text {
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        .qr-loading {
          text-align: center;
          padding: 60px;
        }

        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #25d366;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .qr-error {
          text-align: center;
          padding: 40px;
        }

        .btn-retry {
          background: #075e54;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 16px;
        }

        .btn-retry:hover {
          background: #054d44;
        }

        .qr-instructions {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .qr-instructions h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #075e54;
        }

        .qr-instructions ol {
          margin: 0;
          padding-left: 20px;
        }

        .qr-instructions li {
          margin: 8px 0;
          color: #333;
          font-size: 14px;
        }

        .qr-waiting {
          text-align: center;
          padding: 20px;
          background: #e3f2fd;
          border-radius: 8px;
          position: relative;
        }

        .pulse-animation {
          width: 60px;
          height: 60px;
          background: #25d366;
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        .waiting-hint {
          font-size: 12px;
          color: #666;
          margin-top: 12px;
        }
      `}</style>
    </div>
  );
};

export default QRCodeAuth;