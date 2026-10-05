import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import CustomInput from "../../components/ui/fields/CustomInput";
import GrayButton from "../../components/ui/Buttons/GrayButton";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import useCompany from "../../api/hooks/useCompany";
import PhoneModalInput from "../../components/ui/fields/PhoneModalInput";

// ─── Toast ────────────────────────────────────────────────────────────────────

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Toast = styled.div<{ $type: "success" | "error" | "warning" }>`
  padding: 14px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  min-width: 280px;
  max-width: 400px;
  background: ${(p) =>
    p.$type === "success"
      ? "#10b981"
      : p.$type === "error"
      ? "#ef4444"
      : "#f59e0b"};

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// ─── Icons ────────────────────────────────────────────────────────────────────

const CameraIconSvg = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
      stroke="#999"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="4" stroke="#999" strokeWidth="1.5" />
  </svg>
);

const EditIconSvg = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M13 3l4 4L6 18H2v-4L13 3z"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrashIconSvg = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const CompanyPage = () => {
  const {
    company,
    isLoading,
    error,
    getCompany,
    updateCompany,
    updateCompanyPhoto,
    deleteCompanyPhoto,
    getCompanyPhotoUrl,
  } = useCompany();

  const [formData, setFormData] = useState({
    name: "",
    chief: "",
    city: "",
    officeAddress: "",
    bank: "",
    phone: "",
    inn: "",
    email: "",
    supportPhone: "",
    currentBankCardId: null as number | null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const [toasts, setToasts] = useState<
    { id: number; type: "success" | "error" | "warning"; message: string }[]
  >([]);

  const addToast = useCallback(
    (type: "success" | "error" | "warning", msg: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, message: msg }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000
      );
    },
    []
  );

  useEffect(() => {
    getCompany();
  }, [getCompany]);

  useEffect(() => {
    if (!company) return;
    setFormData({
      name: company.name || "",
      chief: company.chief || "",
      city: company.city || "",
      officeAddress: company.officeAddress || "",
      bank: company.bank || "",
      phone: company.phone || "",
      inn: company.inn || "",
      email: company.email || "",
      supportPhone: company.supportPhone || "",
      currentBankCardId: company.currentBankCardId || null,
    });
    setPreviewUrl(
      company.photoPath ? getCompanyPhotoUrl(company.photoPath) : null
    );
  }, [company, getCompanyPhotoUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    if (!company) return;
    setFormData({
      name: company.name || "",
      chief: company.chief || "",
      city: company.city || "",
      officeAddress: company.officeAddress || "",
      bank: company.bank || "",
      phone: company.phone || "",
      inn: company.inn || "",
      email: company.email || "",
      supportPhone: company.supportPhone || "",
      currentBankCardId: company.currentBankCardId || null,
    });
    setPreviewUrl(
      company.photoPath ? getCompanyPhotoUrl(company.photoPath) : null
    );
  };

  const handleSave = async () => {
    try {
      await updateCompany(formData);
      addToast("success", "Данные компании успешно сохранены");
    } catch (err) {
      console.error(err);
      addToast("error", "Не удалось сохранить данные компании");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    try {
      await updateCompanyPhoto(file);
      addToast("success", "Логотип успешно обновлён");
      await getCompany();
    } catch (err) {
      console.error(err);
      addToast("error", "Не удалось загрузить логотип");
      setPreviewUrl(
        company?.photoPath ? getCompanyPhotoUrl(company.photoPath) : null
      );
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await deleteCompanyPhoto();
      setPreviewUrl(null);
      setShowContextMenu(false);
      addToast("success", "Логотип удалён");
      await getCompany();
    } catch (err) {
      console.error(err);
      addToast("error", "Не удалось удалить логотип");
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (e.type === "contextmenu") {
      e.preventDefault();
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
      return;
    }
    if (e.button === 0) {
      document.getElementById("logo-upload")?.click();
    }
  };

  if (isLoading && !company) {
    return <PageLayout>Загрузка...</PageLayout>;
  }

  if (error) {
    return <PageLayout>Ошибка: {error}</PageLayout>;
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageTitle>Данные о компании</PageTitle>
        <PageSubtitle>Здесь указаны основные сведения о вашей компании.</PageSubtitle>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Основная информация</CardTitle>
            <CardSubtitle>
              Эти данные будут использоваться для автоматического оформления
              договора займа.
            </CardSubtitle>
          </CardHeading>

          <LogoContainer>
            <LogoPreview
              $hasLogo={!!previewUrl}
              onClick={handleLogoClick}
              onContextMenu={handleLogoClick}
              title={
                previewUrl
                  ? "Нажмите для замены логотипа"
                  : "Нажмите для загрузки логотипа"
              }
            >
              {previewUrl ? (
                <>
                  <LogoImage src={previewUrl} alt="Логотип компании" />
                  <EditOverlay>
                    <EditIconSvg />
                  </EditOverlay>
                </>
              ) : (
                <CameraIconSvg />
              )}
            </LogoPreview>

            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: "none" }}
              id="logo-upload"
              disabled={isUploading}
            />
          </LogoContainer>
        </CardHeader>

        <FieldsGrid>
          <InputGroup>
            <Label>Название организации</Label>
            <FieldShell>
              <FieldIcon><BuildingIconSvg /></FieldIcon>
              <CustomInput
                  name="name"
                  placeholder="Введите название"
                value={formData.name}
                onChange={handleInputChange}
              />
            </FieldShell>
          </InputGroup>
          <InputGroup>
            <Label>Учредитель</Label>
            <FieldShell>
              <FieldIcon><PersonIconSvg /></FieldIcon>
              <CustomInput
                  name="chief"
                  inputType="fullname"
                  placeholder="Введите ФИО учредителя"
                value={formData.chief}
                onChange={handleInputChange}
              />
            </FieldShell>
          </InputGroup>
          <InputGroup>
            <Label>Населённый пункт</Label>
            <FieldShell>
              <FieldIcon><PinIconSvg /></FieldIcon>
              <CustomInput
                  name="city"
                  placeholder="Введите населённый пункт"
                value={formData.city}
                onChange={handleInputChange}
              />
            </FieldShell>
          </InputGroup>
          <InputGroup>
            <Label>Адрес офиса</Label>
            <FieldShell>
              <FieldIcon><PinIconSvg /></FieldIcon>
              <CustomInput
                  name="officeAddress"
                  placeholder="Введите адрес офиса"
                value={formData.officeAddress}
                onChange={handleInputChange}
              />
            </FieldShell>
          </InputGroup>
          <InputGroup>
            <Label>Email</Label>
            <FieldShell>
              <FieldIcon><MailIconSvg /></FieldIcon>
              <CustomInput
                  name="email"
                  type="email"
                  placeholder="Введите email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </FieldShell>
          </InputGroup>
          <InputGroup>
            <Label>Телефон</Label>
            <FieldShell>
              <FieldIcon><PhoneIconSvg /></FieldIcon>
              <PhoneModalInput
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </FieldShell>
          </InputGroup>
          <InputGroup>
            <Label>Телефон поддержки</Label>
            <FieldShell>
              <FieldIcon><PhoneIconSvg /></FieldIcon>
              <PhoneModalInput
                name="supportPhone"
                value={formData.supportPhone}
                onChange={handleInputChange}
              />
            </FieldShell>
          </InputGroup>
        </FieldsGrid>

        <CardFooter>
          <DisclaimerRow>
            <InfoIconSvg />
            <Disclaimer>
              Все данные компании используются только для автоматического
              оформления договора займа и не передаются третьим лицам.
            </Disclaimer>
          </DisclaimerRow>

          <ButtonsContainer>
            <GrayButton width="120px" onClick={handleReset}>
              Сбросить
            </GrayButton>
            <DarkCyanButton onClick={handleSave} disabled={isLoading}>
              Сохранить изменения
            </DarkCyanButton>
          </ButtonsContainer>
        </CardFooter>
      </Card>

      {showContextMenu && (
        <>
          <ContextMenuBackdrop onClick={() => setShowContextMenu(false)} />
          <ContextMenu
            style={{ left: menuPosition.x - 200, top: menuPosition.y }}
          >
            <ContextMenuItem
              onClick={() => {
                document.getElementById("logo-upload")?.click();
                setShowContextMenu(false);
              }}
            >
              <EditIconSvg /> Изменить логотип
            </ContextMenuItem>
            <ContextMenuItem $danger onClick={handleRemoveLogo}>
              <TrashIconSvg /> Удалить логотип
            </ContextMenuItem>
          </ContextMenu>
        </>
      )}

      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} $type={t.type}>
            {t.type === "success" ? "✓ " : t.type === "error" ? "✕ " : "⚠ "}
            {t.message}
          </Toast>
        ))}
      </ToastContainer>
    </PageLayout>
  );
};

// ─── Styled components ─────────────────────────────────────────────────────────

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const BuildingIconSvg = () => (
  <svg {...iconProps}>
    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M16 21V9h3a2 2 0 0 1 2 2v10" />
    <path d="M9 7h2M9 11h2M9 15h2" />
  </svg>
);

const PersonIconSvg = () => (
  <svg {...iconProps}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PinIconSvg = () => (
  <svg {...iconProps}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const MailIconSvg = () => (
  <svg {...iconProps}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

const PhoneIconSvg = () => (
  <svg {...iconProps}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);

const InfoIconSvg = () => (
  <svg {...iconProps} width={16} height={16}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const PageHeader = styled.div`
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
`;

const PageSubtitle = styled.p`
  margin: 8px 0 0;
  font-size: 15px;
  color: #6b7280;
`;

const Card = styled.section`
  background: #ffffff;
  border: 1px solid #eef1f4;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04),
    0 8px 24px rgba(16, 24, 40, 0.04);
  padding: 32px;
  width: 100%;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
`;

const CardHeading = styled.div`
  min-width: 0;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
`;

const CardSubtitle = styled.p`
  margin: 6px 0 0;
  font-size: 14px;
  color: #6b7280;
  max-width: 640px;
`;

const LogoContainer = styled.div`
  flex-shrink: 0;
`;

const LogoPreview = styled.div<{ $hasLogo: boolean }>`
  width: 88px;
  height: 88px;
  border-radius: 20px;
  background-color: ${(p) => (p.$hasLogo ? "transparent" : "#f3f5f7")};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px dashed ${(p) => (p.$hasLogo ? "transparent" : "#d4d9df")};
  position: relative;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #007d88;
  }

  &:hover > div:last-child {
    opacity: 1;
  }
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const EditOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

// Полей семь, на пары не делится. Сетка держит одинаковую ширину независимо
// от чётности: последнее поле занимает свою колонку и не расползается.
const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 24px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #475569;
`;

// Поле ввода своих значков не умеет, поэтому значок кладётся поверх, а полю
// добавляется отступ слева.
const FieldShell = styled.div`
  position: relative;
  width: 100%;

  input {
    width: 100%;
    padding-left: 44px;
  }
`;

const FieldIcon = styled.span`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: #94a3b8;
  pointer-events: none;
  z-index: 1;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid #eef1f4;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const DisclaimerRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #94a3b8;
  min-width: 0;
`;

const Disclaimer = styled.p`
  font-size: 13px;
  color: #6b7280;
  max-width: 560px;
  line-height: 1.5;
  margin: 0;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-shrink: 0;
`;

const ContextMenuBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
`;

const ContextMenu = styled.div`
  position: fixed;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 180px;
  padding: 4px 0;
  border: 1px solid #e5e7eb;
`;

const ContextMenuItem = styled.div<{ $danger?: boolean }>`
  padding: 9px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: ${(p) => (p.$danger ? "#ef4444" : "#374151")};
  transition: background 0.15s;

  &:hover {
    background: #f9fafb;
  }
`;

export default CompanyPage;
