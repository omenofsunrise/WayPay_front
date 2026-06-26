import React, { useState, useEffect, useCallback } from "react";
import BaseModal from "../BASE/modalCRUBase";
import CustomTable, { type TableAction } from "../../ui/tables/CustomTable";
import DarkCyanButton from "../../ui/Buttons/DarkCyanButton";
import InvestorSelectModal from "./InvestorSelectModal";
import BudgetTemplateFormModal, {
  type SelectedEntity,
  type TemplateFormState,
} from "./BudgetTemplateFormModal";
import useBudgetTemplate from "../../../api/hooks/useBudgetTemplate";
import type {
  BudgetTemplate,
  CreateBudgetTemplateDto,
  UpdateBudgetTemplateDto,
} from "../../../api/types/budgetTemplate";
import { formatMoney } from "../../../utils/formatPrice";
import styled from "styled-components";

interface BudgetTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Вызывается после любого изменения шаблонов — чтобы родитель мог обновить бюджет. */
  onChanged?: () => void;
}

const emptyForm: TemplateFormState = {
  name: "",
  amount: "",
  comment: "",
  dayOfMonth: "",
  investorId: "",
  investorPoolId: "",
  companyShare: 100,
};

const BudgetTemplatesModal: React.FC<BudgetTemplatesModalProps> = ({
  isOpen,
  onClose,
  onChanged,
}) => {
  const {
    templates,
    isLoading,
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setTemplateActive,
  } = useBudgetTemplate();

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TemplateFormState>(emptyForm);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(
    null
  );
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);

  const loadTemplates = useCallback(() => {
    getTemplates({ type: "Outcome" });
  }, [getTemplates]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  const refresh = useCallback(() => {
    loadTemplates();
    onChanged?.();
  }, [loadTemplates, onChanged]);

  const handleOpenCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setSelectedEntity(null);
    setShowForm(true);
  };

  const handleOpenEdit = (template: BudgetTemplate) => {
    setFormMode("edit");
    setEditingId(template.id);
    setForm({
      name: template.name ?? "",
      amount:
        template.amount != null ? Math.round(template.amount).toString() : "",
      comment: template.comment ?? "",
      dayOfMonth: template.dayOfMonth ? template.dayOfMonth.toString() : "",
      investorId: template.investorId ? template.investorId.toString() : "",
      investorPoolId: template.investorPoolId
        ? template.investorPoolId.toString()
        : "",
      companyShare: template.companyShare ?? 100,
    });

    if (template.investorId) {
      setSelectedEntity({
        id: template.investorId,
        type: "investor",
        nickname: template.investor?.nickname,
        fullName: template.investor?.fullName,
      });
    } else if (template.investorPoolId) {
      setSelectedEntity({
        id: template.investorPoolId,
        type: "pool",
        name: template.pool?.name,
      });
    } else {
      setSelectedEntity(null);
    }

    setShowForm(true);
  };

  const handleSelectEntity = (entity: SelectedEntity) => {
    setSelectedEntity(entity);
    if (entity.type === "investor") {
      setForm((prev) => ({
        ...prev,
        investorId: entity.id.toString(),
        investorPoolId: "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        investorId: "",
        investorPoolId: entity.id.toString(),
      }));
    }
    setIsInvestorModalOpen(false);
  };

  const handleClearEntity = () => {
    setSelectedEntity(null);
    setForm((prev) => ({
      ...prev,
      investorId: "",
      investorPoolId: "",
      companyShare: 100,
    }));
  };

  const handleSaveForm = async () => {
    const amount = parseFloat(form.amount);
    if (!form.name.trim() || isNaN(amount)) {
      alert("Укажите название и сумму расхода");
      return;
    }

    const base = {
      name: form.name.trim(),
      amount,
      comment: form.comment || undefined,
      dayOfMonth: form.dayOfMonth ? parseInt(form.dayOfMonth, 10) : undefined,
      investorId:
        selectedEntity?.type === "investor" && form.investorId
          ? parseInt(form.investorId, 10)
          : undefined,
      investorPoolId:
        selectedEntity?.type === "pool" && form.investorPoolId
          ? parseInt(form.investorPoolId, 10)
          : undefined,
      companyShare:
        selectedEntity?.type === "investor" ? form.companyShare : undefined,
    };

    let ok: BudgetTemplate | null = null;
    if (formMode === "create") {
      const dto: CreateBudgetTemplateDto = { ...base, type: "Outcome" };
      ok = await createTemplate(dto);
    } else if (editingId != null) {
      const dto: UpdateBudgetTemplateDto = { ...base };
      ok = await updateTemplate(editingId, dto);
    }

    if (ok) {
      setShowForm(false);
      setForm(emptyForm);
      setSelectedEntity(null);
      setEditingId(null);
      refresh();
    } else {
      alert("Не удалось сохранить расход");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Удалить постоянный расход?")) return;
    await deleteTemplate(id);
    refresh();
  };

  const handleToggleActive = async (template: BudgetTemplate) => {
    await setTemplateActive(template.id, !template.isActive);
    refresh();
  };

  const tableData = templates.map((t) => [
    t.id,
    t.name,
    formatMoney((t.amount ?? 0).toString()),
    t.dayOfMonth ? t.dayOfMonth.toString() : "—",
    t.isActive ? "Активен" : "Выключен",
  ]);

  const contextMenuActions: TableAction[] = [
    {
      label: "Редактировать",
      action: (rowData: any[]) => {
        const template = templates.find((t) => t.id === rowData[0]);
        if (template) handleOpenEdit(template);
      },
    },
    {
      label: "Активировать",
      shouldShow: (rowData: any[]) => {
        const template = templates.find((t) => t.id === rowData[0]);
        return !!template && !template.isActive;
      },
      action: (rowData: any[]) => {
        const template = templates.find((t) => t.id === rowData[0]);
        if (template) handleToggleActive(template);
      },
    },
    {
      label: "Выключить",
      shouldShow: (rowData: any[]) => {
        const template = templates.find((t) => t.id === rowData[0]);
        return !!template && template.isActive;
      },
      action: (rowData: any[]) => {
        const template = templates.find((t) => t.id === rowData[0]);
        if (template) handleToggleActive(template);
      },
    },
    {
      label: "Удалить",
      color: "red",
      action: (rowData: any[]) => handleDelete(rowData[0]),
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      <BaseModal
        title="Постоянные расходы"
        onClose={onClose}
        onCancel={onClose}
        hideSaveButton
        width="760px"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            padding: "12px 8px",
          }}
        >
          <HeaderRow>
            <Hint>
              Аренда, зарплата и другие регулярные списания каждый месяц.
            </Hint>
            <DarkCyanButton type="button" onClick={handleOpenCreate}>
              + Добавить
            </DarkCyanButton>
          </HeaderRow>

          <CustomTable
            columns={[
              { name: "id" },
              { name: "Название", align: "left" },
              { name: "Сумма", align: "left" },
              { name: "День", align: "center" },
              { name: "Статус", align: "center" },
            ]}
            data={tableData}
            contextMenuActions={contextMenuActions}
            isLoading={isLoading}
          />

          {!isLoading && tableData.length === 0 && (
            <EmptyState>
              Постоянных расходов пока нет. Нажмите «Добавить».
            </EmptyState>
          )}
        </div>
      </BaseModal>

      <BudgetTemplateFormModal
        show={showForm}
        mode={formMode}
        onClose={() => setShowForm(false)}
        onSave={async (e) => {
          e.preventDefault();
          await handleSaveForm();
        }}
        form={form}
        setForm={setForm}
        selectedEntity={selectedEntity}
        onEntitySelect={() => setIsInvestorModalOpen(true)}
        onEntityClear={handleClearEntity}
      />

      <InvestorSelectModal
        isOpen={isInvestorModalOpen}
        onClose={() => setIsInvestorModalOpen(false)}
        onSubmit={handleSelectEntity}
        includePools={true}
      />
    </>
  );
};

export default BudgetTemplatesModal;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const Hint = styled.span`
  font-size: 14px;
  color: #666;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #888;
  font-size: 14px;
  padding: 16px 0;
`;
