import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import TitleField from "../ui/Layouts/TitleLayout";
import ExportButton from "../ui/Buttons/ExportButton";
import { InputContainer } from "../Containers/InputComponents";
import CustomInput from "../ui/fields/CustomInput";
import CustomCalendar from "../ui/fields/CustomCalendar";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  loadCalculatorSettings,
  saveCalculatorSettings,
  getCalculationModeLabel,
  CALCULATION_MODE_OPTIONS,
  type CalculationMode,
} from "../../utils/calculatorSettings";
import {
  loadCalculatorTemplates,
  saveCalculatorTemplates,
  createTemplateId,
  type CalculatorTemplate,
} from "../../utils/calculatorTemplates";

const formatMoney = (value: string): string => {
  const num = parseFloat(value.replace(/\D/g, "")) || 0;
  return num.toLocaleString("ru-RU");
};

const parseMoney = (value: string): number => {
  return parseFloat(value.replace(/\D/g, "")) || 0;
};

const getNextMonthDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

interface CustomCalendarWrapperProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

const CustomCalendarWrapper: React.FC<CustomCalendarWrapperProps> = ({
  selectedDate,
  onChange,
}) => {
  const [dateString, setDateString] = useState(
    selectedDate.toISOString().split("T")[0]
  );

  const handleDateChange = (newDateString: string) => {
    setDateString(newDateString);
    onChange(new Date(newDateString));
  };

  return <CustomCalendar value={dateString} onChange={handleDateChange} />;
};

interface CalculatorModalProps {
  onClose: () => void;
}

const CalculatorModal = ({ onClose }: CalculatorModalProps) => {
  const [settings, setSettings] = useState(() => loadCalculatorSettings());
  const [selectedMode, setSelectedMode] = useState<CalculationMode>(
    settings.mode
  );

  // Переключение модели расчёта прямо в калькуляторе (с запоминанием выбора).
  const handleSelectMode = (mode: CalculationMode) => {
    setSelectedMode(mode);
    setSettings((prev) => {
      const next = { ...prev, mode };
      saveCalculatorSettings(next);
      return next;
    });
  };
  const [formData, setFormData] = useState({
    amount: "",
    months: settings.defaultMonths,
    initial: "",
    percent: settings.defaultPercent,
    round: settings.round || "50",
    startDate: getNextMonthDate(),
  });

  const [displayAmount, setDisplayAmount] = useState("");
  const [displayInitial, setDisplayInitial] = useState("");

  const [templates, setTemplates] = useState<CalculatorTemplate[]>(() =>
    loadCalculatorTemplates()
  );
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  const persistTemplates = (next: CalculatorTemplate[]) => {
    setTemplates(next);
    saveCalculatorTemplates(next);
  };

  const handleApplyTemplate = (template: CalculatorTemplate) => {
    setFormData((prev) => ({
      ...prev,
      amount: template.amount,
      months: template.months,
      initial: template.initial,
      percent: template.percent,
      round: template.round,
      startDate: template.startDate
        ? new Date(template.startDate)
        : prev.startDate,
    }));
    setDisplayAmount(template.amount ? formatMoney(template.amount) : "");
    setDisplayInitial(template.initial ? formatMoney(template.initial) : "");
  };

  const handleStartSavingTemplate = () => {
    setNewTemplateName("");
    setIsSavingTemplate(true);
  };

  const handleCancelSavingTemplate = () => {
    setIsSavingTemplate(false);
    setNewTemplateName("");
  };

  const handleConfirmSaveTemplate = () => {
    const name = newTemplateName.trim();
    if (!name) return;

    const template: CalculatorTemplate = {
      id: createTemplateId(),
      name,
      amount: formData.amount,
      months: formData.months,
      initial: formData.initial,
      percent: formData.percent,
      round: formData.round,
      startDate: formData.startDate.toISOString(),
    };

    persistTemplates([...templates, template]);
    setIsSavingTemplate(false);
    setNewTemplateName("");
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    if (!window.confirm(`Удалить шаблон "${name}"?`)) return;
    persistTemplates(templates.filter((t) => t.id !== id));
  };

  const [results, setResults] = useState({
    monthlyPayment: "0",
    totalDebt: "0",
    overpayment: "0",
    totalAmount: "0",
    lastPaymentMonth: "",
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const generatePdf = async () => {
    return new Promise<Blob>(async (resolve, reject) => {
      const pdfContainer = document.createElement("div");
      pdfContainer.style.position = "absolute";
      pdfContainer.style.left = "-9999px";
      pdfContainer.style.width = "800px";
      pdfContainer.style.padding = "20px";
      pdfContainer.style.fontFamily = "Arial, sans-serif";
      pdfContainer.style.backgroundColor = "rgba(249, 250, 250, 1)";
      document.body.appendChild(pdfContainer);

      // Расчет дополнительной информации для режима month-percent
      const amount = parseFloat(formData.amount) || 0;
      const months = parseFloat(formData.months) || 1;
      const percent = parseFloat(formData.percent) || 0;

      let additionalInfoHtml = "";

      if (selectedMode === "month-percent") {
        const monthlyOverpayment = amount * (percent / 100);
        const totalOverpayment = monthlyOverpayment * months;

        additionalInfoHtml = `
        <div style="
          margin-bottom: 20px;
          background: rgba(255, 255, 255, 1);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        ">
          <h2 style="
            color: rgba(0, 125, 136, 1);
            font-size: 18px;
            margin-top: 0;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
          ">
            <span style="
              display: inline-block;
              width: 4px;
              height: 20px;
              background: rgba(37, 203, 161, 1);
              margin-right: 10px;
              border-radius: 2px;
            "></span>
            Детали расчёта (Процент за 1 месяц)
          </h2>
          <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
              <span style="color: #374151;">Надбавка за 1 месяц</span>
              <span style="font-weight: 500; color: #111827;">${monthlyOverpayment.toLocaleString(
                "ru-RU"
              )} ₽</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="color: #374151;">Надбавка за ${months} месяцев</span>
              <span style="font-weight: 500; color: #111827;">${totalOverpayment.toLocaleString(
                "ru-RU"
              )} ₽</span>
            </div>
          </div>
        </div>
      `;
      }

      pdfContainer.innerHTML = `
      <div style="
        margin-bottom: 30px;
        background: rgba(255, 255, 255, 1);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      ">
        <h1 style="
          color: rgba(0, 125, 136, 1);
          font-size: 24px;
          margin-bottom: 5px;
          border-bottom: 2px solid rgba(37, 203, 161, 1);
          padding-bottom: 10px;
        ">
          Расчёт рассрочки
        </h1>
        <p style="
          color: #6B7280;
          font-size: 14px;
          margin: 0;
        ">
          Дата формирования: ${new Date().toLocaleDateString("ru-RU")}
        </p>
        <p style="
          color: #6B7280;
          font-size: 14px;
          margin: 10px 0 0 0;
        ">
          ${getCalculationModeLabel(selectedMode)}
        </p>
      </div>

      ${additionalInfoHtml}

      <div style="
        margin-bottom: 30px;
        background: rgba(255, 255, 255, 1);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      ">
        <h2 style="
          color: rgba(0, 125, 136, 1);
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        ">
          <span style="
            display: inline-block;
            width: 4px;
            height: 20px;
            background: rgba(37, 203, 161, 1);
            margin-right: 10px;
            border-radius: 2px;
          "></span>
          Входные данные
        </h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <p style="margin: 5px 0; color: #374151;"><strong>Сумма рассрочки:</strong> ${
              displayAmount || "0"
            } ₽</p>
            <p style="margin: 5px 0; color: #374151;"><strong>${
              selectedMode === "month-percent"
                ? "Процент за 1 месяц:"
                : "Надбавка:"
            }</strong> ${formData.percent || "0"}%</p>
          </div>
          <div>
            <p style="margin: 5px 0; color: #374151;"><strong>Количество месяцев:</strong> ${
              formData.months || "0"
            }</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Начало выплат:</strong> ${formData.startDate.toLocaleDateString(
              "ru-RU"
            )}</p>
          </div>
        </div>
      </div>

      <div style="
        background: rgba(255, 255, 255, 1);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        margin-bottom: 30px;
      ">
        <h2 style="
          color: rgba(0, 125, 136, 1);
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
        ">
          <span style="
            display: inline-block;
            width: 4px;
            height: 20px;
            background: rgba(37, 203, 161, 1);
            margin-right: 10px;
            border-radius: 2px;
          "></span>
          Результаты расчёта
        </h2>
        <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
            <span style="color: #374151;">Общая стоимость</span>
            <span style="font-weight: 500; color: #111827;">${
              results.totalAmount
            } ₽</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
            <span style="color: #374151;">Взнос</span>
            <span style="font-weight: 500; color: #111827;">${displayInitial} ₽</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
            <span style="color: #374151;">Сумма долга</span>
            <span style="font-weight: 500; color: ' #111827;">${
              results.totalDebt
            } ₽</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
            <span style="color: #374151;">Ежемесячный платёж</span>
            <span style="font-weight: 500; color: #111827;">${
              results.monthlyPayment
            } ₽</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="color: #374151;">Последний месяц оплаты</span>
            <span style="font-weight: 500; color: #111827;">${
              results.lastPaymentMonth
            }</span>
          </div>
        </div>
        <div style="margin-top: 20px; width: 100%; height: 10px; position: relative; background: rgba(37, 203, 161, 1); border-radius: 5px; overflow: hidden;">
          <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${
            parseFloat(results.totalDebt.replace(/\s/g, "")) > 0 &&
            parseFloat(results.overpayment.replace(/\s/g, "")) > 0
              ? (parseFloat(results.totalDebt.replace(/\s/g, "")) /
                  (parseFloat(results.totalDebt.replace(/\s/g, "")) +
                    parseFloat(results.overpayment.replace(/\s/g, "")))) *
                100
              : 50
          }%; background: rgba(0, 125, 136, 1); border-radius: 5px 0 0 5px;"></div>
        </div>
      </div>

      <div style="
        padding: 15px;
        text-align: center;
        color: #6B7280;
        font-size: 12px;
        background: rgba(255, 255, 255, 1);
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      ">
        <p>© ${new Date().getFullYear()} WayPay. Все права защищены.</p>
      </div>
    `;

      try {
        const canvas = await html2canvas(pdfContainer, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: pdfContainer.offsetWidth,
          height: pdfContainer.scrollHeight,
          windowWidth: pdfContainer.scrollWidth,
          windowHeight: pdfContainer.scrollHeight,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.85);
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        document.body.removeChild(pdfContainer);

        const pdfBlob = pdf.output("blob");
        resolve(pdfBlob);
      } catch (error) {
        document.body.removeChild(pdfContainer);
        reject(error);
      }
    });
  };

  const handleExportToPDF = async () => {
    try {
      const pdfBlob = await generatePdf();
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const downloadLink = document.createElement("a");
      downloadLink.href = pdfUrl;
      downloadLink.download = `Расчет_рассрочки_${new Date().toLocaleDateString(
        "ru-RU"
      )}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
    } catch (error) {
      console.error("Ошибка при создании PDF:", error);
      alert("Произошла ошибка при экспорте в PDF");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "amount") {
      const numericValue = parseMoney(value);
      setDisplayAmount(formatMoney(numericValue.toString()));
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue.toString(),
      }));
    } else if (name === "initial") {
      const numericValue = parseMoney(value);
      setDisplayInitial(formatMoney(numericValue.toString()));
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue.toString(),
      }));
    } else if (name === "percent") {
      const decimalValue = value.replace(/[^0-9.,]/g, "").replace(",", ".");
      const parts = decimalValue.split(".");
      if (parts.length > 1 && parts[1].length > 2) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        [name]: decimalValue,
      }));
    } else if (name === "round") {
      const numericValue = value.replace(/\D/g, "");
      setFormData((prev) => ({
        ...prev,
        round: numericValue,
      }));
      setSettings((prev) => {
        const next = { ...prev, round: numericValue };
        saveCalculatorSettings(next);
        return next;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, ""),
      }));
    }
  };

  const roundUp = (value: number, increment: number) => {
    return Math.ceil(value / increment) * increment;
  };

  useEffect(() => {
    const calculateResults = () => {
      const amount = parseFloat(formData.amount) || 0;
      const months = parseFloat(formData.months) || 1;
      const initial = parseFloat(formData.initial) || 0;
      const percent = parseFloat(formData.percent) || 0;
      const round = parseFloat(formData.round) || 50;

      let totalAmount = 0;
      let overpayment = 0;

      // Расчет в зависимости от выбранного режима
      switch (selectedMode) {
        case "standard":
          // Стандартный режим: надбавка на всю сумму
          totalAmount = amount * (1 + percent / 100);
          overpayment = totalAmount - amount;
          break;

        case "after-initial":
          // Надбавка после вычета первоначального взноса
          const amountAfterInitial = amount - initial;
          totalAmount = initial + amountAfterInitial * (1 + percent / 100);
          overpayment = totalAmount - amount;
          break;

        case "month-percent":
          // Процент за 1 месяц (умножается на количество месяцев)
          const totalPercent = percent * months;
          totalAmount = amount * (1 + totalPercent / 100);
          overpayment = totalAmount - amount;
          break;

        default:
          totalAmount = amount * (1 + percent / 100);
          overpayment = totalAmount - amount;
      }

      const roundedTotalAmount = roundUp(totalAmount, round);
      const roundedOverpayment = roundUp(overpayment, round);
      const totalDebt = roundedTotalAmount - initial;
      const roundedTotalDebt = roundUp(totalDebt, round);
      const monthlyPayment = roundedTotalDebt / months;
      const roundedMonthlyPayment = roundUp(monthlyPayment, round);

      const lastPaymentDate = new Date(formData.startDate);
      lastPaymentDate.setMonth(lastPaymentDate.getMonth() + months - 1);
      const lastPaymentMonth = lastPaymentDate.toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric",
      });

      setResults({
        monthlyPayment: roundedMonthlyPayment.toLocaleString("ru-RU"),
        totalDebt: roundedTotalDebt.toLocaleString("ru-RU"),
        overpayment: roundedOverpayment.toLocaleString("ru-RU"),
        totalAmount: roundedTotalAmount.toLocaleString("ru-RU"),
        lastPaymentMonth,
      });
    };

    calculateResults();
  }, [formData, selectedMode]);

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
  };

  return createPortal(
    <ModalOverlay>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CancelButton onClick={handleCancel} />
        <TitleField style={{ marginTop: 0, padding: "0 24px 0 24px", gap: 16 }}>
          <TemplatesBar>
            <TemplatesLabel>Шаблоны:</TemplatesLabel>
            <TemplatesChips>
              {templates.map((template) => (
                <TemplateChip
                  key={template.id}
                  type="button"
                  onClick={() => handleApplyTemplate(template)}
                  title={`Применить шаблон "${template.name}"`}
                >
                  <span>{template.name}</span>
                  <TemplateDeleteButton
                    role="button"
                    aria-label={`Удалить шаблон ${template.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(template.id, template.name);
                    }}
                  >
                    ×
                  </TemplateDeleteButton>
                </TemplateChip>
              ))}

              {isSavingTemplate ? (
                <TemplateSaveForm
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleConfirmSaveTemplate();
                  }}
                >
                  <TemplateNameInput
                    autoFocus
                    placeholder="Название (напр. Авто)"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        handleCancelSavingTemplate();
                      }
                    }}
                    maxLength={40}
                  />
                  <TemplateActionButton
                    type="submit"
                    $variant="primary"
                    disabled={!newTemplateName.trim()}
                  >
                    Сохранить
                  </TemplateActionButton>
                  <TemplateActionButton
                    type="button"
                    $variant="ghost"
                    onClick={handleCancelSavingTemplate}
                  >
                    Отмена
                  </TemplateActionButton>
                </TemplateSaveForm>
              ) : (
                <TemplateAddButton
                  type="button"
                  onClick={handleStartSavingTemplate}
                >
                  + Сохранить шаблон
                </TemplateAddButton>
              )}
            </TemplatesChips>
          </TemplatesBar>
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            <ExportButton onClick={handleExportToPDF} />
          </div>
        </TitleField>
        <ModalContent>
          <ModeSwitcher>
            {CALCULATION_MODE_OPTIONS.map((option) => (
              <ModeCard
                key={option.value}
                type="button"
                $active={selectedMode === option.value}
                onClick={() => handleSelectMode(option.value)}
                title={option.description}
              >
                <ModeCardLabel>{option.label}</ModeCardLabel>
                <ModeCardDescription>{option.description}</ModeCardDescription>
              </ModeCard>
            ))}
          </ModeSwitcher>

          <ColumnsContainer>
            <InputsColumn>
              <InputRow>
                <InputGroup>
                  <Label>Сумма рассрочки, ₽</Label>
                  <InputContainer>
                    <CustomInput
                      name="amount"
                      value={displayAmount}
                      onChange={handleInputChange}
                      inputType="rubles"
                    />
                  </InputContainer>
                </InputGroup>
                <InputGroup>
                  <Label>Количество месяцев</Label>
                  <InputContainer>
                    <CustomInput
                      name="months"
                      value={formData.months}
                      onChange={handleInputChange}
                    />
                  </InputContainer>
                </InputGroup>
              </InputRow>

              <InputRow>
                <InputGroup>
                  <Label>Первоначальный взнос, ₽</Label>
                  <InputContainer>
                    <CustomInput
                      name="initial"
                      value={displayInitial}
                      onChange={handleInputChange}
                      inputType="rubles"
                    />
                  </InputContainer>
                </InputGroup>
                <InputGroup>
                  <Label>
                    {selectedMode === "month-percent"
                      ? "Процент за 1 месяц, %"
                      : "Надбавка, %"}
                  </Label>
                  <InputContainer>
                    <CustomInput
                      name="percent"
                      value={formData.percent}
                      onChange={handleInputChange}
                    />
                  </InputContainer>
                </InputGroup>
              </InputRow>

              <InputRow>
                <InputGroup>
                  <Label>Начало выплат</Label>
                  <InputContainer>
                    <CustomCalendarWrapper
                      selectedDate={formData.startDate}
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          startDate: date,
                        }))
                      }
                    />
                  </InputContainer>
                </InputGroup>
                <InputGroup>
                  <Label>Округлять до, ₽</Label>
                  <InputContainer>
                    <CustomInput
                      name="round"
                      value={formData.round}
                      onChange={handleInputChange}
                    />
                  </InputContainer>
                </InputGroup>
              </InputRow>
            </InputsColumn>

            <ResultsColumn>
              <ResultsContainer>
                <ResultTitle>Результаты рассчёта</ResultTitle>
                <ResultRow>
                  <ResultLabel>Ежемесячный платёж</ResultLabel>
                  <Value>{results.monthlyPayment} ₽</Value>
                </ResultRow>
                <ResultRow>
                  <ColorSquare color="primary" />
                  <ResultLabel>Сумма долга</ResultLabel>
                  <Value>{results.totalDebt} ₽</Value>
                </ResultRow>
                <ResultRow>
                  <ColorSquare color="secondary" />
                  <ResultLabel>Переплата</ResultLabel>
                  <Value>{results.overpayment} ₽</Value>
                </ResultRow>
                <ResultRow>
                  <ResultLabel>Общая сумма</ResultLabel>
                  <Value>{results.totalAmount} ₽</Value>
                </ResultRow>
                <ResultRow>
                  <ResultLabel>Последний месяц оплаты</ResultLabel>
                  <Value>{results.lastPaymentMonth}</Value>
                </ResultRow>
                <RatioBar
                  percentage={
                    parseFloat(results.totalDebt.replace(/\s/g, "")) > 0 &&
                    parseFloat(results.overpayment.replace(/\s/g, "")) > 0
                      ? (parseFloat(results.totalDebt.replace(/\s/g, "")) /
                          (parseFloat(results.totalDebt.replace(/\s/g, "")) +
                            parseFloat(
                              results.overpayment.replace(/\s/g, "")
                            ))) *
                        100
                      : 50
                  }
                />
              </ResultsContainer>
            </ResultsColumn>
          </ColumnsContainer>
        </ModalContent>
      </ModalContainer>
    </ModalOverlay>,
    document.body
  );
};

const CancelButton = styled.button`
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0;
  z-index: 10;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 24px;
    height: 2px;
    background-color: black;
    border-radius: 1px;
  }

  &::before {
    transform: translate(-50%, -50%) rotate(45deg);
  }

  &::after {
    transform: translate(-50%, -50%) rotate(-45deg);
  }

  &:hover::before,
  &:hover::after {
    background-color: rgba(0, 0, 0, 0.7);
  }

  &:active::before,
  &:active::after {
    background-color: rgba(0, 0, 0, 0.5);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  position: relative;
  background-color: white;
  border-radius: 8px;
  width: auto;
  max-width: 90%;
  min-width: 800px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  &.modal-container-for-export {
    padding: 30px;
    background: #ffffff;
    width: 800px;
    box-shadow: none;
  }
`;

const ModalContent = styled.div`
  padding: 16px 24px 20px;
`;

const ModeSwitcher = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModeCard = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 0;
  min-width: 0;
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$active ? "#0f766e" : "#e5e7eb")};
  background: ${(p) => (p.$active ? "#f0fdfa" : "#ffffff")};
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: #0f766e;
  }
`;

const ModeCardLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ModeCardDescription = styled.span`
  font-size: 12px;
  line-height: 1.35;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ColumnsContainer = styled.div`
  display: flex;
  gap: 20px;
`;

const TemplatesBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const TemplatesLabel = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: rgba(80, 85, 92, 1);
  flex-shrink: 0;
`;

const TemplatesChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const TemplateChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 11px;
  background-color: rgba(0, 125, 136, 0.08);
  color: rgba(0, 125, 136, 1);
  border: 1px solid rgba(0, 125, 136, 0.25);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;

  &:hover {
    background-color: rgba(0, 125, 136, 0.16);
    border-color: rgba(0, 125, 136, 0.4);
  }
`;

const TemplateDeleteButton = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 15px;
  line-height: 1;
  color: rgba(0, 125, 136, 0.7);

  &:hover {
    background-color: rgba(0, 125, 136, 0.2);
    color: rgba(0, 125, 136, 1);
  }
`;

const TemplateAddButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 4px 11px;
  background-color: transparent;
  color: rgba(0, 125, 136, 1);
  border: 1px dashed rgba(0, 125, 136, 0.5);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: rgba(0, 125, 136, 0.08);
  }
`;

const TemplateSaveForm = styled.form`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const TemplateNameInput = styled.input`
  padding: 6px 12px;
  font-size: 18px;
  border: 1px solid rgba(0, 125, 136, 0.5);
  border-radius: 999px;
  outline: none;
  min-width: 200px;

  &:focus {
    border-color: rgba(0, 125, 136, 1);
    box-shadow: 0 0 0 2px rgba(0, 125, 136, 0.12);
  }
`;

const TemplateActionButton = styled.button<{ $variant: "primary" | "ghost" }>`
  padding: 6px 14px;
  font-size: 18px;
  font-weight: 500;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.15s ease;

  ${({ $variant }) =>
    $variant === "primary" &&
    `
    background-color: rgba(0, 125, 136, 1);
    color: #fff;
    border: 1px solid rgba(0, 125, 136, 1);

    &:hover { background-color: rgba(0, 105, 115, 1); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  `}

  ${({ $variant }) =>
    $variant === "ghost" &&
    `
    background-color: transparent;
    color: rgba(80, 85, 92, 1);
    border: 1px solid rgba(209, 213, 219, 1);

    &:hover { background-color: rgba(0, 0, 0, 0.04); }
  `}
`;

const InputsColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 800px;

  /* Единый вид всех полей: высоту не фиксируем жёстко, иначе поле даты
     (обёртка CustomCalendar с собственным padding) расходится по высоте
     с текстовыми CustomInput. Оставляем только размер шрифта. */
  & input {
    font-size: 13px;
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: 32px;
`;

const InputGroup = styled.div`
  flex: 1;
`;

const ResultsColumn = styled.div`
  flex: 0.6;
`;

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 5px 5px 25px 2px rgba(0, 0, 0, 0.25);
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  padding: 30px;
  max-height: 320px;
  gap: 15px;
`;

const Label = styled.label`
  font-size: 13px;
  color: #333;
  font-weight: 500;
  text-align: left;
`;

const ResultTitle = styled.h3`
  margin: 0 auto auto 0;
  padding: 0;
  color: black;
  text-align: left;
  font-size: 18px;
  font-weight: 600;
`;

const ResultLabel = styled.p`
  margin: 0;
  color: rgba(80, 85, 92, 1);
  text-align: left;
  margin-right: auto;
`;

const ResultRow = styled.div`
  margin: 0;
  display: flex;
  width: 100%;
  align-items: center;
  margin: 0px 0;
`;

const Value = styled.p`
  margin: 0;
  margin-left: auto;
  color: black;
`;

interface ColorSquareProps {
  color: "primary" | "secondary";
}

const ColorSquare = styled.div<ColorSquareProps>`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background-color: ${(props) =>
    props.color === "primary"
      ? "rgba(0, 125, 136, 1)"
      : "rgba(37, 203, 161, 1)"};
  margin-right: 10px;
`;

interface RatioBarProps {
  percentage: number;
}

const RatioBar = styled.div<RatioBarProps>`
  width: 100%;
  height: 10px;
  position: relative;
  background: rgba(37, 203, 161, 1);
  border-radius: 5px;
  overflow: hidden;
  margin-top: 10px;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${(props) => props.percentage}%;
    background: rgba(0, 125, 136, 1);
    border-radius: 5px 0 0 5px;
  }

  &::after {
    content: "";
    position: absolute;
    left: ${(props) => props.percentage}%;
    top: 0;
    width: 10px;
    height: 100%;
    background: radial-gradient(
      circle at 0 50%,
      rgba(0, 125, 136, 1) 0%,
      rgba(0, 125, 136, 1) 49%,
      rgba(37, 203, 161, 1) 50%,
      rgba(37, 203, 161, 1) 100%
    );
    transform: translateX(-50%);
  }
`;

export default CalculatorModal;
