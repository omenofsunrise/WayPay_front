import React, { useState, useEffect, useRef } from "react";
import { CircleAlert, X } from "lucide-react";
import { type ModalMode } from "../BASE/modalCRUBase";
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
  const photoInputRef = useRef<HTMLInputElement>(null);
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

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setSubmitError("Выберите изображение в формате JPG или PNG");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Размер изображения не должен превышать 5 МБ");
      return;
    }

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

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handlePhotoChange(file);
    e.target.value = "";
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
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

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
    <ModalBackdrop onMouseDown={onClose}>
      <ModalDialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <CloseButton type="button" onClick={onClose} aria-label="Закрыть">
          <X size={27} strokeWidth={1.8} />
        </CloseButton>

        <ModalHeader>
          <ModalTitle id="employee-modal-title">{getTitle()}</ModalTitle>
          <ModalSubtitle>
            {mode === "create"
              ? "Заполните личные данные и рабочие настройки"
              : "Обновите личные данные и рабочие настройки"}
          </ModalSubtitle>
        </ModalHeader>

        <EmployeeForm onSubmit={handleSubmit}>
          <ScrollableContent>
            <PhotoSection>
              <Avatar
                src={avatarSrc}
                size={144}
                name={formData.fullName}
                disabled
              />
              <PhotoActions>
                {mode !== "view" && (
                  <ChangePhotoButton
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={mode !== "edit" || isSubmitting}
                  >
                    Изменить фото
                  </ChangePhotoButton>
                )}
                <PhotoHint>JPG или PNG, до 5 МБ</PhotoHint>
                <HiddenPhotoInput
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handlePhotoInputChange}
                />
              </PhotoActions>
            </PhotoSection>

            <Divider />

            <FormField>
              <FieldLabel>ФИО</FieldLabel>
              <FieldControl>
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
              </FieldControl>
            </FormField>

            <FormField>
              <FieldLabel>Адрес</FieldLabel>
              <FieldControl>
                <CustomInput
                  name="address"
                  inputType="text"
                  placeholder="Адрес"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={mode === "view"}
                />
              </FieldControl>
            </FormField>

            <SectionTitle>Контакты</SectionTitle>
            <FieldsGrid>
              <FormField>
                <FieldLabel>Телефон</FieldLabel>
                <FieldControl>
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
                </FieldControl>
              </FormField>

              {/* Дополнительный номер можно менять и после создания. */}
              <FormField>
                <FieldLabel>Дополнительный телефон</FieldLabel>
                <FieldControl>
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
                </FieldControl>
                {!validationErrors.secondPhone && (
                  <FieldHint>Необязательно</FieldHint>
                )}
              </FormField>
            </FieldsGrid>

            <SectionTitle>Рабочие настройки</SectionTitle>
            <FieldsGrid>
              <FormField>
                <FieldLabel>Роль</FieldLabel>
                <FieldControl>
                  <CustomSelect
                    options={roleOptions}
                    disabled={mode === "view" || mode === "edit"}
                    placeholder="Выберите роль"
                    value={formData.role}
                    onChange={handleSelectChange}
                    dropdownInPortal
                  />
                </FieldControl>
              </FormField>

              <FormField>
                <FieldLabel>Минимальная надбавка</FieldLabel>
                <PercentField>
                  <FieldControl>
                    <CustomInput
                      name="minSurcharge"
                      inputType="number"
                      placeholder="Минимальная надбавка"
                      value={formData.minSurcharge.toString()}
                      onChange={handleNumberChange}
                      disabled={mode === "view" || mode === "edit"}
                      min={0}
                    />
                  </FieldControl>
                  <PercentSuffix>%</PercentSuffix>
                </PercentField>
              </FormField>
            </FieldsGrid>

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
          </ScrollableContent>

          <ModalFooter>
            <CancelButton type="button" onClick={onClose}>
              {mode === "view" ? "Закрыть" : "Отмена"}
            </CancelButton>
            {mode !== "view" && (
              <SaveButton
                type="submit"
                disabled={isSaveDisabled() || isSubmitting}
              >
                {isSubmitting
                  ? "Сохранение..."
                  : mode === "create"
                  ? "Добавить сотрудника"
                  : "Сохранить изменения"}
              </SaveButton>
            )}
          </ModalFooter>
        </EmployeeForm>
      </ModalDialog>
    </ModalBackdrop>
  );
};

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
  background: rgba(25, 35, 48, 0.48);
  backdrop-filter: blur(3px);

  @media (max-height: 900px) {
    padding: 12px;
  }
`;

const ModalDialog = styled.div`
  position: relative;
  display: flex;
  width: min(1040px, calc(100vw - 48px));
  margin: auto;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e1e6eb;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(27, 39, 51, 0.22);
  text-align: left;

  @media (max-width: 700px) {
    width: calc(100vw - 24px);
    border-radius: 12px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 28px;
  right: 30px;
  z-index: 2;
  display: grid;
  width: 38px;
  height: 38px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #526071;
  cursor: pointer;

  &:hover {
    background: #f1f5f7;
    color: #111827;
  }
`;

const ModalHeader = styled.header`
  flex: 0 0 auto;
  padding: 38px 74px 18px 42px;

  @media (max-width: 700px) {
    padding: 28px 60px 14px 24px;
  }

  @media (max-height: 900px) {
    padding: 22px 68px 10px 36px;
  }
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #101522;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;

  @media (max-width: 700px) {
    font-size: 24px;
  }

  @media (max-height: 900px) {
    font-size: 26px;
  }
`;

const ModalSubtitle = styled.p`
  margin: 8px 0 0;
  color: #728095;
  font-size: 18px;
  line-height: 1.45;

  @media (max-width: 700px) {
    font-size: 15px;
  }

  @media (max-height: 900px) {
    margin-top: 4px;
    font-size: 15px;
  }
`;

const EmployeeForm = styled.form`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
`;

const ScrollableContent = styled.div`
  min-height: 0;
  overflow: visible;
  padding: 8px 42px 24px;

  @media (max-width: 700px) {
    padding: 6px 24px 20px;
  }

  @media (max-height: 900px) {
    padding: 0 36px 10px;
  }
`;

const PhotoSection = styled.section`
  display: flex;
  align-items: center;
  gap: 30px;
  min-height: 164px;

  @media (max-height: 900px) {
    min-height: 112px;

    > div:first-child {
      width: 104px;
      height: 104px;
      flex: 0 0 104px;
    }
  }

  @media (max-width: 520px) {
    align-items: flex-start;
    gap: 20px;

    > div:first-child {
      width: 112px;
      height: 112px;
      flex: 0 0 112px;
    }
  }
`;

const PhotoActions = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 11px;

  @media (max-height: 900px) {
    gap: 6px;
  }
`;

const ChangePhotoButton = styled.button`
  min-width: 184px;
  min-height: 50px;
  padding: 0 24px;
  border: 1.5px solid #008b98;
  border-radius: 10px;
  background: #ffffff;
  color: #007783;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f0fbfc;
  }

  &:disabled {
    border-color: #cbd5dc;
    color: #98a4b2;
    cursor: not-allowed;
  }

  @media (max-width: 520px) {
    min-width: 0;
    min-height: 44px;
    padding: 0 16px;
    font-size: 15px;
  }

  @media (max-height: 900px) {
    min-height: 42px;
    padding: 0 20px;
    font-size: 15px;
  }
`;

const PhotoHint = styled.span`
  color: #718096;
  font-size: 15px;
  line-height: 1.4;

  @media (max-height: 900px) {
    font-size: 13px;
  }
`;

const HiddenPhotoInput = styled.input`
  display: none;
`;

const Divider = styled.div`
  height: 1px;
  margin: 14px 0 24px;
  background: #dbe2e8;

  @media (max-height: 900px) {
    margin: 8px 0 14px;
  }
`;

const FormField = styled.div`
  min-width: 0;
  margin-bottom: 22px;

  @media (max-height: 900px) {
    margin-bottom: 12px;
  }
`;

const FieldLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #111827;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.35;

  @media (max-height: 900px) {
    margin-bottom: 5px;
    font-size: 14px;
  }
`;

const FieldControl = styled.div`
  width: 100%;

  > div,
  > div > div {
    width: 100%;
    max-width: none;
  }

  input,
  div[tabindex] {
    width: 100%;
    max-width: none;
    min-height: 54px;
    padding: 0 18px;
    border-color: #bac6d3;
    border-radius: 10px;
    font-size: 17px;
    line-height: 1.35;
    box-sizing: border-box;
  }

  input::placeholder {
    color: #9aa7b7;
  }

  @media (max-height: 900px) {
    input,
    div[tabindex] {
      min-height: 44px;
      font-size: 15px;
    }
  }
`;

const SectionTitle = styled.h3`
  margin: 5px 0 13px;
  color: #0d1320;
  font-size: 21px;
  font-weight: 700;
  line-height: 1.35;

  @media (max-height: 900px) {
    margin: 2px 0 8px;
    font-size: 18px;
  }
`;

const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 28px;

  @media (max-height: 900px) {
    gap: 22px;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const FieldHint = styled.span`
  display: block;
  margin-top: 7px;
  color: #7a8799;
  font-size: 14px;

  @media (max-height: 900px) {
    margin-top: 4px;
    font-size: 12px;
  }
`;

const PercentField = styled.div`
  position: relative;

  input {
    padding-right: 48px;
  }
`;

const PercentSuffix = styled.span`
  position: absolute;
  top: 50%;
  right: 19px;
  color: #465568;
  font-size: 17px;
  transform: translateY(-50%);
  pointer-events: none;
`;

const ModalFooter = styled.footer`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  margin: 0 28px;
  padding: 18px 14px 22px;
  border-top: 1px solid #dbe2e8;

  @media (max-width: 520px) {
    margin: 0 12px;
    padding: 14px 12px 18px;
  }

  @media (max-height: 900px) {
    padding: 10px 8px 12px;
  }
`;

const FooterButton = styled.button`
  min-height: 50px;
  padding: 0 30px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;

  @media (max-width: 520px) {
    min-height: 46px;
    padding: 0 18px;
  }

  @media (max-height: 900px) {
    min-height: 44px;
    font-size: 15px;
  }
`;

const CancelButton = styled(FooterButton)`
  border: 1px solid #8f9baa;
  background: #ffffff;
  color: #253044;

  &:hover {
    background: #f5f7f9;
  }
`;

const SaveButton = styled(FooterButton)`
  min-width: 220px;
  border: 1px solid #008b98;
  background: #008b98;
  color: #ffffff;

  &:hover:not(:disabled) {
    background: #007783;
  }

  &:disabled {
    border-color: #99ccd1;
    background: #99ccd1;
    cursor: not-allowed;
  }

  @media (max-width: 520px) {
    min-width: 0;
  }
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
