import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import CustomInput from "../../components/ui/fields/CustomInput";
import GrayButton from "../../components/ui/Buttons/GrayButton";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import useCompany from "../../api/hooks/useCompany";
import PhoneModalInput from "../../components/ui/fields/PhoneModalInput";
import ToggleSwitch from "../../components/ui/Toggles/ToggleSwitch";
import companyService from "../../api/services/companyService";
import { useAuth } from "../../сontext/AuthContext";

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

const ContractApprovalIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 2v5h5M9 14l2 2 4-4"
      stroke="currentColor"
      strokeWidth="1.8"
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

  const { authInfo, refresh } = useAuth();
  const creditAcceptance = authInfo?.employee.creditAcceptance ?? true;
  const [isSavingSetting, setIsSavingSetting] = useState(false);

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

  const handleCreditAcceptanceChange = useCallback(
    async (checked: boolean) => {
      setIsSavingSetting(true);
      try {
        await companyService.updateSettings(
          "credit_acceptence",
          checked ? "on" : "off"
        );
        // Признак приходит в данных авторизации, и от него зависят кнопки на
        // других страницах. Перечитываем, чтобы они обновились сразу.
        await refresh();
        addToast(
          "success",
          checked
            ? "Подтверждение договоров включено"
            : "Подтверждение договоров выключено"
        );
      } catch (error) {
        console.error("Не удалось изменить настройку:", error);
        addToast("error", "Не удалось изменить настройку");
      } finally {
        setIsSavingSetting(false);
      }
    },
    [addToast, refresh]
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
    return <CompanyPageLayout>Загрузка...</CompanyPageLayout>;
  }

  if (error) {
    return <CompanyPageLayout>Ошибка: {error}</CompanyPageLayout>;
  }

  return (
    <CompanyPageLayout>
      <PageHeading>
        <h1>Данные о компании</h1>
        <p>Основные сведения, которые используются при оформлении договоров.</p>
      </PageHeading>

      <CompanyCard>
        <CardHeader>
          <CardTitle>
            <h2>Основная информация</h2>
            <p>Проверьте реквизиты и контактные данные вашей компании.</p>
          </CardTitle>

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

        <FormGrid>
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
          <InputGroup $wide>
            <Label>Телефон поддержки</Label>
            <PhoneModalInput
              name="supportPhone"
              value={formData.supportPhone}
              onChange={handleInputChange}
            />
          </InputGroup>
        </FormGrid>

        <SettingsSection>
          <SettingContent>
            <SettingIcon>
              <ContractApprovalIcon />
            </SettingIcon>
            <SettingText>
              <SettingName>Подтверждение договоров</SettingName>
              <SettingHint>
                Выключите, если договоры не требуют отдельного подтверждения.
              </SettingHint>
            </SettingText>
          </SettingContent>
          <SettingControl>
            <SettingStatus $enabled={creditAcceptance}>
              {isSavingSetting
                ? "Сохранение..."
                : creditAcceptance
                ? "Включено"
                : "Выключено"}
            </SettingStatus>
            <ToggleSwitch
              checked={creditAcceptance}
              onChange={handleCreditAcceptanceChange}
              disabled={isSavingSetting}
            />
          </SettingControl>
        </SettingsSection>

        <CardFooter>
          <Disclaimer>
            Все данные используются только для автоматического оформления
            договора займа и не передаются третьим лицам.
          </Disclaimer>
          <ButtonsContainer>
            <GrayButton width="120px" onClick={handleReset}>
              Сбросить
            </GrayButton>
            <DarkCyanButton onClick={handleSave} disabled={isLoading}>
              Сохранить изменения
            </DarkCyanButton>
          </ButtonsContainer>
        </CardFooter>
      </CompanyCard>

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
    </CompanyPageLayout>
  );
};

// ─── Styled components ─────────────────────────────────────────────────────────

const CompanyPageLayout = styled(PageLayout)`
  gap: 24px;
  padding-bottom: 36px;
`;

const PageHeading = styled.header`
  h1 {
    margin: 0 0 6px;
    color: #172033;
    font-size: 30px;
    font-weight: 600;
    line-height: 1.25;
  }

  p {
    margin: 0;
    color: #718096;
    font-size: 14px;
    line-height: 1.5;
  }
`;

const CompanyCard = styled.section`
  width: 100%;
  padding: 28px 32px 0;
  border: 1px solid #e5eaef;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(28, 48, 74, 0.05);
  box-sizing: border-box;

  @media (max-width: 720px) {
    padding: 22px 18px 0;
  }
`;

const SettingsSection = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 28px;
  padding: 22px 0;
  border-top: 1px solid #edf0f3;
  border-bottom: 1px solid #edf0f3;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
`;

const SettingContent = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

const SettingIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #007d88;
  background: rgba(0, 125, 136, 0.1);
`;

const SettingText = styled.div`
  min-width: 0;
`;

const SettingName = styled.div`
  color: #172033;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const SettingHint = styled.p`
  margin: 0;
  color: #7a8799;
  font-size: 13px;
  line-height: 1.5;
  max-width: 640px;
`;

const SettingControl = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 12px;

  @media (max-width: 600px) {
    justify-content: space-between;
    padding-left: 54px;
  }
`;

const SettingStatus = styled.span<{ $enabled: boolean }>`
  padding: 5px 9px;
  border-radius: 999px;
  color: ${({ $enabled }) => ($enabled ? "#006b74" : "#657286")};
  background: ${({ $enabled }) =>
    $enabled ? "rgba(0, 125, 136, 0.1)" : "#edf0f3"};
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
`;

const CardTitle = styled.div`
  min-width: 0;

  h2 {
    margin: 0 0 5px;
    color: #172033;
    font-size: 21px;
    font-weight: 600;
    line-height: 1.35;
  }

  p {
    margin: 0;
    color: #7a8799;
    font-size: 13px;
    line-height: 1.5;
  }
`;

const LogoContainer = styled.div`
  flex-shrink: 0;
`;

const LogoPreview = styled.div<{ $hasLogo: boolean }>`
  width: 88px;
  height: 88px;
  border-radius: 12px;
  background-color: ${(p) => (p.$hasLogo ? "transparent" : "#f6f8fa")};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px dashed ${(p) => (p.$hasLogo ? "#dce4ea" : "#cbd5df")};
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #007d88;
    background-color: ${(p) => (p.$hasLogo ? "transparent" : "#f0f8f8")};
  }

  &:hover > div:last-child {
    opacity: 1;
  }
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
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

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 24px;
  width: 100%;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const InputGroup = styled.div<{ $wide?: boolean }>`
  display: flex;
  flex-direction: column;
  grid-column: ${(p) => (p.$wide ? "1 / -1" : "auto")};
  min-width: 0;
  gap: 7px;

  input {
    width: 100%;
    max-width: none;
    min-height: 42px;
    padding: 8px 13px;
    border-color: #d4dce5;
    border-radius: 7px;
    color: #26364d;
    box-sizing: border-box;
  }

  @media (max-width: 760px) {
    grid-column: auto;
  }
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #45566e;
`;

const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;

  button {
    min-height: 42px;
    padding: 9px 20px;
  }

  button:first-child {
    margin-right: 0;
    background: #edf0f3;
    color: #3f4e63;
  }
`;

const Disclaimer = styled.p`
  max-width: 620px;
  margin: 0;
  color: #7a8799;
  font-size: 12px;
  line-height: 1.5;
`;

const CardFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 0;
  padding: 20px 0 24px;

  @media (max-width: 720px) {
    align-items: stretch;
    flex-direction: column;

    ${ButtonsContainer} {
      justify-content: stretch;
    }

    ${ButtonsContainer} button {
      flex: 1;
    }
  }
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
