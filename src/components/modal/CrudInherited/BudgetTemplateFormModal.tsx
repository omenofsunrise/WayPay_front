import React from "react";
import BaseModal from "../BASE/modalCRUBase";
import CustomInput from "../../ui/fields/CustomInput";
import EntitySelectContainer from "../../ui/Layouts/EntitySelectContainer";
import { ProgressBar } from "../../ui/ProgressBar";
import styled from "styled-components";

export interface SelectedEntity {
  id: number;
  type: "investor" | "pool";
  nickname?: string;
  name?: string;
  fullName?: string;
  phoneNumber?: string;
  balance?: number;
  isCompany?: boolean;
}

export interface TemplateFormState {
  name: string;
  amount: string;
  comment: string;
  dayOfMonth: string;
  investorId: string;
  investorPoolId: string;
  companyShare: number;
}

interface BudgetTemplateFormModalProps {
  show: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  form: TemplateFormState;
  setForm: React.Dispatch<React.SetStateAction<TemplateFormState>>;
  selectedEntity: SelectedEntity | null;
  onEntitySelect: () => void;
  onEntityClear: () => void;
}

const formatMoney = (amount: string) => {
  const num = parseInt(amount, 10) || 0;
  return new Intl.NumberFormat("ru-RU").format(num);
};

const BudgetTemplateFormModal: React.FC<BudgetTemplateFormModalProps> = ({
  show,
  mode,
  onClose,
  onSave,
  form,
  setForm,
  selectedEntity,
  onEntitySelect,
  onEntityClear,
}) => {
  const [displayAmount, setDisplayAmount] = React.useState("");
  const [companyPercentage, setCompanyPercentage] = React.useState("100");
  const [investorPercentage, setInvestorPercentage] = React.useState("0");

  React.useEffect(() => {
    if (show) {
      const numericValue = form.amount.replace(/\D/g, "");
      setDisplayAmount(
        numericValue
          ? new Intl.NumberFormat("ru-RU").format(parseInt(numericValue, 10))
          : ""
      );

      if (selectedEntity?.type === "investor" && !selectedEntity.isCompany) {
        setCompanyPercentage(form.companyShare.toString());
        setInvestorPercentage((100 - form.companyShare).toString());
      } else {
        setCompanyPercentage("100");
        setInvestorPercentage("0");
      }
    } else {
      setDisplayAmount("");
      setCompanyPercentage("100");
      setInvestorPercentage("0");
    }
  }, [show, form.amount, form.companyShare, selectedEntity]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^\d]/g, "");
    setForm((prev) => ({ ...prev, amount: numericValue }));
    setDisplayAmount(
      numericValue
        ? new Intl.NumberFormat("ru-RU").format(parseInt(numericValue, 10))
        : ""
    );
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d]/g, "");
    if (value !== "") {
      const num = Math.min(31, Math.max(1, parseInt(value, 10)));
      value = num.toString();
    }
    setForm((prev) => ({ ...prev, dayOfMonth: value }));
  };

  const canEditDistribution =
    selectedEntity?.type === "investor" && !selectedEntity.isCompany;

  const handleCompanyPercentageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!canEditDistribution) return;
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 100)) {
      setCompanyPercentage(value);
      if (value !== "") {
        const companyPercent = parseInt(value);
        setInvestorPercentage((100 - companyPercent).toString());
        setForm((prev) => ({ ...prev, companyShare: companyPercent }));
      }
    }
  };

  const handleInvestorPercentageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!canEditDistribution) return;
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 100)) {
      setInvestorPercentage(value);
      if (value !== "") {
        const investorPercent = parseInt(value);
        setCompanyPercentage((100 - investorPercent).toString());
        setForm((prev) => ({ ...prev, companyShare: 100 - investorPercent }));
      }
    }
  };

  const handleProgressChange = (percentage: number) => {
    if (!canEditDistribution) return;
    setCompanyPercentage(percentage.toString());
    setInvestorPercentage((100 - percentage).toString());
    setForm((prev) => ({ ...prev, companyShare: percentage }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) {
      alert("Укажите название и сумму расхода");
      return;
    }
    try {
      await onSave(e);
    } catch (error) {
      console.error("Ошибка при сохранении шаблона расхода:", error);
    }
  };

  const getEntityDisplayName = () => {
    if (!selectedEntity) return "";
    return selectedEntity.type === "investor"
      ? selectedEntity.nickname || selectedEntity.fullName || ""
      : selectedEntity.name || "";
  };

  const getEntityTypeLabel = () => {
    if (!selectedEntity) return "";
    return selectedEntity.type === "investor" ? "Инвестор" : "Пул";
  };

  const amountNumber = parseInt(form.amount, 10) || 0;

  if (!show) return null;

  return (
    <BaseModal
      title={mode === "edit" ? "Редактировать расход" : "Постоянный расход"}
      mode={mode}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSave}
      saveButtonText={mode === "edit" ? "Сохранить" : "Добавить"}
      isSaveDisabled={!form.name.trim() || !form.amount}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "20px",
        }}
      >
        <Field>
          <FieldLabel>Название</FieldLabel>
          <CustomInput
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Например, аренда или зарплата"
            inputType="text"
            required
          />
        </Field>

        <Field>
          <FieldLabel>Сумма</FieldLabel>
          <CustomInput
            type="text"
            value={displayAmount}
            onChange={handleAmountChange}
            placeholder="Введите сумму"
            inputType="text"
            required
          />
        </Field>

        <Field>
          <FieldLabel>День списания (1–31)</FieldLabel>
          <CustomInput
            type="text"
            value={form.dayOfMonth}
            onChange={handleDayChange}
            placeholder="Например, 5"
            inputType="number"
          />
        </Field>

        <Field>
          <FieldLabel>Комментарий</FieldLabel>
          <CustomInput
            type="text"
            value={form.comment}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, comment: e.target.value }))
            }
            placeholder="Необязательно"
            inputType="text"
          />
        </Field>

        <Field>
          <FieldLabel>Инвестор или пул (необязательно)</FieldLabel>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <EntitySelectContainer
              mode="create"
              primaryValue={getEntityDisplayName()}
              secondaryValue={selectedEntity ? `${getEntityTypeLabel()}` : ""}
              placeholder="Выберите инвестора или пул"
              onSelect={onEntitySelect}
              onClear={onEntityClear}
            />
          </div>
        </Field>

        {canEditDistribution && (
          <PercentageSection>
            <PercentageTitle>Распределение расхода</PercentageTitle>
            <PercentageSubtitle>
              Укажите, как распределить сумму между компанией и инвестором
            </PercentageSubtitle>

            <PercentageInputsContainer>
              <PercentageInputGroup>
                <PercentageLabel>Компания (%)</PercentageLabel>
                <CustomInput
                  type="text"
                  value={companyPercentage}
                  onChange={handleCompanyPercentageChange}
                  placeholder="0"
                  inputType="text"
                />
                <PercentageAmount>
                  {amountNumber > 0
                    ? `${formatMoney(
                        Math.round(
                          (amountNumber * (parseInt(companyPercentage) || 0)) /
                            100
                        ).toString()
                      )} руб.`
                    : "—"}
                </PercentageAmount>
              </PercentageInputGroup>

              <PercentageInputGroup>
                <PercentageLabel>Инвестор (%)</PercentageLabel>
                <CustomInput
                  type="text"
                  value={investorPercentage}
                  onChange={handleInvestorPercentageChange}
                  placeholder="0"
                  inputType="text"
                />
                <PercentageAmount>
                  {amountNumber > 0
                    ? `${formatMoney(
                        Math.round(
                          (amountNumber * (parseInt(investorPercentage) || 0)) /
                            100
                        ).toString()
                      )} руб.`
                    : "—"}
                </PercentageAmount>
              </PercentageInputGroup>
            </PercentageInputsContainer>

            <ProgressBarContainer>
              <ProgressBarLabels>
                <ProgressBarLabel>
                  <ColorSquare color="company" />
                  Компания: {companyPercentage}%
                </ProgressBarLabel>
                <ProgressBarLabel>
                  <ColorSquare color="investor" />
                  Инвестор: {investorPercentage}%
                </ProgressBarLabel>
              </ProgressBarLabels>

              <ProgressBar
                percentage={parseInt(companyPercentage) || 0}
                onChange={handleProgressChange}
                draggable={true}
                colors={{ primary: "#007D88", secondary: "#25CBA1" }}
              />
            </ProgressBarContainer>
          </PercentageSection>
        )}
      </div>
    </BaseModal>
  );
};

export default BudgetTemplateFormModal;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #555;
`;

const PercentageSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const PercentageTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  text-align: center;
`;

const PercentageSubtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: #666;
  text-align: center;
`;

const PercentageInputsContainer = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const PercentageInputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PercentageLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #555;
  text-align: center;
`;

const PercentageAmount = styled.div`
  font-size: 12px;
  color: #666;
  text-align: center;
  min-height: 16px;
`;

const ProgressBarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ProgressBarLabels = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

const ProgressBarLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
`;

const ColorSquare = styled.div<{ color: "company" | "investor" }>`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: ${(props) =>
    props.color === "company" ? "#007D88" : "#25CBA1"};
`;
