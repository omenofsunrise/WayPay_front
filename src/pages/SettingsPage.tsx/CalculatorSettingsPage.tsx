import { useState } from 'react';
import styled from 'styled-components';
import PageLayout from '../../components/ui/Layouts/PageLayout';
import DarkCyanButton from '../../components/ui/Buttons/DarkCyanButton';
import CustomInput from '../../components/ui/fields/CustomInput';
import DefaultContainer from '../../components/ui/containers/defaultContainer';
import ModalInfoTitle from '../../components/ui/Text/ModalInfoTitle';
import {
  CALCULATION_MODE_OPTIONS,
  loadCalculatorSettings,
  saveCalculatorSettings,
  type CalculationMode,
  type CalculatorSettings,
} from '../../utils/calculatorSettings';

const CalculatorSettingsPage = () => {
  const [settings, setSettings] = useState<CalculatorSettings>(() => loadCalculatorSettings());
  const [isDirty, setIsDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const updateField = <K extends keyof CalculatorSettings>(key: K, value: CalculatorSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setJustSaved(false);
  };

  const handleSave = () => {
    saveCalculatorSettings(settings);
    setIsDirty(false);
    setJustSaved(true);
  };

  return (
    <PageLayout>
      <PageContainer>
        <DefaultContainer>
          <Header>
            <ModalInfoTitle>Настройки калькулятора</ModalInfoTitle>
            <SaveBlock>
              {justSaved && !isDirty && <SavedHint>✓ Сохранено</SavedHint>}
              <DarkCyanButton onClick={handleSave} disabled={!isDirty} style={{ minWidth: 120 }}>
                Сохранить
              </DarkCyanButton>
            </SaveBlock>
          </Header>

          <Hint>
            Эти параметры применяются к калькулятору в шапке. Схему расчёта в самом калькуляторе сменить нельзя — она берётся отсюда.
          </Hint>

          <Section>
            <SectionTitle>Схема расчёта</SectionTitle>
            <ModeOptions>
              {CALCULATION_MODE_OPTIONS.map(opt => (
                <ModeOption
                  key={opt.value}
                  type="button"
                  $selected={settings.mode === opt.value}
                  onClick={() => updateField('mode', opt.value as CalculationMode)}
                >
                  <ModeOptionTitle>{opt.label}</ModeOptionTitle>
                  <ModeOptionDescription>{opt.description}</ModeOptionDescription>
                </ModeOption>
              ))}
            </ModeOptions>
          </Section>

          <Section>
            <SectionTitle>Значения по умолчанию</SectionTitle>
            <FieldsGrid>
              <Field>
                <FieldLabel>Округлять до, ₽</FieldLabel>
                <CustomInput
                  value={settings.round}
                  onChange={e => updateField('round', e.target.value)}
                  inputType="number"
                  placeholder="Например: 50"
                />
                <FieldHint>Округление вверх для ежемесячного платежа и итоговой суммы</FieldHint>
              </Field>

              <Field>
                <FieldLabel>Надбавка по умолчанию, %</FieldLabel>
                <CustomInput
                  value={settings.defaultPercent}
                  onChange={e => updateField('defaultPercent', e.target.value)}
                  inputType="percents"
                  placeholder="Например: 20"
                />
                <FieldHint>Будет подставляться в поле «Надбавка» при открытии калькулятора</FieldHint>
              </Field>

              <Field>
                <FieldLabel>Срок по умолчанию, мес.</FieldLabel>
                <CustomInput
                  value={settings.defaultMonths}
                  onChange={e => updateField('defaultMonths', e.target.value)}
                  inputType="number"
                  placeholder="Например: 12"
                />
                <FieldHint>Будет подставляться в поле «Количество месяцев»</FieldHint>
              </Field>
            </FieldsGrid>
          </Section>
        </DefaultContainer>
      </PageContainer>
    </PageLayout>
  );
};

export default CalculatorSettingsPage;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  gap: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
`;

const SaveBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SavedHint = styled.span`
  font-size: 13px;
  color: #16a34a;
  font-weight: 500;
`;

const Hint = styled.div`
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  border-left: 3px solid #94a3b8;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 24px;
  line-height: 1.5;
`;

const Section = styled.section`
  margin-bottom: 28px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
`;

const ModeOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
`;

const ModeOption = styled.button<{ $selected: boolean }>`
  background: ${p => (p.$selected ? '#f0f9ff' : 'white')};
  border: 2px solid ${p => (p.$selected ? '#007D88' : '#e5e7eb')};
  border-radius: 10px;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.15s ease;

  &:hover {
    border-color: #007D88;
    transform: translateY(-1px);
  }
`;

const ModeOptionTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const ModeOptionDescription = styled.span`
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
`;

const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #333;
  text-align: left;
`;

const FieldHint = styled.span`
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.4;
`;
