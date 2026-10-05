import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import {
  Building2,
  CircleUserRound,
  Info,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import useCompany from "../../api/hooks/useCompany";
import WayPayMark from "../../assets/logos/logo.svg";

type FormData = {
  name: string;
  chief: string;
  city: string;
  officeAddress: string;
  bank: string;
  phone: string;
  inn: string;
  email: string;
  supportPhone: string;
  currentBankCardId: number | null;
};

const emptyForm: FormData = {
  name: "",
  chief: "",
  city: "",
  officeAddress: "",
  bank: "",
  phone: "",
  inn: "",
  email: "",
  supportPhone: "",
  currentBankCardId: null,
};

const CompanyPage = () => {
  const {
    company,
    isLoading,
    error,
    getCompany,
    updateCompany,
    updateCompanyPhoto,
    getCompanyPhotoUrl,
  } = useCompany();
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = useCallback(
    (type: "success" | "error", text: string) => {
      setToast({ type, text });
      window.setTimeout(() => setToast(null), 3500);
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

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
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
  };

  const handleSave = async () => {
    try {
      await updateCompany(formData);
      showToast("success", "Изменения сохранены");
    } catch (saveError) {
      console.error(saveError);
      showToast("error", "Не удалось сохранить изменения");
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);
    try {
      await updateCompanyPhoto(file);
      await getCompany();
      showToast("success", "Логотип обновлён");
    } catch (uploadError) {
      console.error(uploadError);
      setPreviewUrl(
        company?.photoPath ? getCompanyPhotoUrl(company.photoPath) : null
      );
      showToast("error", "Не удалось загрузить логотип");
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  if (isLoading && !company) return <StateMessage>Загрузка...</StateMessage>;
  if (error) return <StateMessage>Ошибка: {error}</StateMessage>;

  return (
    <Page>
      <PageIntro>
        <h1>Данные о компании</h1>
        <p>Здесь указаны основные сведения о вашей компании.</p>
      </PageIntro>

      <Card>
        <CardHeader>
          <div>
            <h2>Основная информация</h2>
            <p>
              Эти данные будут использоваться для автоматического оформления
              договора займа.
            </p>
          </div>
          <LogoLabel title="Нажмите, чтобы изменить логотип">
            <LogoImage
              src={previewUrl || WayPayMark}
              alt="Логотип компании"
              $placeholder={!previewUrl}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </LogoLabel>
        </CardHeader>

        <FieldsGrid>
          <Field
            label="Название организации"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            icon={<Building2 />}
            placeholder="Название организации"
          />
          <Field
            label="Учредитель"
            name="chief"
            value={formData.chief}
            onChange={handleInputChange}
            icon={<CircleUserRound />}
            placeholder="ФИО учредителя"
          />
          <Field
            label="Населённый пункт"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            icon={<MapPin />}
            placeholder="Введите населённый пункт"
          />
          <Field
            label="Адрес офиса"
            name="officeAddress"
            value={formData.officeAddress}
            onChange={handleInputChange}
            icon={<MapPin />}
            placeholder="Введите адрес офиса"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            icon={<Mail />}
            placeholder="Введите email"
          />
          <Field
            label="Телефон"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            icon={<Phone />}
            placeholder="Введите телефон"
          />
          <SupportField>
            <Field
              label="Телефон поддержки"
              name="supportPhone"
              type="tel"
              value={formData.supportPhone}
              onChange={handleInputChange}
              icon={<Phone />}
              placeholder="Введите телефон поддержки"
            />
          </SupportField>
        </FieldsGrid>

        <CardFooter>
          <Disclaimer>
            <Info />
            <span>
              Все данные компании используются только для автоматического
              оформления договора займа и не передаются третьим лицам.
            </span>
          </Disclaimer>
          <Actions>
            <ResetButton type="button" onClick={handleReset}>
              Сбросить
            </ResetButton>
            <SaveButton type="button" onClick={handleSave} disabled={isLoading}>
              Сохранить изменения
            </SaveButton>
          </Actions>
        </CardFooter>
      </Card>

      {toast && <Toast $type={toast.type}>{toast.text}</Toast>}
    </Page>
  );
};

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: React.ReactNode;
};

const Field = ({ label, icon, ...inputProps }: FieldProps) => (
  <FieldGroup>
    <label htmlFor={inputProps.name}>{label}</label>
    <InputShell>
      <InputIcon>{icon}</InputIcon>
      <input id={inputProps.name} {...inputProps} />
    </InputShell>
  </FieldGroup>
);

const Page = styled.main`
  width: min(1344px, calc(100% - 64px));
  margin: 0 auto;
  padding: 31px 0 46px;
  text-align: left;

  @media (max-width: 720px) {
    width: calc(100% - 28px);
    padding-top: 24px;
  }
`;

const StateMessage = styled.div`
  padding: 48px;
  color: #52627b;
`;

const PageIntro = styled.div`
  margin-bottom: 22px;

  h1 {
    margin: 0 0 3px;
    color: #0b1932;
    font-size: clamp(27px, 2vw, 32px);
    line-height: 1.25;
    letter-spacing: -0.8px;
  }

  p {
    margin: 0;
    color: #647690;
    font-size: 17px;
  }
`;

const Card = styled.section`
  padding: 36px 34px 29px;
  border: 1px solid rgba(227, 234, 241, 0.7);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 10px 34px rgba(37, 65, 91, 0.045);

  @media (max-width: 720px) {
    padding: 24px 18px;
  }
`;

const CardHeader = styled.div`
  min-height: 102px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 9px;

  h2 {
    margin: 0 0 2px;
    color: #0b1932;
    font-size: 27px;
    line-height: 1.3;
    letter-spacing: -0.5px;
  }

  p {
    margin: 0;
    color: #667995;
    font-size: 16px;
  }
`;

const LogoLabel = styled.label`
  width: 96px;
  height: 96px;
  border-radius: 13px;
  overflow: hidden;
  flex: 0 0 auto;
  cursor: pointer;
  box-shadow: 0 7px 18px rgba(14, 126, 121, 0.12);

  input {
    display: none;
  }
`;

const LogoImage = styled.img<{ $placeholder: boolean }>`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: ${({ $placeholder }) => ($placeholder ? "cover" : "contain")};
  background: #f4f8f8;
`;

const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 19px 34px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const SupportField = styled.div`
  grid-column: 1 / -1;
`;

const FieldGroup = styled.div`
  min-width: 0;

  > label {
    display: block;
    margin-bottom: 7px;
    color: #4e617d;
    font-size: 15px;
    font-weight: 600;
  }
`;

const InputShell = styled.div`
  position: relative;

  input {
    width: 100%;
    height: 51px;
    box-sizing: border-box;
    padding: 0 17px 0 65px;
    border: 1px solid #d2dce8;
    border-radius: 11px;
    outline: none;
    background: #fff;
    color: #0c1932;
    font: inherit;
    font-size: 16px;
    transition: border-color 0.18s, box-shadow 0.18s;

    &::placeholder {
      color: #a9b7ca;
    }

    &:hover {
      border-color: #aabccc;
    }

    &:focus {
      border-color: #0aa99b;
      box-shadow: 0 0 0 3px rgba(10, 169, 155, 0.1);
    }
  }
`;

const InputIcon = styled.span`
  position: absolute;
  z-index: 1;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 23px;
  height: 23px;
  color: #7186a1;
  pointer-events: none;

  svg {
    width: 21px;
    height: 21px;
    stroke-width: 1.8;
  }
`;

const CardFooter = styled.div`
  margin-top: 32px;
  padding-top: 18px;
  border-top: 1px solid #e0e7ee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;

  @media (max-width: 860px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const Disclaimer = styled.div`
  max-width: 590px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: #8999ae;
  font-size: 13px;
  line-height: 1.45;

  svg {
    width: 25px;
    height: 25px;
    fill: #aab7c8;
    color: #fff;
    flex: 0 0 auto;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 19px;
  flex: 0 0 auto;
`;

const BaseButton = styled.button`
  height: 51px;
  border: 0;
  border-radius: 12px;
  padding: 0 29px;
  font: inherit;
  font-size: 15px;
  cursor: pointer;
`;

const ResetButton = styled(BaseButton)`
  min-width: 135px;
  background: #f0f3f7;
  color: #32425b;

  &:hover {
    background: #e7ebf0;
  }
`;

const SaveButton = styled(BaseButton)`
  min-width: 232px;
  background: linear-gradient(100deg, #007f86, #0bc4b2);
  color: #fff;
  box-shadow: 0 8px 18px rgba(0, 151, 145, 0.15);

  &:hover:not(:disabled) {
    filter: brightness(1.04);
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`;

const Toast = styled.div<{ $type: "success" | "error" }>`
  position: fixed;
  z-index: 1200;
  top: 90px;
  right: 24px;
  padding: 13px 18px;
  border-radius: 9px;
  background: ${({ $type }) => ($type === "success" ? "#0a9d8e" : "#dc4f57")};
  color: #fff;
  box-shadow: 0 10px 28px rgba(31, 48, 68, 0.18);
`;

export default CompanyPage;
