import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import BaseModal from "../BASE/modalCRUBase";
import CustomInput from "../../ui/fields/CustomInput";
import CustomSelect from "../../ui/fields/CustomSelect";
import Checkbox from "../../ui/CheckBoxes/Checkbox";
import {
  PERMISSION_DEFINITIONS,
  CUSTOM_ROLE_BASE_OPTIONS,
} from "../../../api/constants/permissions";
import type {
  CustomRole,
  CustomRolePayload,
} from "../../../api/types/employee";

type CustomRoleModalProps = {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CustomRolePayload) => Promise<void>;
  initialData?: CustomRole | null;
  isSubmitting?: boolean;
};

const CustomRoleModal: React.FC<CustomRoleModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSave,
  initialData,
  isSubmitting = false,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState<string>(CUSTOM_ROLE_BASE_OPTIONS[0].value);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialData?.name ?? "");
    setDescription(initialData?.description ?? "");
    setRole(initialData?.role ?? CUSTOM_ROLE_BASE_OPTIONS[0].value);
    setSelected(new Set((initialData?.permissions ?? []).map((p) => p.code)));
    setTouched(false);
  }, [isOpen, initialData]);

  const togglePermission = (code: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  };

  const nameError = useMemo(() => name.trim().length === 0, [name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameError) return;

    await onSave({
      name: name.trim(),
      description: description.trim(),
      role,
      permissionCodes: Array.from(selected),
    });
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title={mode === "create" ? "Новая роль" : "Редактирование роли"}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSave}
      isSaveDisabled={nameError || isSubmitting}
      isSubmitting={isSubmitting}
      width="640px"
    >
      <FieldGroup>
        <Label>Название</Label>
        <CustomInput
          inputType="text"
          placeholder="Например: Старший менеджер"
          value={name}
          onChange={(e) => setName(e.target.value)}
          hasError={touched && nameError}
          errorMessage={
            touched && nameError ? "Укажите название роли" : undefined
          }
          style={{ maxWidth: "none", width: "100%" }}
        />

        <Label>Описание</Label>
        <CustomInput
          inputType="text"
          placeholder="Описание роли"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ maxWidth: "none", width: "100%" }}
        />

        <Label>Базовая роль</Label>
        <CustomSelect
          options={CUSTOM_ROLE_BASE_OPTIONS}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Выберите базовую роль"
          dropdownInPortal
        />

        <Label>Права доступа</Label>
        <PermissionsGrid>
          {PERMISSION_DEFINITIONS.map(({ code, description }) => (
            <PermissionRow
              key={code}
              onClick={() => togglePermission(code, !selected.has(code))}
            >
              <CheckboxSlot>
                <Checkbox checked={selected.has(code)} />
              </CheckboxSlot>
              <PermissionText>{description}</PermissionText>
            </PermissionRow>
          ))}
        </PermissionsGrid>
      </FieldGroup>
    </BaseModal>
  );
};

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  width: 100%;
`;

const Label = styled.h3`
  color: black;
  margin: 12px 0 0 0;
  font-size: 14px;
  font-weight: 400;
`;

const PermissionsGrid = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  margin-top: 6px;
  border: 1px solid rgba(229, 231, 235, 1);
  border-radius: 8px;
  overflow: hidden;
`;

const PermissionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  text-align: left;

  & + & {
    border-top: 1px solid rgba(243, 244, 246, 1);
  }

  &:hover {
    background-color: rgba(0, 125, 136, 0.05);
  }
`;

const CheckboxSlot = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
`;

const PermissionText = styled.span`
  flex: 1 1 auto;
  text-align: left;
  color: black;
  font-size: 14px;
  line-height: 1.2;
`;

export default CustomRoleModal;
