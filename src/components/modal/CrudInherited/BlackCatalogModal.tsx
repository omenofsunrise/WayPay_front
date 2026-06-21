import React, { useState, useEffect } from "react";
import BaseModal, { type ModalMode } from "../BASE/modalCRUBase";
import CustomInput from "../../ui/fields/CustomInput";
import PhoneModalInput from "../../ui/fields/PhoneModalInput";
import { formatDate, parseBlacklistDate } from "../../../utils/dateFormatter";

interface BlacklistClient {
  id: number;
  fullName: string;
  phone: string;
  birthdate: Date | null;
  debt: number;
  secondPhone?: string;
  doc?: string;
  docIssueDate?: Date | null;
  docIssueYear?: number;
  address?: string | null;
  creditIds?: string[];
  creditRestTerms?: string[];
  hasPassportPhoto?: boolean;
  isSwindler?: boolean;
  debtEndingAt?: Date | null;
}

type BlacklistModalProps = {
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: Partial<BlacklistClient>) => void;
  initialData?: Partial<BlacklistClient>;
};

export const BlackCatalogModal: React.FC<BlacklistModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData = {
    fullName: "",
    phone: "",
    birthdate: null,
    doc: "",
    docIssueDate: null,
    address: "",
    secondPhone: "",
  },
}) => {
  const [formData, setFormData] = useState({
    fullName: initialData.fullName || "",
    phone: initialData.phone || "",
    birthdate: initialData.birthdate ? formatDate(initialData.birthdate) : "",
    doc: initialData.doc || "",
    docIssueDate: initialData.docIssueDate
      ? formatDate(initialData.docIssueDate)
      : "",
    address: initialData.address || "",
    secondPhone: initialData.secondPhone || "",
    debtEndingAt: initialData.debtEndingAt
      ? formatDate(initialData.debtEndingAt)
      : "",
    isSwindler: initialData.isSwindler || false,
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: initialData.fullName || "",
        phone: initialData.phone || "",
        birthdate: initialData.birthdate
          ? formatDate(initialData.birthdate)
          : "",
        doc: initialData.doc || "",
        docIssueDate: initialData.docIssueDate
          ? formatDate(initialData.docIssueDate)
          : "",
        address: initialData.address || "",
        secondPhone: initialData.secondPhone || "",
        debtEndingAt: initialData.debtEndingAt
          ? formatDate(initialData.debtEndingAt)
          : "",
        isSwindler: initialData.isSwindler || false,
      });
      setValidationErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    validateForm();
  }, [formData, mode, initialData]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (
      formData.phone &&
      !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\D/g, ""))
    ) {
      errors.phone = "Неверный формат телефона";
    }

    if (formData.birthdate) {
      const birthDate = parseBlacklistDate(formData.birthdate);
      if (!birthDate || birthDate > new Date()) {
        errors.birthdate = "Неверная дата рождения";
      }
    }

    if (formData.docIssueDate) {
      const issueDate = parseBlacklistDate(formData.docIssueDate);
      if (!issueDate || issueDate > new Date()) {
        errors.docIssueDate = "Неверная дата выдачи";
      }
    }

    if (mode === "create") {
      setIsSaveDisabled(false);
    } else if (mode === "edit") {
      const isChanged =
        formData.fullName !== initialData.fullName ||
        formData.phone !== initialData.phone ||
        formData.birthdate !==
          (initialData.birthdate ? formatDate(initialData.birthdate) : "") ||
        formData.doc !== initialData.doc ||
        formData.docIssueDate !==
          (initialData.docIssueDate
            ? formatDate(initialData.docIssueDate)
            : "") ||
        formData.address !== initialData.address ||
        formData.secondPhone !== initialData.secondPhone;

      // setIsSaveDisabled(!isChanged);
      setIsSaveDisabled(false);
    } else if (mode === "view") {
      setIsSaveDisabled(false);
    }
  };

  const handlePhoneChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      handleInputChange(field, e.target.value);
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const submitData: Partial<BlacklistClient> = {
      fullName: formData.fullName.trim() || undefined,
      phone: formData.phone || undefined,
      birthdate: formData.birthdate
        ? parseBlacklistDate(formData.birthdate)
        : null,
      doc: formData.doc.trim() || undefined,
      docIssueDate: formData.docIssueDate
        ? parseBlacklistDate(formData.docIssueDate)
        : null,
      address: formData.address.trim() || undefined,
      secondPhone: formData.secondPhone.trim() || undefined,
      debtEndingAt: formData.debtEndingAt
        ? parseBlacklistDate(formData.debtEndingAt)
        : null,
      isSwindler: formData.isSwindler,
    };

    onSubmit(submitData);
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Добавить в чёрный список";
      case "edit":
        return "Редактировать клиента";
      case "view":
        return "Просмотр клиента";
      default:
        return "Клиент";
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title={getTitle()}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSaveDisabled={isSaveDisabled}
      mode={mode}
      width="500px"
    >
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <CustomInput
          inputType="fullname"
          placeholder="ФИО клиента"
          value={formData.fullName}
          onChange={(e) => handleInputChange("fullName", e.target.value)}
          disabled={mode === "view"}
        />

        <CustomInput
          inputType="date"
          placeholder="Дата рождения"
          value={formData.birthdate}
          onChange={(e) => handleInputChange("birthdate", e.target.value)}
          disabled={mode === "view"}
          hasError={!!validationErrors.birthdate}
          errorMessage={validationErrors.birthdate}
        />

        <CustomInput
          inputType="text"
          placeholder="Серия и номер документа"
          value={formData.doc}
          onChange={(e) => handleInputChange("doc", e.target.value)}
          disabled={mode === "view"}
        />

        <CustomInput
          inputType="text"
          placeholder="Адрес регистрации"
          value={formData.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          disabled={mode === "view"}
        />

        <CustomInput
          inputType="date"
          placeholder="Долг до (дата)"
          value={formData.debtEndingAt}
          onChange={(e) => handleInputChange("debtEndingAt", e.target.value)}
          disabled={mode === "view"}
        />

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: mode === "view" ? "default" : "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={formData.isSwindler}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, isSwindler: e.target.checked }))
            }
            disabled={mode === "view"}
          />
          Мошенник
        </label>
      </div>
    </BaseModal>
  );
};

export default BlackCatalogModal;
