import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { CalendarDays, Check, Phone } from "lucide-react";
import BaseModal, { type ModalMode } from "../BASE/modalCRUBase";
import CustomInput from "../../ui/fields/CustomInput";
import ModalInfoTitle from "../../ui/Text/ModalInfoTitle";
import PhoneModalInput from "../../ui/fields/PhoneModalInput";
import {
  InputContainer,
  InputLabel,
  InputRow,
} from "../../Containers/InputComponents";
import type { ClientContact, ClientForm } from "../../../api/types/client";
import Button from "../../ui/Buttons/DarkCyanButton";
import useClient from "../../../api/hooks/useClient";
import { formatPhoneHref } from "../../../utils/phoneUtils";
import PhoneLink from "../../ui/links/PhoneLink";
import ContactsEditor from "../../ui/ContactsEditor";

interface Client {
  id: number;
  fullName: string;
  phone: string;
  secondPhone?: string;
  doc?: string;
  birthdate?: string | Date;
  docIssueDate?: string | Date;
  docIssueYear: number;
  registrationAddress: string;
  actualAddress?: string;
  contacts?: ClientContact[];
}

type ClientModalProps = {
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    clientData: Omit<ClientForm, "doc" | "docIssueDate">
  ) => Promise<boolean>;
  initialData?: Client;
  createTitle?: string;
  namePlaceholder?: string;
};

const emptyClient: Omit<Client, "id"> = {
  fullName: "",
  phone: "",
  secondPhone: "",
  doc: "",
  birthdate: "",
  docIssueDate: "",
  docIssueYear: 0,
  registrationAddress: "",
  actualAddress: "",
};

const CreateFormContent = styled.div`
  padding: 6px 34px 24px;

  @media (max-width: 600px) { padding: 4px 18px 20px; }
`;

const CreateSection = styled.section<{ $separated?: boolean }>`
  margin-top: ${({ $separated }) => ($separated ? "18px" : "8px")};
  padding-top: ${({ $separated }) => ($separated ? "18px" : "0")};
  border-top: ${({ $separated }) => ($separated ? "1px solid #dfe6ed" : "0")};
`;

const CreateSectionTitle = styled.h3`
  margin: 0 0 16px;
  color: #07818a;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
`;

const CreateFieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px 18px;

  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const CreateField = styled.label<{ $fullWidth?: boolean }>`
  display: flex;
  grid-column: ${({ $fullWidth }) => ($fullWidth ? "1 / -1" : "auto")};
  min-width: 0;
  flex-direction: column;
  gap: 7px;
  color: #192438;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
`;

const CreateInputShell = styled.div<{ $withIcon?: boolean; $iconRight?: boolean }>`
  position: relative;
  min-width: 0;

  > svg {
    position: absolute;
    top: 20px;
    left: ${({ $iconRight }) => ($iconRight ? "auto" : "13px")};
    right: ${({ $iconRight }) => ($iconRight ? "13px" : "auto")};
    z-index: 2;
    color: #8290a3;
    transform: translateY(-50%);
    pointer-events: none;
  }

  > div {
    display: block;
    width: 100%;
    margin: 0;
    max-width: none;
  }

  input {
    width: 100%;
    max-width: none;
    min-height: 40px;
    padding: 7px ${({ $iconRight }) => ($iconRight ? "40px" : "12px")} 7px
      ${({ $withIcon, $iconRight }) => ($withIcon && !$iconRight ? "40px" : "13px")};
    color: #172235;
    font-size: 14px;
    background: #fff;
    border-color: #c7d2de;
    border-radius: 7px;
  }

  input::placeholder { color: #8b97a9; }
`;

const SameAddressLabel = styled.label`
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 15px;
  color: #253044;
  font-size: 14px;
  line-height: 1.35;
  cursor: pointer;
`;

const CheckboxVisual = styled.span<{ $checked: boolean }>`
  display: grid;
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  box-sizing: border-box;
  place-items: center;
  color: #fff;
  background: ${({ $checked }) => ($checked ? "#078891" : "#fff")};
  border: 1px solid ${({ $checked }) => ($checked ? "#078891" : "#aebac7")};
  border-radius: 5px;
`;

const HiddenCheckbox = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
`;

const CreateApiError = styled.div`
  margin-bottom: 12px;
  padding: 9px 11px;
  color: #b4232a;
  font-size: 13px;
  background: #fff0f1;
  border-radius: 7px;
`;

const validateDate = (
  dateStr: string,
  minAge: number,
  maxAge: number,
  isRequired: boolean
): { isValid: boolean; error?: string; date?: Date } => {
  if (!dateStr) {
    return {
      isValid: !isRequired,
      error: isRequired ? "Поле обязательно для заполнения" : undefined,
    };
  }

  const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
  if (!dateRegex.test(dateStr)) {
    return { isValid: false, error: "Формат даты: дд.мм.гггг" };
  }

  const [day, month, year] = dateStr.split(".").map(Number);

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { isValid: false, error: "Некорректная дата" };
  }

  const today = new Date();
  const age =
    today.getFullYear() -
    year -
    (today.getMonth() < month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() < day)
      ? 1
      : 0);

  if (age < minAge) {
    return {
      isValid: false,
      error: `Возраст должен быть не менее ${minAge} лет`,
    };
  }

  if (age > maxAge) {
    return {
      isValid: false,
      error: `Возраст должен быть не более ${maxAge} лет`,
    };
  }

  return { isValid: true, date };
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "";

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
    return dateString;
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
};

const ClientModal: React.FC<ClientModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData = {
    id: 0,
    fullName: "",
    phone: "",
    secondPhone: "",
    doc: "",
    birthdate: null,
    docIssueDate: null,
    docIssueYear: 0,
    registrationAddress: "",
    actualAddress: "",
  },
  createTitle,
  namePlaceholder = "Фамилия, имя, отчество",
}) => {
  const [formData, setFormData] = useState<Omit<Client, "id">>(
    mode === "create"
      ? emptyClient
      : {
          fullName: initialData?.fullName || "",
          phone: initialData?.phone || "",
          secondPhone: initialData?.secondPhone || "",
          doc: initialData?.doc || "",
          birthdate: initialData?.birthdate
            ? formatDate(initialData.birthdate.toString())
            : "",
          docIssueDate: initialData?.docIssueDate
            ? formatDate(initialData.docIssueDate.toString())
            : "",
          docIssueYear: initialData?.docIssueYear || 0,
          registrationAddress: initialData?.registrationAddress || "",
          actualAddress: initialData?.actualAddress || "",
        }
  );

  const { updateClientDoc, updateClientDocIssueDate, checkClientExists } =
    useClient();

  const [validationErrors, setValidationErrors] = useState({
    fullName: false,
    phone: false,
    birthdate: false,
    doc: false,
    docIssueDate: false,
    registrationAddress: false,
  });

  const validatePhone = async (phone: string, initialPhone: string) => {
    const phoneRegex = /^(\+7|8)\s?\(?\d{3}\)?\s?\d{3}-?\d{2}-?\d{2}$/;
    if (phone === initialData.phone) return "";

    if (!phoneRegex.test(phone.trim())) {
      return "Введите корректный телефон";
    }

    if (phone.trim().length === 0) {
      return "Поле обязательно для заполнения";
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 11) {
      try {
        const exists = await checkClientExists(phone);
        if (
          exists &&
          (mode === "create" ||
            (mode === "edit" && phone !== initialData.phone))
        ) {
          return "Клиент с таким номером телефона уже есть";
        }
      } catch (error) {
        console.error("Error checking phone:", error);
        return "Ошибка проверки номера телефона";
      }
    }

    return "";
  };

  const handleClose = () => {
    if (mode === "create") {
      setFormData(emptyClient);
    }
    onClose();
  };

  const [errorMessages, setErrorMessages] = useState({
    fullName: "",
    phone: "",
    birthdate: "",
    doc: "",
    docIssueDate: "",
    registrationAddress: "",
  });

  const [touchedFields, setTouchedFields] = useState({
    fullName: false,
    phone: false,
    birthdate: false,
    doc: false,
    docIssueDate: false,
    registrationAddress: false,
  });

  const [isEditingPassport, setIsEditingPassport] = useState(false);
  const [passportEditData, setPassportEditData] = useState({
    doc: initialData?.doc || "",
    docIssueDate: initialData?.docIssueDate || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [sameAsRegistration, setSameAsRegistration] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (mode === "create") {
        setFormData(emptyClient);
        setIsEditingPassport(false);
        setSameAsRegistration(true);

        setValidationErrors({
          fullName: false,
          phone: false,
          birthdate: false,
          doc: false,
          docIssueDate: false,
          registrationAddress: false,
        });

        setErrorMessages({
          fullName: "",
          phone: "",
          birthdate: "",
          doc: "",
          docIssueDate: "",
          registrationAddress: "",
        });

        setTouchedFields({
          fullName: false,
          phone: false,
          birthdate: false,
          doc: false,
          docIssueDate: false,
          registrationAddress: false,
        });
      }
      if (mode !== "create") {
        setFormData({
          fullName: initialData?.fullName || "",
          phone: initialData?.phone || "",
          secondPhone: initialData?.secondPhone || "",
          doc: initialData?.doc || "",
          birthdate: initialData?.birthdate
            ? formatDate(initialData.birthdate.toString())
            : "",
          docIssueDate: initialData?.docIssueDate
            ? formatDate(initialData.docIssueDate.toString())
            : initialData?.docIssueYear
            ? `01.01.${initialData.docIssueYear}`
            : "",
          docIssueYear: initialData?.docIssueYear || 0,
          registrationAddress: initialData?.registrationAddress || "",
          actualAddress: initialData?.actualAddress || "",
        });

        setPassportEditData({
          doc: initialData?.doc || "",
          docIssueDate: initialData?.docIssueDate
            ? formatDate(initialData.docIssueDate.toString())
            : "",
        });

        setIsEditingPassport(false);

        setValidationErrors({
          fullName: false,
          phone: false,
          birthdate: false,
          doc: false,
          docIssueDate: false,
          registrationAddress: false,
        });

        setErrorMessages({
          fullName: "",
          phone: "",
          birthdate: "",
          doc: "",
          docIssueDate: "",
          registrationAddress: "",
        });

        setTouchedFields({
          fullName: false,
          phone: false,
          birthdate: false,
          doc: false,
          docIssueDate: false,
          registrationAddress: false,
        });

        setApiError("");
      }
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (mode === "view") return;

    const validateForm = async () => {
      const newErrorMessages = {
        fullName: "",
        phone: "",
        birthdate: "",
        doc: "",
        docIssueDate: "",
        registrationAddress: "",
      };

      if (formData.fullName.trim().split(/\s+/).length < 2) {
        newErrorMessages.fullName = "Укажите фио полностью";
      } else if (formData.fullName.trim().length === 0) {
        newErrorMessages.fullName = "Поле обязательно для заполнения";
      }

      newErrorMessages.phone = await validatePhone(
        formData.phone,
        initialData.phone
      );

      const birthdateValidation = validateDate(
        formData.birthdate.toString() || "",
        18,
        100,
        true
      );
      if (!birthdateValidation.isValid) {
        newErrorMessages.birthdate = birthdateValidation.error || "";
      }

      if (mode === "create" || isEditingPassport) {
        const docRegex = /^\d{4}\s\d{6}$/;
        if (!docRegex.test(formData.doc.trim())) {
          newErrorMessages.doc = "Введите документ";
        } else if (formData.doc.trim().length === 0) {
          newErrorMessages.doc = "Поле обязательно для заполнения";
        }

        const docIssueValidation = validateDate(
          formData.docIssueDate.toString(),
          0,
          90,
          false
        );
        if (!docIssueValidation.isValid && docIssueValidation.error) {
          newErrorMessages.docIssueDate = docIssueValidation.error;
        } else if (docIssueValidation.date) {
          const today = new Date();
          if (docIssueValidation.date > today) {
            newErrorMessages.docIssueDate =
              "Дата выдачи не может быть в будущем";
          }
        }
      }

      setErrorMessages(newErrorMessages);

      const errors = {
        fullName: !!newErrorMessages.fullName,
        phone: !!newErrorMessages.phone,
        birthdate: !!newErrorMessages.birthdate,
        doc: !!newErrorMessages.doc,
        docIssueDate: !!newErrorMessages.docIssueDate,
        registrationAddress: !!newErrorMessages.registrationAddress,
      };

      setValidationErrors(errors);
    };

    validateForm();
  }, [formData, mode, isEditingPassport]);

  const isSaveDisabled = () => {
    if (mode === "view") return true;

    const hasErrors = Object.values(validationErrors).some(Boolean);
    if (hasErrors) return true;

    if (mode === "edit") {
      const isChanged =
        formData.fullName !== initialData.fullName ||
        formData.phone !== initialData.phone ||
        formData.birthdate !== initialData.birthdate ||
        formData.registrationAddress !==
          (initialData.registrationAddress || "") ||
        formData.actualAddress !== (initialData.actualAddress || "") ||
        (formData.secondPhone || "") !== (initialData.secondPhone || "") ||
        (isEditingPassport &&
          (formData.doc !== initialData.doc ||
            formData.docIssueDate !== initialData.docIssueDate));
      return !isChanged;
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouchedFields({
      fullName: true,
      phone: true,
      birthdate: true,
      doc: true,
      docIssueDate: true,
      registrationAddress: true,
    });

    const isValid = !Object.values(validationErrors).some(Boolean);
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    setApiError("");

    try {
      const formattedBirthdate =
        typeof formData.birthdate === "string"
          ? formData.birthdate
          : formatDate(formData.birthdate.toString());

      const submitData = {
        fullName: formData.fullName,
        phone: formData.phone,
        secondPhone: formData.secondPhone,
        birthdate: formattedBirthdate,
        docIssueDate: formData.docIssueDate,
        doc: formData.doc,
        registrationAddress: formData.registrationAddress,
        actualAddress: formData.actualAddress,
      };

      const success = await onSubmit(submitData);

      if (success) {
        onClose();
      }
      setIsSubmitting(false);
    } catch (error: any) {
      console.error("Ошибка при сохранении клиента:", error);
      setApiError(error.message || "Произошла ошибка при сохранении клиента");
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (mode === "create" && sameAsRegistration && name === "registrationAddress") {
        next.actualAddress = value;
      }
      return next;
    });
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const handleSameAddressChange = (checked: boolean) => {
    setSameAsRegistration(checked);
    setFormData((prev) => ({
      ...prev,
      actualAddress: checked ? prev.registrationAddress : "",
    }));
  };

  const handlePassportEditStart = () => {
    setIsEditingPassport(true);
    setFormData((prev) => ({
      ...prev,
      doc: "",
      docIssueDate: "",
    }));
  };

  const handlePassportEditCancel = () => {
    setIsEditingPassport(false);
    setFormData((prev) => ({
      ...prev,
      doc: passportEditData.doc,
      docIssueDate: passportEditData.docIssueDate,
    }));
    setValidationErrors((prev) => ({
      ...prev,
      doc: false,
      docIssueDate: false,
    }));
    setErrorMessages((prev) => ({
      ...prev,
      doc: "",
      docIssueDate: "",
    }));
  };

  const handlePassportSave = async () => {
    const docRegex = /^\d{4}\s\d{6}$/;
    const docIssueValidation = validateDate(
      formData.docIssueDate.toString(),
      0,
      90,
      false
    );

    const newErrorMessages = {
      doc: "",
      docIssueDate: "",
    };

    if (!docRegex.test(formData.doc.trim())) {
      newErrorMessages.doc = "Введите документ";
    }

    if (!docIssueValidation.isValid && docIssueValidation.error) {
      newErrorMessages.docIssueDate = docIssueValidation.error;
    } else if (docIssueValidation.date) {
      const today = new Date();
      if (docIssueValidation.date > today) {
        newErrorMessages.docIssueDate = "Дата выдачи не может быть в будущем";
      }
    }

    if (newErrorMessages.doc || newErrorMessages.docIssueDate) {
      setErrorMessages((prev) => ({
        ...prev,
        ...newErrorMessages,
      }));
      setValidationErrors((prev) => ({
        ...prev,
        doc: !!newErrorMessages.doc,
        docIssueDate: !!newErrorMessages.docIssueDate,
      }));
      return;
    }

    setIsSubmitting(true);
    setApiError("");

    try {
      if (initialData.id) {
        await updateClientDoc(initialData.id, formData.doc);

        if (formData.docIssueDate) {
          await updateClientDocIssueDate(
            initialData.id,
            new Date(formData.docIssueDate)
          );
        }

        setPassportEditData({
          doc: formData.doc,
          docIssueDate: formData.docIssueDate,
        });
        setIsEditingPassport(false);

        setFormData((prev) => ({
          ...prev,
          doc: formData.doc,
          docIssueDate: formData.docIssueDate,
        }));
      }
    } catch (error) {
      console.error("Failed to update passport:", error);
      setApiError("Ошибка при сохранении паспортных данных");
      setErrorMessages((prev) => ({
        ...prev,
        doc: "Ошибка при сохранении",
        docIssueDate: "Ошибка при сохранении",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "create":
        return createTitle ?? "Новый клиент";
      case "edit":
        return "Редактирование";
      case "view":
        return "Просмотр";
      default:
        return "Клиент";
    }
  };

  const renderCreateContent = () => (
    <CreateFormContent>
      {apiError && <CreateApiError>{apiError}</CreateApiError>}

      <CreateSection>
        <CreateSectionTitle>Основная информация</CreateSectionTitle>
        <CreateFieldsGrid>
          <CreateField $fullWidth>
            ФИО
            <CreateInputShell>
              <CustomInput
                name="fullName"
                inputType="fullname"
                placeholder={namePlaceholder}
                value={formData.fullName}
                onChange={handleInputChange}
                hasError={touchedFields.fullName && validationErrors.fullName}
                errorMessage={touchedFields.fullName ? errorMessages.fullName : undefined}
              />
            </CreateInputShell>
          </CreateField>

          <CreateField>
            Телефон
            <CreateInputShell $withIcon>
              <Phone size={17} />
              <PhoneModalInput
                name="phone"
                placeholder="8 (___) ___-__-__"
                value={formData.phone}
                onChange={handleInputChange}
                hasError={touchedFields.phone && validationErrors.phone}
                errorMessage={touchedFields.phone ? errorMessages.phone : undefined}
              />
            </CreateInputShell>
          </CreateField>

          <CreateField>
            Дата рождения
            <CreateInputShell $withIcon $iconRight>
              <CalendarDays size={17} />
              <CustomInput
                name="birthdate"
                inputType="date"
                placeholder="дд.мм.гггг"
                value={formData.birthdate.toString() || ""}
                onChange={handleInputChange}
                hasError={touchedFields.birthdate && validationErrors.birthdate}
                errorMessage={touchedFields.birthdate ? errorMessages.birthdate : undefined}
              />
            </CreateInputShell>
          </CreateField>
        </CreateFieldsGrid>
      </CreateSection>

      <CreateSection $separated>
        <CreateSectionTitle>Паспортные данные</CreateSectionTitle>
        <CreateFieldsGrid>
          <CreateField $fullWidth>
            Серия и номер паспорта
            <CreateInputShell>
              <CustomInput
                name="doc"
                inputType="doc"
                placeholder="0000 000000"
                value={formData.doc}
                onChange={handleInputChange}
                hasError={touchedFields.doc && validationErrors.doc}
                errorMessage={touchedFields.doc ? errorMessages.doc : undefined}
              />
            </CreateInputShell>
          </CreateField>

          <CreateField $fullWidth>
            Адрес регистрации
            <CreateInputShell>
              <CustomInput
                name="registrationAddress"
                inputType="text"
                placeholder="Город, улица, дом, квартира"
                value={formData.registrationAddress}
                onChange={handleInputChange}
                hasError={touchedFields.registrationAddress && validationErrors.registrationAddress}
                errorMessage={touchedFields.registrationAddress ? errorMessages.registrationAddress : undefined}
              />
            </CreateInputShell>
          </CreateField>
        </CreateFieldsGrid>

        <SameAddressLabel>
          <HiddenCheckbox
            type="checkbox"
            checked={sameAsRegistration}
            onChange={(event) => handleSameAddressChange(event.target.checked)}
          />
          <CheckboxVisual $checked={sameAsRegistration}>
            {sameAsRegistration && <Check size={17} strokeWidth={2.5} />}
          </CheckboxVisual>
          <span>Фактический адрес совпадает с регистрацией</span>
        </SameAddressLabel>

        {!sameAsRegistration && (
          <CreateFieldsGrid style={{ marginTop: "15px" }}>
            <CreateField $fullWidth>
              Фактический адрес
              <CreateInputShell>
                <CustomInput
                  name="actualAddress"
                  inputType="text"
                  placeholder="Город, улица, дом, квартира"
                  value={formData.actualAddress || ""}
                  onChange={handleInputChange}
                />
              </CreateInputShell>
            </CreateField>
          </CreateFieldsGrid>
        )}
      </CreateSection>
    </CreateFormContent>
  );

  if (!isOpen) return null;

  return (
    <BaseModal
      title={getTitle()}
      subtitle={mode === "create" ? "Заполните контактные и паспортные данные" : undefined}
      appearance={mode === "create" ? "client-create" : "default"}
      width={mode === "create" ? "680px" : undefined}
      maxHeight={mode === "create" ? "calc(100vh - 32px)" : undefined}
      cancelButtonText={mode === "create" ? "Отмена" : undefined}
      saveButtonText={mode === "create" ? "Создать клиента" : undefined}
      onClose={handleClose}
      onCancel={handleClose}
      onSave={handleSubmit}
      isSaveDisabled={isSaveDisabled() || isSubmitting}
      isSubmitting={isSubmitting}
      mode={mode}
    >
      {mode === "create" ? renderCreateContent() : (
      <div>
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          {apiError && (
            <div style={{ color: "red", marginBottom: "15px" }}>{apiError}</div>
          )}

          <ModalInfoTitle>Основная информация</ModalInfoTitle>
          <InputRow>
            <InputLabel>Телефон:</InputLabel>
            <InputContainer>
              {mode === "view" ? (
                <PhoneLink href={formatPhoneHref(formData.phone)}>
                  {formData.phone}
                </PhoneLink>
              ) : (
                <PhoneModalInput
                  name="phone"
                  placeholder="Телефон"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={mode === "view"}
                  hasError={touchedFields.phone && validationErrors.phone}
                  errorMessage={
                    touchedFields.phone ? errorMessages.phone : undefined
                  }
                />
              )}
            </InputContainer>
          </InputRow>

          <InputRow>
            <InputLabel>ФИО:</InputLabel>
            <InputContainer>
              <CustomInput
                name="fullName"
                inputType="fullname"
                placeholder={namePlaceholder}
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={mode === "view"}
                hasError={touchedFields.fullName && validationErrors.fullName}
                errorMessage={
                  touchedFields.fullName ? errorMessages.fullName : undefined
                }
              />
            </InputContainer>
          </InputRow>

          <InputRow>
            <InputLabel>Дата рождения:</InputLabel>
            <InputContainer>
              <CustomInput
                name="birthdate"
                inputType="date"
                placeholder="дд.мм.гггг"
                value={formData.birthdate.toString() || ""}
                onChange={handleInputChange}
                disabled={mode === "view"}
                hasError={touchedFields.birthdate && validationErrors.birthdate}
                errorMessage={
                  touchedFields.birthdate ? errorMessages.birthdate : undefined
                }
              />
            </InputContainer>
          </InputRow>

          <ModalInfoTitle>Паспортные данные</ModalInfoTitle>

          <InputRow>
            <InputLabel>Паспорт:</InputLabel>
            <InputContainer>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <CustomInput
                  name="doc"
                  inputType="doc"
                  placeholder="Серия и номер"
                  value={formData.doc}
                  onChange={handleInputChange}
                  disabled={
                    mode === "view" || (mode === "edit" && !isEditingPassport)
                  }
                  hasError={touchedFields.doc && validationErrors.doc}
                  errorMessage={
                    touchedFields.doc ? errorMessages.doc : undefined
                  }
                  style={{ flex: 1 }}
                />
                {mode === "edit" && !isEditingPassport && (
                  <Button type="button" onClick={handlePassportEditStart}>
                    Изменить
                  </Button>
                )}
              </div>
            </InputContainer>
          </InputRow>

          {/* <InputRow>
            <InputLabel>Дата выдачи:</InputLabel>
            <InputContainer>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <CustomInput
                  name="docIssueDate"
                  inputType="date"
                  placeholder="дд.мм.гггг"
                  value={formData.docIssueDate.toString()}
                  onChange={handleInputChange}
                  disabled={mode === 'view' || (mode === 'edit' && !isEditingPassport)}
                  hasError={touchedFields.docIssueDate && validationErrors.docIssueDate}
                  errorMessage={touchedFields.docIssueDate ? errorMessages.docIssueDate : undefined}
                  style={{ flex: 1 }}
                />
                {mode === 'edit' && isEditingPassport && (
                  <>
                    <Button
                      type="button"
                      onClick={handlePassportSave}
                      disabled={!!validationErrors.doc || !!validationErrors.docIssueDate}
                    >
                      Сохранить
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePassportEditCancel}
                    >
                      Отмена
                    </Button>
                  </>
                )}
              </div>
            </InputContainer>
          </InputRow> */}

          <InputRow>
            <InputLabel>Адрес регистрации:</InputLabel>
            <InputContainer>
              <CustomInput
                name="registrationAddress"
                inputType="text"
                placeholder="г. Грозный, ул. Примерная, д. 1, кв. 1"
                value={formData.registrationAddress}
                onChange={handleInputChange}
                disabled={mode === "view"}
                hasError={
                  touchedFields.registrationAddress &&
                  validationErrors.registrationAddress
                }
                errorMessage={
                  touchedFields.registrationAddress
                    ? errorMessages.registrationAddress
                    : undefined
                }
              />
            </InputContainer>
          </InputRow>

          <InputRow>
            <InputLabel>Фактический адрес:</InputLabel>
            <InputContainer>
              <CustomInput
                name="actualAddress"
                inputType="text"
                placeholder="г. Грозный, ул. Примерная, д. 1, кв. 1"
                value={formData.actualAddress || ""}
                onChange={handleInputChange}
                disabled={mode === "view"}
              />
            </InputContainer>
          </InputRow>

          {/* При добавлении дополнительные данные не нужны: номер WhatsApp
              заполняют позже, уже у созданного клиента. Контакты ниже и так
              показываются только после создания. */}
          {mode !== "create" && (
            <>
              <ModalInfoTitle>Дополнительные данные</ModalInfoTitle>
              <InputRow>
                <InputLabel>WhatsApp:</InputLabel>
                <InputContainer>
                  <PhoneModalInput
                    name="secondPhone"
                    placeholder="WhatsApp"
                    value={formData.secondPhone || ""}
                    onChange={handleInputChange}
                    disabled={mode === "view"}
                  />
                </InputContainer>
              </InputRow>
            </>
          )}

          {initialData.id > 0 && mode !== "create" && (
            <InputRow style={{ alignItems: "flex-start" }}>
              <InputLabel>Контакты:</InputLabel>
              <InputContainer>
                <ContactsEditor
                  clientId={initialData.id}
                  contacts={initialData.contacts || []}
                  readOnly={mode === "view"}
                  mainWhatsApp={formData.secondPhone}
                  onSetMainWhatsApp={(value) =>
                    setFormData((prev) => ({ ...prev, secondPhone: value }))
                  }
                />
              </InputContainer>
            </InputRow>
          )}
        </div>
      </div>
      )}
    </BaseModal>
  );
};

export default ClientModal;
