import { useMemo, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import {
  BOT_LOOPS,
  BOT_VARIABLE_GROUPS,
  renderBotTemplate,
  validateBotTemplate,
  type BotLoop,
  type LoopType
} from './botTemplateVariables';

interface BotResponseConstructorProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

const SCOPE_ACCENTS: Record<'global' | LoopType, string> = {
  global: '#007D88',
  foreachLoan: '#E07B00',
  foreachPaymentInLoan: '#C2410C',
  foreachPayment: '#9333EA',
  foreachSchedule: '#0EA5E9'
};

const SCOPE_BG: Record<'global' | LoopType, string> = {
  global: 'rgba(0, 125, 136, 0.08)',
  foreachLoan: 'rgba(224, 123, 0, 0.08)',
  foreachPaymentInLoan: 'rgba(194, 65, 12, 0.08)',
  foreachPayment: 'rgba(147, 51, 234, 0.08)',
  foreachSchedule: 'rgba(14, 165, 233, 0.08)'
};

const BotResponseConstructor = ({ value, onChange, disabled }: BotResponseConstructorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState(0);

  const handleSelect = () => {
    const el = textareaRef.current;
    if (el) setCursorPos(el.selectionStart ?? 0);
  };

  const insertAtCursor = (snippet: string, cursorOffset?: number) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + snippet);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.substring(0, start) + snippet + value.substring(end);
    onChange(next);

    const newPos = cursorOffset !== undefined ? start + cursorOffset : start + snippet.length;
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
      setCursorPos(newPos);
    }, 0);
  };

  const insertVariable = (key: string) => insertAtCursor(`{${key}}`);

  const insertLoop = (loop: BotLoop) => {
    const indent = '  ';
    const snippet = `{${loop.type}}\n${indent}\n{/${loop.type}}`;
    const cursorOffset = `{${loop.type}}\n${indent}`.length;
    insertAtCursor(snippet, cursorOffset);
  };

  const cursorContext = useMemo(() => detectCursorContext(value, cursorPos), [value, cursorPos]);
  const issues = useMemo(() => validateBotTemplate(value), [value]);
  const preview = useMemo(() => renderBotTemplate(value), [value]);
  const charCount = value.length;

  return (
    <Layout>
      <EditorColumn>
        <Card>
          <CardHeader>
            <CardTitle>
              <Dot $color="#007D88" /> Циклы
            </CardTitle>
            <CardHint>Кликни — вставится парный блок с курсором внутри</CardHint>
          </CardHeader>
          <LoopGrid>
            {BOT_LOOPS.map(loop => {
              const isNested = loop.parent !== undefined;
              const canInsert = !isNested || cursorContext.includes(loop.parent!);
              const accent = SCOPE_ACCENTS[loop.type];
              return (
                <LoopCard
                  key={loop.type}
                  onClick={() => insertLoop(loop)}
                  disabled={disabled || !canInsert}
                  $accent={accent}
                  title={
                    canInsert
                      ? loop.description
                      : `Можно вставить только внутри {${loop.parent}}`
                  }
                >
                  <LoopCardTopRow>
                    <LoopCardTitle>{loop.label}</LoopCardTitle>
                    {isNested && <LoopCardBadge>вложенный</LoopCardBadge>}
                  </LoopCardTopRow>
                  <LoopCardTag>
                    {'{' + loop.type + '}'} … {'{/' + loop.type + '}'}
                  </LoopCardTag>
                </LoopCard>
              );
            })}
          </LoopGrid>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Dot $color="#007D88" /> Шаблон ответа
            </CardTitle>
            <ContextChip $context={cursorContext}>
              {cursorContext.length === 0
                ? 'Курсор: вне циклов'
                : `Курсор: ${cursorContext.map(c => '{' + c + '}').join(' → ')}`}
            </ContextChip>
          </CardHeader>

          <EditorShell $hasIssues={issues.length > 0}>
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={e => onChange(e.target.value)}
              onSelect={handleSelect}
              onKeyUp={handleSelect}
              onClick={handleSelect}
              placeholder={`Привет, {client_fullname}!\n\n{foreachLoan}\nРассрочка {name} — остаток {total_amount}\n{/foreachLoan}`}
              disabled={disabled}
              spellCheck={false}
            />
            <EditorFooter>
              <span>{charCount} симв.</span>
              {issues.length > 0 ? (
                <FooterStatus $error>● {issues.length} ошибк{pluralize(issues.length)}</FooterStatus>
              ) : value.trim() ? (
                <FooterStatus>● шаблон валиден</FooterStatus>
              ) : (
                <FooterStatus $muted>● пусто</FooterStatus>
              )}
            </EditorFooter>
          </EditorShell>

          {issues.length > 0 && (
            <IssuesBox>
              {issues.map((issue, idx) => (
                <IssueItem key={idx}>
                  <IssueIcon>⚠</IssueIcon>
                  {issue.message}
                </IssueItem>
              ))}
            </IssuesBox>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Dot $color="#25D366" /> Предпросмотр сообщения
            </CardTitle>
            <CardHint>Данные подставлены для демонстрации</CardHint>
          </CardHeader>
          <PreviewStage>
            {preview ? (
              <PreviewBubble>{preview}</PreviewBubble>
            ) : (
              <PreviewEmpty>Здесь появится сообщение, которое получит клиент</PreviewEmpty>
            )}
          </PreviewStage>
        </Card>
      </EditorColumn>

      <VariablesColumn>
        <Card $sticky>
          <CardHeader>
            <CardTitle>
              <Dot $color="#007D88" /> Переменные
            </CardTitle>
          </CardHeader>
          <VarGroupsList>
            {BOT_VARIABLE_GROUPS.map(group => {
              const accent = SCOPE_ACCENTS[group.scope];
              const bg = SCOPE_BG[group.scope];
              const isAvailable =
                group.scope === 'global' ||
                cursorContext.includes(group.scope as LoopType);
              return (
                <VarGroup key={group.title} $dim={!isAvailable} $accent={accent}>
                  <VarGroupHeader>
                    <VarGroupTitle $accent={accent}>{group.title}</VarGroupTitle>
                    {!isAvailable && <VarGroupLock>не в контексте</VarGroupLock>}
                  </VarGroupHeader>
                  {group.description && <VarGroupHint>{group.description}</VarGroupHint>}
                  <VarGroupButtons>
                    {group.variables.map(v => (
                      <VarButton
                        key={v.key}
                        onClick={() => insertVariable(v.key)}
                        disabled={disabled}
                        $accent={accent}
                        $bg={bg}
                        title={`{${v.key}} → ${v.preview}`}
                      >
                        {v.label}
                      </VarButton>
                    ))}
                  </VarGroupButtons>
                </VarGroup>
              );
            })}
          </VarGroupsList>
        </Card>
      </VariablesColumn>
    </Layout>
  );
};

export default BotResponseConstructor;

function pluralize(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'а';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'и';
  return '';
}

function detectCursorContext(template: string, cursorPos: number): LoopType[] {
  const stack: LoopType[] = [];
  const tagRegex = /\{(\/?)(foreachLoan|foreachPaymentInLoan|foreachPayment|foreachSchedule)\}/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(template)) !== null) {
    const tagEnd = match.index + match[0].length;
    if (tagEnd > cursorPos) break;
    const isClose = match[1] === '/';
    const loop = match[2] as LoopType;
    if (!isClose) {
      stack.push(loop);
    } else if (stack[stack.length - 1] === loop) {
      stack.pop();
    }
  }

  return stack;
}

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const EditorColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;

const VariablesColumn = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Card = styled.section<{ $sticky?: boolean }>`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);

  ${props =>
    props.$sticky &&
    css`
      position: sticky;
      top: 8px;
      max-height: calc(90vh - 200px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `}
`;

const CardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const CardTitle = styled.h4`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const Dot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${p => p.$color};
  box-shadow: 0 0 0 3px ${p => p.$color}22;
`;

const CardHint = styled.span`
  font-size: 11px;
  color: #94a3b8;
  font-style: italic;
`;

const LoopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
`;

const LoopCard = styled.button<{ $accent: string; disabled?: boolean }>`
  background: white;
  border: 1px solid ${p => p.$accent}55;
  border-left: 4px solid ${p => p.$accent};
  border-radius: 10px;
  padding: 10px 12px;
  text-align: left;
  cursor: ${p => (p.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${p => (p.disabled ? 0.45 : 1)};
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 60px;
  overflow: hidden;

  &:hover:not(:disabled) {
    background: ${p => p.$accent}10;
    transform: translateY(-1px);
    box-shadow: 0 4px 10px ${p => p.$accent}25;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const LoopCardTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
`;

const LoopCardTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
  min-width: 0;
  flex: 1;
`;

const LoopCardTag = styled.code`
  font-size: 10.5px;
  color: #64748b;
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  word-break: break-all;
  line-height: 1.3;
`;

const LoopCardBadge = styled.span`
  flex-shrink: 0;
  font-size: 9px;
  color: #c2410c;
  background: rgba(194, 65, 12, 0.12);
  padding: 2px 6px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 600;
  white-space: nowrap;
  align-self: flex-start;
`;

const ContextChip = styled.span<{ $context: LoopType[] }>`
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  background: ${p => (p.$context.length === 0 ? '#f1f5f9' : '#fef3c7')};
  color: ${p => (p.$context.length === 0 ? '#64748b' : '#92400e')};
  border: 1px solid ${p => (p.$context.length === 0 ? '#e2e8f0' : '#fcd34d')};
`;

const EditorShell = styled.div<{ $hasIssues: boolean }>`
  border: 1px solid ${p => (p.$hasIssues ? '#fca5a5' : '#d1d5db')};
  border-radius: 10px;
  background: #fafbfc;
  overflow: hidden;
  transition: border-color 0.15s ease;

  &:focus-within {
    border-color: ${p => (p.$hasIssues ? '#ef4444' : '#007D88')};
    box-shadow: 0 0 0 3px ${p => (p.$hasIssues ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 125, 136, 0.12)')};
  }
`;

const Textarea = styled.textarea<{ disabled?: boolean }>`
  width: 100%;
  min-height: 260px;
  padding: 14px 16px;
  border: none;
  font-size: 13px;
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
  background: transparent;
  color: #0f172a;
  display: block;

  &:focus {
    outline: none;
  }

  &:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const EditorFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 14px;
  border-top: 1px solid #e5e7eb;
  font-size: 11px;
  color: #64748b;
  background: #f8fafc;
`;

const FooterStatus = styled.span<{ $error?: boolean; $muted?: boolean }>`
  font-weight: 500;
  color: ${p => (p.$error ? '#dc2626' : p.$muted ? '#94a3b8' : '#16a34a')};
`;

const IssuesBox = styled.div`
  margin-top: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 3px solid #ef4444;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const IssueItem = styled.div`
  font-size: 12px;
  color: #991b1b;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.4;
`;

const IssueIcon = styled.span`
  flex-shrink: 0;
  color: #f59e0b;
`;

const PreviewStage = styled.div`
  background: #ECE5DD;
  background-image:
    radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.04) 1px, transparent 0);
  background-size: 12px 12px;
  border-radius: 10px;
  padding: 16px 14px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
`;

const PreviewBubble = styled.div`
  background: #DCF8C6;
  color: #0f172a;
  padding: 10px 14px;
  border-radius: 12px;
  border-top-right-radius: 2px;
  max-width: 80%;
  align-self: flex-end;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
  font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
  position: relative;
`;

const PreviewEmpty = styled.div`
  color: #64748b;
  font-size: 13px;
  font-style: italic;
  text-align: center;
  padding: 24px 0;
  margin: auto;
`;

const VarGroupsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding-right: 4px;
  margin-right: -4px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
`;

const VarGroup = styled.div<{ $dim?: boolean; $accent: string }>`
  background: white;
  border: 1px solid #e5e7eb;
  border-left: 3px solid ${p => p.$accent};
  border-radius: 8px;
  padding: 10px 12px;
  opacity: ${p => (p.$dim ? 0.5 : 1)};
  transition: opacity 0.15s ease;
`;

const VarGroupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
`;

const VarGroupTitle = styled.div<{ $accent: string }>`
  font-size: 11.5px;
  font-weight: 700;
  color: ${p => p.$accent};
  letter-spacing: 0.2px;
`;

const VarGroupLock = styled.span`
  font-size: 9px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 600;
`;

const VarGroupHint = styled.div`
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 8px;
  line-height: 1.3;
`;

const VarGroupButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const VarButton = styled.button<{ disabled?: boolean; $accent: string; $bg: string }>`
  background: ${p => p.$bg};
  color: ${p => p.$accent};
  border: 1px solid ${p => p.$accent}33;
  padding: 3px 8px;
  border-radius: 5px;
  cursor: ${p => (p.disabled ? 'not-allowed' : 'pointer')};
  font-size: 11px;
  font-weight: 500;
  transition: all 0.12s ease;
  line-height: 1.4;

  &:hover:not(:disabled) {
    background: ${p => p.$accent};
    color: white;
    border-color: ${p => p.$accent};
    transform: translateY(-1px);
  }
`;
