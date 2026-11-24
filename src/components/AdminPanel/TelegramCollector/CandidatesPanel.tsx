import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import telegramCollectorService from "../../../api/services/telegramCollectorService";
import type {
  BlacklistCandidate,
  CandidateConfidence,
  CandidateStatus,
  CandidateUpdate,
} from "../../../api/types/telegramCollector";
import BaseModal from "../../modal/BASE/modalCRUBase";
import DarkCyanButton from "../../ui/Buttons/DarkCyanButton";
import CustomInput from "../../ui/fields/CustomInput";
import CustomSelect from "../../ui/fields/CustomSelect";
import Pagination from "../../ui/fields/CustomPagination";
import PaginationLayout from "../../ui/Layouts/PaginationLayout";
import {
  Actions,
  Badge,
  Badges,
  type BadgeTone,
  Card,
  CardHeader,
  Column,
  Empty,
  ErrorMessage,
  Field,
  formatDate,
  formatDateTime,
  getErrorMessage,
  Hint,
  Label,
  ModalForm,
  Muted,
  SecondaryButton,
  SuccessMessage,
  TextArea,
  Title,
  Toolbar,
  ToolbarGroup,
} from "./ui";

const PAGE_SIZE = 20;

type StatusFilter = CandidateStatus | "All";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "Pending", label: "Ждут проверки" },
  { value: "Added", label: "Добавлены в ЧС+" },
  { value: "Rejected", label: "Отклонены" },
  { value: "Duplicate", label: "Дубли" },
  { value: "All", label: "Все" },
];

const STATUS_BADGE: Record<CandidateStatus, [string, BadgeTone]> = {
  Pending: ["Ждёт проверки", "amber"],
  Added: ["В ЧС+", "green"],
  Rejected: ["Отклонён", "gray"],
  Duplicate: ["Дубль", "gray"],
};

const CONFIDENCE_BADGE: Record<CandidateConfidence, [string, BadgeTone]> = {
  High: ["Уверенно", "teal"],
  Medium: ["Средне", "amber"],
  Low: ["Не уверен", "red"],
};

const toInputDate = (value: string | null) => (value ? value.slice(0, 10) : "");

interface Props {
  onChanged: () => void;
}

/** Очередь людей, найденных нейросетью: проверка и добавление в ЧС+. */
const CandidatesPanel = ({ onChanged }: Props) => {
  const [status, setStatus] = useState<StatusFilter>("Pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<BlacklistCandidate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<BlacklistCandidate | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await telegramCollectorService.getCandidates({
        status: status === "All" ? undefined : status,
        search: search.trim() || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    const timeout = window.setTimeout(load, 300);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const runAction = async (
    candidate: BlacklistCandidate,
    action: () => Promise<BlacklistCandidate>,
    successText: (updated: BlacklistCandidate) => string
  ) => {
    setBusyId(candidate.id);
    setError(null);
    setSuccess(null);
    try {
      const updated = await action();
      setSuccess(successText(updated));
      // Карточка ушла из текущего фильтра — перечитываем список и счётчики.
      await load();
      onChanged();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = (c: BlacklistCandidate) =>
    runAction(
      c,
      () => telegramCollectorService.approve(c.id),
      (u) =>
        u.status === "Duplicate"
          ? `${u.fullName}: ${u.duplicateReason ?? "уже есть в ЧС+"}`
          : `${u.fullName} добавлен в ЧС+`
    );

  const handleReject = (c: BlacklistCandidate) =>
    runAction(c, () => telegramCollectorService.reject(c.id), (u) => `${u.fullName} отклонён`);

  const handleReopen = (c: BlacklistCandidate) =>
    runAction(
      c,
      () => telegramCollectorService.reopen(c.id),
      (u) => `${u.fullName} снова ждёт проверки`
    );

  return (
    <Column>
      <Toolbar>
        <ToolbarGroup>
          <FilterBox>
            <CustomSelect
              value={status}
              options={STATUS_OPTIONS}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            />
          </FilterBox>
          <SearchBox>
            <CustomInput
              value={search}
              placeholder="ФИО или телефон"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </SearchBox>
        </ToolbarGroup>
        <Muted>{isLoading ? "Загрузка…" : `Найдено: ${totalCount}`}</Muted>
      </Toolbar>

      {success && <SuccessMessage>{success}</SuccessMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!isLoading && items.length === 0 && (
        <Empty>
          {status === "Pending"
            ? "Новых находок нет. Они появятся, когда в выбранных чатах напишут о должниках или мошенниках."
            : "Ничего не найдено"}
        </Empty>
      )}

      {items.map((c) => {
        const [statusText, statusTone] = STATUS_BADGE[c.status];
        const [confText, confTone] = CONFIDENCE_BADGE[c.confidence];
        const busy = busyId === c.id;
        return (
          <Card key={c.id}>
            <CardHeader>
              <div>
                <Title>{c.fullName}</Title>
                <Details>
                  <span>{c.phone || "телефона нет"}</span>
                  {c.birthdate && <span>род. {formatDate(c.birthdate)}</span>}
                  {c.doc && <span>паспорт {c.doc}</span>}
                  {c.address && <span>{c.address}</span>}
                </Details>
              </div>
              <Badges>
                <Badge $tone={statusTone}>
                  {statusText}
                  {c.status === "Added" && c.autoAdded ? " (авто)" : ""}
                </Badge>
                <Badge $tone={confTone}>{confText}</Badge>
              </Badges>
            </CardHeader>

            {c.comment && <Reason>{c.comment}</Reason>}

            <Source>
              <Muted>
                {c.chatTitle}
                {c.senderName ? ` · ${c.senderName}` : ""} · {formatDateTime(c.messageDate)}
              </Muted>
              {c.replyText && <Quote>{c.replyText}</Quote>}
              <MessageText>{c.messageText}</MessageText>
            </Source>

            {c.duplicateReason && <Muted>{c.duplicateReason}</Muted>}
            {c.lastError && <ErrorMessage>{c.lastError}</ErrorMessage>}

            <Actions>
              {c.status === "Pending" && (
                <>
                  <DarkCyanButton disabled={busy} onClick={() => handleApprove(c)}>
                    {busy ? "Отправка…" : "Добавить в ЧС+"}
                  </DarkCyanButton>
                  <SecondaryButton disabled={busy} onClick={() => setEditing(c)}>
                    Изменить
                  </SecondaryButton>
                  <SecondaryButton $danger disabled={busy} onClick={() => handleReject(c)}>
                    Отклонить
                  </SecondaryButton>
                </>
              )}
              {(c.status === "Rejected" || c.status === "Duplicate") && (
                <SecondaryButton disabled={busy} onClick={() => handleReopen(c)}>
                  Вернуть на проверку
                </SecondaryButton>
              )}
              {c.status === "Added" && c.blacklistId && (
                <Muted>Запись ЧС+ № {c.blacklistId}</Muted>
              )}
            </Actions>
          </Card>
        );
      })}

      {totalCount > PAGE_SIZE && (
        <PaginationLayout>
          <Pagination
            total={totalCount}
            current={page}
            itemsPerPage={PAGE_SIZE}
            onChange={setPage}
          />
        </PaginationLayout>
      )}

      {editing && (
        <EditCandidateModal
          candidate={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            setSuccess("Изменения сохранены");
            await load();
          }}
        />
      )}
    </Column>
  );
};

interface EditProps {
  candidate: BlacklistCandidate;
  onClose: () => void;
  onSaved: () => void;
}

const EditCandidateModal = ({ candidate, onClose, onSaved }: EditProps) => {
  const [form, setForm] = useState<CandidateUpdate>({
    fullName: candidate.fullName,
    phone: candidate.phone,
    birthdate: toInputDate(candidate.birthdate) || null,
    doc: candidate.doc,
    address: candidate.address,
    comment: candidate.comment,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof CandidateUpdate) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value || null }));

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.fullName?.trim()) {
      setError("Укажите ФИО");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await telegramCollectorService.updateCandidate(candidate.id, {
        ...form,
        fullName: form.fullName.trim(),
      });
      onSaved();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal
      title="Данные для ЧС+"
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSave}
      isSubmitting={isSaving}
      saveButtonText="Сохранить"
    >
      <ModalForm>
        <Field>
          <Label>ФИО</Label>
          <CustomInput value={form.fullName ?? ""} onChange={(e) => set("fullName")(e.target.value)} />
        </Field>
        <Field>
          <Label>Телефон</Label>
          <CustomInput
            value={form.phone ?? ""}
            placeholder="8 (928) 123-45-67"
            onChange={(e) => set("phone")(e.target.value)}
          />
        </Field>
        <Field>
          <Label>Дата рождения</Label>
          <CustomInput
            type="date"
            value={form.birthdate ?? ""}
            onChange={(e) => set("birthdate")(e.target.value)}
          />
        </Field>
        <Field>
          <Label>Паспорт</Label>
          <CustomInput value={form.doc ?? ""} onChange={(e) => set("doc")(e.target.value)} />
        </Field>
        <Field>
          <Label>Адрес</Label>
          <CustomInput value={form.address ?? ""} onChange={(e) => set("address")(e.target.value)} />
        </Field>
        <Field>
          <Label>Причина</Label>
          <TextArea value={form.comment ?? ""} onChange={(e) => set("comment")(e.target.value)} />
          <Hint>Причина хранится в WayPay: в самом ЧС+ поля для неё пока нет.</Hint>
        </Field>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </ModalForm>
    </BaseModal>
  );
};

const FilterBox = styled.div`
  width: 220px;
`;

const SearchBox = styled.div`
  width: min(320px, 100%);
`;

const Details = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin-top: 4px;
  color: #475467;
  font-size: 14px;
`;

const Reason = styled.div`
  color: #101828;
  font-size: 14px;
`;

const Source = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f9fafb;
`;

const Quote = styled.div`
  padding-left: 10px;
  border-left: 3px solid #d0d5dd;
  color: #667085;
  font-size: 13px;
  white-space: pre-wrap;
  max-height: 80px;
  overflow: hidden;
`;

const MessageText = styled.div`
  color: #344054;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 220px;
  overflow-y: auto;
`;

export default CandidatesPanel;
