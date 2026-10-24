import React, { useState, useEffect } from "react";
import { CircleAlert } from "lucide-react";
import BaseModal, { type ModalMode } from "../BASE/modalCRUBase";
import CustomInput from "../../ui/fields/CustomInput";
import CustomSelect from "../../ui/fields/CustomSelect";
import Avatar from "../../Profile/Avatar";
import styled from "styled-components";
import { BASE_URL } from "../../../api/client";
import { generateAvatar, getInitials } from "../../../utils/avatarUtils";
import { useEmployee } from "../../../api/hooks/useEmployee";
import PhoneModalInput from "../../ui/fields/PhoneModalInput";
import type { CustomRole } from "../../../api/types/employee";
import { extractErrorMessage } from "../../../api/utils/errorMessage";

const EMPLOYEE_PHONE_EXISTS_MESSAGE =
  "Сотрудник с таким номером телефона уже есть";
const PHONE_FORMAT_MESSAGE = "Введите телефон в формате 8 (XXX) XXX-XX-XX";
const phoneRegex = /^8\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;

type EmployeeModalProps = {
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: {
    fullName: string;
    address: string;
    role: string;
    phone: string;
    secondPhone: string;
    minSurcharge: number;
    customRoleId?: number | null;
  }) => Promise<void>;
  initialData?: {
    id?: number;
    fullName: string;
    address: string;
    role: string;
    phone: string;
    secondPhone?: string | null;
    minSurcharge: number;
    avatar?: string;
  };
  customRoles?: CustomRole[];
};

// Базовые роли. Значения кодируются как "role:<база>" / "custom:<id>",
// чтобы в одном списке выбирать и базовую, и кастомную роль.
const baseRoleOptions = [
  { value: "role:админ", label: "Администратор" },
  { value: "role:сотрудник", label: "Сотрудник" },
];

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData = {
    fullName: "",
    address: "",
    role: "employee",
    phone: "",
    minSurcharge: 0,
    avatar: undefined,
  },
  customRoles = [],
}) => {
  const { updateEmployeePhoto, refresh, checkEmployeeExists } = useEmployee();

  // formData.role хранит ЗАКОДИРОВАННОЕ значение: "role:<база>" или "custom:<id>".
  const encodeBaseRole = (r?: string) =>
    `role:${r && r !== "employee" ? r : "сотрудник"}`;

  const roleOptions = [
    ...baseRoleOptions,
    ...customRoles.map((r) => ({
      value: `custom:${r.id}`,
      label: `${r.name} (кастомная)`,
    })),
  ];

  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || "",
    address: initialData?.address || "",
    role: encodeBaseRole(initialData?.role),
    phone: initialData?.phone || "",
    secondPhone: initialData?.secondPhone || "",
    minSurcharge: initialData?.minSurcharge || 0,
  });

  const [validationErrors, setValidationErrors] = useState({
    fullName: false,
    phone: false,
    secondPhone: false,
  });

  const [errorMessages, setErrorMessages] = useState({
    fullName: "",
    phone: "",
    secondPhone: "",
  });

  const [touchedFields, setTouchedFields] = useState({
    fullName: false,
    phone: false,
    secondPhone: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [avatarSrc, setAvatarSrc] = useState<string>(
    initialData.avatar
      ? `${BASE_URL}${initialData.avatar}?${Date.now()}`
      : generateAvatar(getInitials(initialData.fullName || ""), 100)
  );

  const validatePhone = async (phone: string) => {
    if (!phoneRegex.test(phone.trim())) {
      return PHONE_FORMAT_MESSAGE;
    }

    if (phone.trim().length === 0) {
      return "Поле обязательно для заполнения";
    }

    try {
      const exists = await checkEmployeeExists(phone);
      if (
        exists &&
        (mode === "create" || (mode === "edit" && phone !== initialData.phone))
      ) {
        return EMPLOYEE_PHONE_EXISTS_MESSAGE;
      }
    } catch (error) {
      console.error("Error checking phone:", error);
      return "Ошибка проверки номера телефона";
    }

    return "";
  };

  const validateSecondPhone = async (secondPhone: string) => {
    const normalizedValue = secondPhone.trim();
    if (!normalizedValue) return "";
    if (!phoneRegex.test(normalizedValue)) return PHONE_FORMAT_MESSAGE;
    if (normalizedValue === formData.phone.trim())
      return "Второй номер совпадает с основным";

    const initialSecondPhone = initialData.secondPhone?.trim() || "";
    if (mode === "edit" && normalizedValue === initialSecondPhone) return "";

    try {
      if (await checkEmployeeExists(normalizedValue))
        return EMPLOYEE_PHONE_EXISTS_MESSAGE;
    } catch (error) {
      console.error("Error checking second phone:", error);
      return "Ошибка проверки номера телефона";
    }

    return "";
  };

  const handlePhotoChange = async (file: File) => {
    if (!initialData.id) return;

    try {
      setIsSubmitting(true);
      const updatedEmployee = await updateEmployeePhoto(initialData.id, file);

      if (updatedEmployee.photoPath) {
        const newAvatarUrl = `${BASE_URL}${
          updatedEmployee.photoPath
        }?${Date.now()}`;
        setAvatarSrc(newAvatarUrl);
        await refresh();
      }
    } catch (error) {
      console.error("Error updating photo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setFormData({
      fullName: initialData.fullName || "",
      address: initialData.address || "",
      role: encodeBaseRole(initialData.role),
      phone: initialData.phone || "",
      secondPhone: initialData.secondPhone || "",
      minSurcharge: initialData.minSurcharge || 0,
    });
    setValidationErrors({
      fullName: false,
      phone: false,
      secondPhone: false,
    });
    setErrorMessages({
      fullName: "",
      phone: "",
      secondPhone: "",
    });
    setTouchedFields({
      fullName: false,
      phone: false,
      secondPhone: false,
    });
    setSubmitError("");

    if (initialData.avatar) {
      setAvatarSrc(`${BASE_URL}${initialData.avatar}?${Date.now()}`);
    } else if (initialData.fullName) {
      setAvatarSrc(
        generateAvatar(getInitials(initialData.fullName || ""), 100)
      );
    }
  }, [isOpen]);

  useEffect(() => {
    if (mode === "view") return;

    const validateForm = async () => {
      const newErrorMessages = {
        fullName: "",
        phone: "",
        secondPhone: "",
      };

      if (formData.fullName.trim().split(/\s+/).length < 2) {
        newErrorMessages.fullName = "Укажите ФИО полностью";
      } else if (formData.fullName.trim().length === 0) {
        newErrorMessages.fullName = "Поле обязательно для заполнения";
      }

      newErrorMessages.phone = await validatePhone(formData.phone);
      newErrorMessages.secondPhone = await validateSecondPhone(
        formData.secondPhone
      );

      setErrorMessages(newErrorMessages);

      const errors = {
        fullName: !!newErrorMessages.fullName,
        phone: !!newErrorMessages.phone,
        secondPhone: !!newErrorMessages.secondPhone,
      };

      setValidationErrors(errors);
    };

    validateForm();
  }, [formData, mode]);

  const isSaveDisabled = () => {
    if (mode === "view") return true;

    const hasErrors = Object.values(validationErrors).some(Boolean);
    if (hasErrors) return true;

    if (mode === "edit") {
      // Роль в режиме редактирования не меняется (для смены роли — отдельная модалка),
      // поэтому её закодированное значение из сравнения исключаем.
      const isChanged =
        formData.fullName !== initialData.fullName ||
        formData.address !== initialData.address ||
        formData.phone !== initialData.phone ||
        formData.secondPhone !== (initialData.secondPhone || "") ||
        formData.minSurcharge !== initialData.minSurcharge;
      return !isChanged;
    }

    return false;
  };

  const showDuplicatePhoneWarning =
    mode === "create" &&
    touchedFields.phone &&
    errorMessages.phone === EMPLOYEE_PHONE_EXISTS_MESSAGE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouchedFields({
      fullName: true,
      phone: true,
      secondPhone: true,
    });

    const isValid = !Object.values(validationErrors).some(Boolean);
    if (!isValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      // Декодируем выбранную роль в base-роль ИЛИ кастомную роль.
      const isCustom = formData.role.startsWith("custom:");
      await onSubmit({
        fullName: formData.fullName.trim(),
        address: formData.address.trim(),
        role: isCustom ? "" : formData.role.slice("role:".length),
        phone: formData.phone.trim(),
        secondPhone: formData.secondPhone.trim(),
        minSurcharge: Number(formData.minSurcharge),
        customRoleId: isCustom
          ? Number(formData.role.slice("custom:".length))
          : null,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError(
        extractErrorMessage(error, "Не удалось сохранить данные сотрудника")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    setSubmitError("");
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, role: e.target.value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Number(e.target.value));
    setFormData((prev) => ({ ...prev, minSurcharge: value }));
  };

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Добавление сотрудника";
      case "edit":
        return "Редактирование профиля";
      case "view":
        return "Просмотр сотрудника";
      default:
        return "Сотрудник";
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title={getTitle()}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSaveDisabled={isSaveDisabled() || isSubmitting}
      isSubmitting={isSubmitting}
      children={<div></div>}
      width={"920px"}
      mode={mode}
      customLayout={
        <ModalLayout>
          <AvatarSection>
            <Avatar
              src={avatarSrc}
              size={220}
              name={formData.fullName}
              disabled={mode === "view"}
              showCameraIndicator={mode === "edit"}
              onPhotoChange={mode === "edit" ? handlePhotoChange : undefined}
            />
          </AvatarSection>

          <FormSection>
            <Title>ФИО</Title>
            <CustomInput
              name="fullName"
              inputType="fullname"
              placeholder="ФИО сотрудника"
              value={formData.fullName}
              onChange={handleInputChange}
              disabled={mode === "view"}
              hasError={touchedFields.fullName && validationErrors.fullName}
              errorMessage={
                touchedFields.fullName ? errorMessages.fullName : undefined
              }
            />

            <Title>Адрес</Title>
            <CustomInput
              name="address"
              inputType="text"
              placeholder="Адрес"
              value={formData.address}
              onChange={handleInputChange}
              disabled={mode === "view"}
            />

            <RowContainer>
              <FieldContainer>
                <Title>Роль</Title>
                <CustomSelect
                  options={roleOptions}
                  disabled={mode === "view" || mode === "edit"}
                  placeholder="Выберите роль"
                  value={formData.role}
                  onChange={handleSelectChange}
                  dropdownInPortal
                />
              </FieldContainer>

              <FieldContainer>
                <Title>Телефон</Title>
                <PhoneModalInput
                  name="phone"
                  placeholder="8 (XXX) XXX-XX-XX"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={mode === "view" || mode === "edit"}
                  hasError={touchedFields.phone && validationErrors.phone}
                  errorMessage={
                    touchedFields.phone && !showDuplicatePhoneWarning
                      ? errorMessages.phone
                      : undefined
                  }
                />
              </FieldContainer>

              {/* Второй номер, в отличие от основного, меняется и после
                  создания: им добавляют вход со второй сим-карты. */}
              <FieldContainer>
                <Title>Второй номер (необязательно)</Title>
                <PhoneModalInput
                  name="secondPhone"
                  placeholder="8 (XXX) XXX-XX-XX"
                  value={formData.secondPhone}
                  onChange={handleInputChange}
                  disabled={mode === "view"}
                  hasError={
                    touchedFields.secondPhone && validationErrors.secondPhone
                  }
                  errorMessage={
                    touchedFields.secondPhone
                      ? errorMessages.secondPhone
                      : undefined
                  }
                />
              </FieldContainer>

              <FieldContainer>
                <Title>Мин. надбавка%</Title>
                <CustomInput
                  name="minSurcharge"
                  inputType="number"
                  placeholder="Минимальная надбавка"
                  value={formData.minSurcharge.toString()}
                  onChange={handleNumberChange}
                  disabled={mode === "view" || mode === "edit"}
                  min={0}
                />
              </FieldContainer>
            </RowContainer>

            {showDuplicatePhoneWarning && (
              <PhoneWarning role="alert" aria-live="polite">
                <WarningIcon>
                  <CircleAlert size={18} strokeWidth={2.2} />
                </WarningIcon>
                <WarningContent>
                  <WarningTitle>Номер уже используется</WarningTitle>
                  <WarningText>
                    Сотрудник с таким номером телефона уже есть. Укажите другой
                    номер.
                  </WarningText>
                </WarningContent>
              </PhoneWarning>
            )}

            {submitError && (
              <SubmitError role="alert" aria-live="polite">
                {submitError}
              </SubmitError>
            )}
          </FormSection>
        </ModalLayout>
      }
    />
  );
};

const ModalLayout = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
`;

const AvatarSection = styled.div`
  flex-shrink: 0;
  padding: 40px 0;
`;

const FormSection = styled.div`
  flex: 1;
  min-width: 0;
  padding: 20px 20px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.h3`
  color: black;
  text-align: left;
  margin: 0;
  padding: 0;
  margin-top: 15px;
  font-size: 14px;
  font-weight: 400;
`;

const RowContainer = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
`;

const FieldContainer = styled.div`
  flex: 1;
  min-width: 0;
`;

const SubmitError = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  background: #fef2f2;
  color: #991b1b;
  font-size: 13px;
`;

const PhoneWarning = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  background: #fffbeb;
  box-shadow: 0 1px 2px rgba(146, 64, 14, 0.06);
`;

const WarningIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #d97706;
  margin-top: 1px;
`;

const WarningContent = styled.div`
  min-width: 0;
`;

const WarningTitle = styled.div`
  color: #92400e;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
`;

const WarningText = styled.div`
  margin-top: 2px;
  color: #78350f;
  font-size: 12px;
  line-height: 1.4;
`;

export default EmployeeModal;
