import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import apiClient from "../api/client";
import { authStorage } from "../api/utils/auth-storage";
import logoImage from "../assets/logos/logo.svg";
import CustomPhoneInput from "../components/ui/fields/PhoneInput";
import AuthCallModal from "../components/modal/AuthCallModal";
import AuthWhatsAppModal from "../components/modal/AuthWhatsAppModal";
import PinCodeModal from "../components/modal/PinCodeModal";
import WayPayButton from "../components/ui/Buttons/WayPayButton";

type AuthWay = "CallCheck" | "WhatsAppCode";

interface AuthPageProps {
  onLoginSuccess: (token: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [rawPhone, setRawPhone] = useState("");
  const [authWay, setAuthWay] = useState<AuthWay>("CallCheck");
  const [showCallModal, setShowCallModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [callPhone, setCallPhone] = useState("");
  const [checkId, setCheckId] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const verificationInterval = useRef<number | undefined>(undefined);
  const [showPinModal, setShowPinModal] = useState(false);
  const [authCompleted, setAuthCompleted] = useState(false);

  useEffect(() => {
    return () => {
      if (verificationInterval.current) {
        clearInterval(verificationInterval.current);
      }
    };
  }, []);

  const stopPolling = () => {
    if (verificationInterval.current) {
      window.clearInterval(verificationInterval.current);
      verificationInterval.current = undefined;
    }
  };

  const closeCallModal = () => {
    setShowCallModal(false);
    stopPolling();
  };

  const closeWhatsAppModal = () => {
    setShowWhatsAppModal(false);
    setVerificationError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawPhone) return;

    setIsLoading(true);
    setVerificationError("");
    try {
      const response = await apiClient.post("/Auth/start", {
        phone: rawPhone,
        userType: "employee",
        authWay,
      });

      if (authWay === "WhatsAppCode") {
        setCheckId("");
        setCallPhone("");
        setShowWhatsAppModal(true);
      } else {
        setCheckId(response.data.checkId);
        setCallPhone(response.data.callPhone);
        setShowCallModal(true);
        startVerificationPolling(rawPhone, response.data.checkId);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.response?.status === 400) {
        alert(error.response.data);
      } else {
        alert("Произошла ошибка при авторизации");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startVerificationPolling = (phone: string, id: string) => {
    stopPolling();

    verificationInterval.current = window.setInterval(() => {
      verifyCallAuth(phone, id);
    }, 3000);
  };

  const handleAuthSuccess = (
    accessToken: string,
    refreshToken: string,
    sessionId?: string | null
  ) => {
    // Сохраняем как отдельный аккаунт (мультиаккаунт). sessionId опционален.
    authStorage.addAccount({ accessToken, refreshToken, sessionId });
    stopPolling();
    setShowCallModal(false);
    setShowWhatsAppModal(false);

    // Режим «добавить аккаунт»: уже залогинены под другим — просто
    // переключаемся на новый и даём App запросить пин заново.
    const isAddAccount = sessionStorage.getItem("wp_add_account") === "1";
    if (isAddAccount) {
      sessionStorage.removeItem("wp_add_account");
      sessionStorage.removeItem("lastActivity");
      window.location.href = "/credits";
      return;
    }
    setShowPinModal(true);
  };

  const verifyCallAuth = async (phone: string, id: string) => {
    if (isVerifying) return;

    setIsVerifying(true);
    try {
      const response = await apiClient.post("/Auth/confirm", {
        phone: phone,
        checkId: id,
        userType: "employee",
        authWay: "CallCheck",
      });

      if (response.data.accessToken && response.data.refreshToken) {
        handleAuthSuccess(
          response.data.accessToken,
          response.data.refreshToken,
          response.data.sessionId
        );
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationError("Ошибка проверки авторизации");
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyWhatsAppCode = async (code: string) => {
    if (isVerifying) return;

    setIsVerifying(true);
    setVerificationError("");
    try {
      const response = await apiClient.post("/Auth/confirm", {
        phone: rawPhone,
        checkId: code,
        userType: "employee",
        authWay: "WhatsAppCode",
      });

      if (response.data.accessToken && response.data.refreshToken) {
        handleAuthSuccess(
          response.data.accessToken,
          response.data.refreshToken,
          response.data.sessionId
        );
      } else {
        setVerificationError("Неверный код. Попробуйте ещё раз.");
      }
    } catch (error: any) {
      console.error("WhatsApp verification error:", error);
      setVerificationError(
        error.response?.data?.message ||
          error.response?.data ||
          "Неверный код. Попробуйте ещё раз."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    setAuthCompleted(true);
    sessionStorage.setItem("lastActivity", Date.now().toString());
    onLoginSuccess(authStorage.getAccessToken()!);
    window.location.href = "/credits";
  };

  return (
    <AuthContainer>
      <AuthCard>
        <Logo>
          <LogoImage src={logoImage} alt="WayPay Logo" />
        </Logo>

        <AuthForm onSubmit={handleSubmit}>
          <Title>Авторизация</Title>

          <FormGroup>
            <InputContainer>
              <CustomPhoneInput
                value={rawPhone}
                onChange={(value: string) => setRawPhone(value)}
                placeholder="8 (xxx) xxx-xx-xx"
              />
            </InputContainer>
          </FormGroup>

          <MethodToggle role="tablist" aria-label="Способ авторизации">
            <MethodOption
              type="button"
              role="tab"
              aria-selected={authWay === "CallCheck"}
              $active={authWay === "CallCheck"}
              onClick={() => setAuthWay("CallCheck")}
            >
              Звонок
            </MethodOption>
            <MethodOption
              type="button"
              role="tab"
              aria-selected={authWay === "WhatsAppCode"}
              $active={authWay === "WhatsAppCode"}
              onClick={() => setAuthWay("WhatsAppCode")}
            >
              WhatsApp
            </MethodOption>
          </MethodToggle>

          <WayPayButton type="submit" size="large" fullWidth disabled={isLoading}>
            {isLoading ? (
              <Loader>
                <LoaderCircle />
                <LoaderCircle />
                <LoaderCircle />
              </Loader>
            ) : (
              "Войти"
            )}
          </WayPayButton>
        </AuthForm>
        <InfoText>
          Хотите получить доступ к нашим продуктам?
          <br />
          Обратитесь по номеру{" "}
          <InfoPhone href="tel:89899242424">8 989 924 24 24</InfoPhone>
          <br />
          или оставьте заявку на{" "}
          <InfoLink href="https://waypay.one" target="_blank">
            waypay.one
          </InfoLink>
        </InfoText>
      </AuthCard>

      <AuthCallModal
        isOpen={showCallModal}
        onClose={closeCallModal}
        callPhone={callPhone}
        isVerifying={isVerifying}
        error={verificationError}
      />

      <AuthWhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={closeWhatsAppModal}
        onSubmit={verifyWhatsAppCode}
        phone={rawPhone}
        isVerifying={isVerifying}
        error={verificationError}
      />

      <PinCodeModal
        isOpen={showPinModal}
        onSuccess={handlePinSuccess}
        mode="setup"
      />
    </AuthContainer>
  );
};

const InfoText = styled.div`
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
`;

const InfoPhone = styled.a`
  color: rgba(0, 125, 136, 1);
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const InfoLink = styled.a`
  color: rgba(0, 125, 136, 1);
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const AuthContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90vh;
  padding: 20px;
`;

const AuthCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 125, 136, 0.1);
  width: 100%;
  max-width: 440px;
  padding: 40px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(
      90deg,
      rgba(0, 125, 136, 1) 0%,
      rgba(37, 203, 161, 1) 100%
    );
  }

  @media (max-width: 480px) {
    padding: 30px 20px;
  }
`;

const Logo = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 0;
`;

const LogoImage = styled.img`
  height: 100px;
  width: auto;

  @media (max-width: 480px) {
    height: 40px;
  }
`;

const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 30px;
  text-align: center;
  color: #333;
  font-weight: 600;
`;

const FormGroup = styled.div`
  margin-bottom: 25px;
`;

const InputContainer = styled.div`
  position: relative;
  width: auto;
`;

const MethodToggle = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 25px;
  padding: 4px;
  background: #f5f5f5;
  border-radius: 10px;
`;

const MethodOption = styled.button<{ $active?: boolean }>`
  flex: 1;
  padding: 10px 14px;
  border-radius: 8px;
  border: none;
  background: ${(props) => (props.$active ? "white" : "transparent")};
  color: ${(props) => (props.$active ? "rgba(0, 125, 136, 1)" : "#777")};
  font-size: 14px;
  font-weight: ${(props) => (props.$active ? 600 : 500)};
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${(props) =>
    props.$active ? "0 1px 4px rgba(0, 0, 0, 0.08)" : "none"};

  &:hover {
    color: rgba(0, 125, 136, 1);
  }
`;

const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  height: 24px;
`;

const LoaderCircle = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  animation: bounce 1s infinite ease-in-out;

  &:nth-child(1) {
    animation-delay: 0s;
  }
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  &:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-6px);
    }
  }
`;

export default AuthPage;
