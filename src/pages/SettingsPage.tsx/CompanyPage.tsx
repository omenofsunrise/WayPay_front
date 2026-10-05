import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import ModalInfoTitle from "../../components/ui/Text/ModalInfoTitle";
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
      <HeaderWrapper>
        <TitleWrapper>
          <CustomTitle style={{ marginTop: 0 }}>Данные о компании</CustomTitle>
          <ModalInfoTitle>Сведения о компании</ModalInfoTitle>
        </TitleWrapper>

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
      </HeaderWrapper>

      <ContentGrid>
        <FormSection>
          <FieldsGrid>
            <InputGroup>
              <Label>Название организации</Label>
              <CustomInput
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </InputGroup>
            <InputGroup>
              <Label>Учредитель</Label>
              <CustomInput
                name="chief"
                inputType="fullname"
                value={formData.chief}
                onChange={handleInputChange}
              />
            </InputGroup>
            <InputGroup>
              <Label>Населённый пункт</Label>
              <CustomInput
                name="city"
                value={formData.city}
                onChange={handleInputChange}
              />
            </InputGroup>
            <InputGroup>
              <Label>Адрес офиса</Label>
              <CustomInput
                name="officeAddress"
                value={formData.officeAddress}
                onChange={handleInputChange}
              />
            </InputGroup>
            <InputGroup>
              <Label>Email</Label>
              <CustomInput
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </InputGroup>
            <InputGroup>
              <Label>Телефон</Label>
              <PhoneModalInput
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </InputGroup>
            <InputGroup>
              <Label>Телефон поддержки</Label>
              <PhoneModalInput
                name="supportPhone"
                value={formData.supportPhone}
                onChange={handleInputChange}
              />
            </InputGroup>
          </FieldsGrid>

          <ButtonsContainer>
            <GrayButton width="120px" onClick={handleReset}>
              Сбросить
            </GrayButton>
            <DarkCyanButton onClick={handleSave} disabled={isLoading}>
              Сохранить
            </DarkCyanButton>
          </ButtonsContainer>
        </FormSection>
      </ContentGrid>

      <FooterContainer>
        <Disclaimer>
          *Все данные компании используются только для автоматического
          оформления договора займа и не передаются третьим лицам.
        </Disclaimer>
      </FooterContainer>

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

const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 24px;
  gap: 24px;
`;

const TitleWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

const LogoContainer = styled.div`
  flex-shrink: 0;
`;

const LogoPreview = styled.div<{ $hasLogo: boolean }>`
  width: 120px;
  height: 120px;
  border-radius: 8px;
  background-color: ${(p) => (p.$hasLogo ? "transparent" : "#f5f5f5")};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px dashed ${(p) => (p.$hasLogo ? "transparent" : "#ccc")};
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;

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

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  width: 100%;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

// Поля шли строками по два, и Email, оставшийся в строке один, растягивался
// на всю ширину — среди половинных он выглядел выломанным. Сетка держит
// одинаковую ширину независимо от того, чётное число полей или нет.
const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const FooterContainer = styled.div`
  margin-top: 24px;
`;

const Disclaimer = styled.p`
  font-size: 13px;
  color: #6b7280;
  max-width: 560px;
  line-height: 1.5;
  margin: 0;
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
