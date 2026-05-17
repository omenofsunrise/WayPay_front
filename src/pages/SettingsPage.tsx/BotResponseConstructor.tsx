import { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
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

const TEXTAREA_ID = 'bot-response-template';

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

  const insertVariable = (key: string) => {
    insertAtCursor(`{${key}}`);
  };

  const insertLoop = (loop: BotLoop) => {
    const indent = '  ';
    const snippet = `{${loop.type}}\n${indent}\n{/${loop.type}}`;
    const cursorOffset = `{${loop.type}}\n${indent}`.length;
    insertAtCursor(snippet, cursorOffset);
  };

  const cursorContext = useMemo(() => detectCursorContext(value, cursorPos), [value, cursorPos]);
  const issues = useMemo(() => validateBotTemplate(value), [value]);
  const preview = useMemo(() => renderBotTemplate(value), [value]);

  return (
    <Layout>
      <EditorColumn>
        <SectionTitle>Шаблон ответа</SectionTitle>

        <LoopRow>
          {BOT_LOOPS.map(loop => {
            const isNested = loop.parent !== undefined;
            const canInsert = !isNested || cursorContext.includes(loop.parent!);
            return (
              <LoopButton
                key={loop.type}
                onClick={() => insertLoop(loop)}
                disabled={disabled || !canInsert}
                title={canInsert ? loop.description : `Можно вставить только внутри {${loop.parent}}`}
              >
                + {loop.label}
              </LoopButton>
            );
          })}
        </LoopRow>

        <TextareaWrapper>
          <Textarea
            id={TEXTAREA_ID}
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
        </TextareaWrapper>

        {issues.length > 0 && (
          <IssuesBox>
            {issues.map((issue, idx) => (
              <IssueItem key={idx}>⚠️ {issue.message}</IssueItem>
            ))}
          </IssuesBox>
        )}

        <SectionTitle>Предпросмотр</SectionTitle>
        <PreviewBox>
          {preview ? <PreviewText>{preview}</PreviewText> : <PreviewEmpty>— пусто —</PreviewEmpty>}
        </PreviewBox>
      </EditorColumn>

      <VariablesColumn>
        <SectionTitle>Переменные</SectionTitle>
        <HintText>
          Курсор сейчас{' '}
          {cursorContext.length === 0
            ? 'вне циклов — доступны только глобальные переменные'
            : `внутри: ${cursorContext.map(l => `{${l}}`).join(' → ')}`}
        </HintText>
        {BOT_VARIABLE_GROUPS.map(group => {
          const isAvailable =
            group.scope === 'global' || cursorContext.includes(group.scope as LoopType);
          return (
            <VarGroup key={group.title} $dim={!isAvailable}>
              <VarGroupTitle>{group.title}</VarGroupTitle>
              {group.description && <VarGroupHint>{group.description}</VarGroupHint>}
              <VarGroupButtons>
                {group.variables.map(v => (
                  <VarButton
                    key={v.key}
                    onClick={() => insertVariable(v.key)}
                    disabled={disabled}
                    title={`Вставить {${v.key}} — пример: ${v.preview}`}
                  >
                    {v.label}
                  </VarButton>
                ))}
              </VarGroupButtons>
            </VarGroup>
          );
        })}
      </VariablesColumn>
    </Layout>
  );
};

export default BotResponseConstructor;

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
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const EditorColumn = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const VariablesColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 4px;
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin: 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const LoopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
`;

const LoopButton = styled.button<{ disabled?: boolean }>`
  background: #fff7e6;
  color: #ad6800;
  border: 1px dashed #faad14;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${props => (props.disabled ? 0.4 : 1)};
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: #ffe7ba;
  }
`;

const TextareaWrapper = styled.div`
  margin-bottom: 12px;
`;

const Textarea = styled.textarea<{ disabled?: boolean }>`
  width: 100%;
  min-height: 240px;
  padding: 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  line-height: 1.55;
  resize: vertical;
  box-sizing: border-box;
  background: white;
  color: #1f2937;

  &:focus {
    outline: none;
    border-color: #007d88;
    box-shadow: 0 0 0 3px rgba(0, 125, 136, 0.1);
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const IssuesBox = styled.div`
  background: #fff1f0;
  border: 1px solid #ffa39e;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
`;

const IssueItem = styled.div`
  font-size: 12px;
  color: #a8071a;
  padding: 2px 0;
`;

const PreviewBox = styled.div`
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px;
  min-height: 100px;
  max-height: 260px;
  overflow-y: auto;
`;

const PreviewText = styled.div`
  font-size: 13px;
  color: #1f2937;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
`;

const PreviewEmpty = styled.div`
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
`;

const HintText = styled.div`
  font-size: 11px;
  color: #6b7280;
  background: #f0f9ff;
  border: 1px solid #bae0ff;
  border-radius: 6px;
  padding: 6px 10px;
  line-height: 1.4;
`;

const VarGroup = styled.div<{ $dim?: boolean }>`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
  opacity: ${props => (props.$dim ? 0.55 : 1)};
  transition: opacity 0.15s ease;
`;

const VarGroupTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #007d88;
  margin-bottom: 4px;
`;

const VarGroupHint = styled.div`
  font-size: 10px;
  color: #9ca3af;
  margin-bottom: 8px;
  font-style: italic;
`;

const VarGroupButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const VarButton = styled.button<{ disabled?: boolean }>`
  background: rgba(0, 125, 136, 0.08);
  color: #007d88;
  border: 1px solid rgba(0, 125, 136, 0.25);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  font-size: 11px;
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 125, 136, 0.18);
  }
`;
