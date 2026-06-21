import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import PageLayout from "../components/ui/Layouts/PageLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import WhatsAppChat from "../components/WhatsAppChat";

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: rgba(0, 125, 136, 1);
  font-size: 15px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;

  &:hover {
    background: rgba(0, 125, 136, 0.08);
  }
`;

const CampaignTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(124, 58, 237, 0.12);
  color: #7c3aed;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
`;

const EmptyState = styled.div`
  padding: 40px;
  text-align: center;
  color: #6b7280;
`;

// Открывается по клику на уведомление типа admin_whats_app
// (клиент ответил на рекламную рассылку). Путь: /admin/whatsapp/:phone
const AdminWhatsAppChatPage = () => {
  const { phone } = useParams<{ phone: string }>();
  const navigate = useNavigate();

  return (
    <PageLayout>
      <Header>
        <BackButton onClick={() => navigate("/admin")}>
          ← В админ-панель
        </BackButton>
        <CustomTitle>Чат с клиентом</CustomTitle>
        <CampaignTag>📣 Ответ на рекламу</CampaignTag>
      </Header>

      {phone ? (
        <WhatsAppChat phoneNumber={phone} height="70vh" />
      ) : (
        <EmptyState>Номер телефона не указан в ссылке.</EmptyState>
      )}
    </PageLayout>
  );
};

export default AdminWhatsAppChatPage;
