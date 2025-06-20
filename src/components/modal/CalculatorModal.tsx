import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import CustomTitle from '../ui/Text/CustomTitle';
import TitleField from '../ui/Layouts/TitleLayout';
import ExportButton from '../ui/Buttons/ExportButton';
import { InputContainer } from '../Containers/InputComponents';
import CustomInput from '../ui/fields/CustomInput';
import CustomCalendar from '../ui/fields/CustomCalendar';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const formatMoney = (value: string): string => {
  const num = parseFloat(value.replace(/\D/g, '')) || 0;
  return num.toLocaleString('ru-RU');
};

const parseMoney = (value: string): number => {
  return parseFloat(value.replace(/\D/g, '')) || 0;
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
  onChange 
}) => {
  const [dateString, setDateString] = useState(
    selectedDate.toISOString().split('T')[0]
  );

  const handleDateChange = (newDateString: string) => {
    setDateString(newDateString);
    onChange(new Date(newDateString));
  };

  return (
    <CustomCalendar
      value={dateString}
      onChange={handleDateChange}
    />
  );
};

interface CalculatorModalProps {
  onClose: () => void;
}

const CalculatorModal = ({ onClose }: CalculatorModalProps) => {
  const [formData, setFormData] = useState({
    amount: '',
    months: '',
    initial: '',
    percent: '',
    round: '50',
    startDate: getNextMonthDate(),
  });

  const [displayAmount, setDisplayAmount] = useState('');
  const [displayInitial, setDisplayInitial] = useState('');

  const [results, setResults] = useState({
    monthlyPayment: '0',
    totalDebt: '0',
    overpayment: '0',
    totalAmount: '0',
    lastPaymentMonth: '',
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const generatePdf = async () => {
    return new Promise<Blob>(async (resolve, reject) => {
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.width = '800px';
      pdfContainer.style.padding = '20px';
      pdfContainer.style.fontFamily = 'Arial, sans-serif';
      pdfContainer.style.backgroundColor = 'rgba(249, 250, 250, 1)';
      document.body.appendChild(pdfContainer);

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
            Дата формирования: ${new Date().toLocaleDateString('ru-RU')}
          </p>
        </div>

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
              <p style="margin: 5px 0; color: #374151;"><strong>Сумма рассрочки:</strong> ${displayAmount || '0'} ₽</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Надбавка:</strong> ${formData.percent || '0'}%</p>
            </div>
            <div>
              <p style="margin: 5px 0; color: #374151;"><strong>Количество месяцев:</strong> ${formData.months || '0'}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Начало выплат:</strong> ${formData.startDate.toLocaleDateString('ru-RU')}</p>
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
              <span style="font-weight: 500; color: #111827;">${results.totalAmount} ₽</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
              <span style="color: #374151;">Взнос</span>
              <span style="font-weight: 500; color: #111827;">${displayInitial} ₽</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
              <span style="color: #374151;">Сумма долга</span>
              <span style="font-weight: 500; color: #111827;">${results.totalDebt} ₽</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
              <span style="color: #374151;">Ежемесячный платёж</span>
              <span style="font-weight: 500; color: #111827;">${results.monthlyPayment} ₽</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="color: #374151;">Последний месяц оплаты</span>
              <span style="font-weight: 500; color: #111827;">${results.lastPaymentMonth}</span>
            </div>
          </div>
          <div style="margin-top: 20px; width: 100%; height: 10px; position: relative; background: rgba(37, 203, 161, 1); border-radius: 5px; overflow: hidden;">
            <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${
              parseFloat(results.totalDebt.replace(/\s/g, '')) > 0 && parseFloat(results.overpayment.replace(/\s/g, '')) > 0
                ? (parseFloat(results.totalDebt.replace(/\s/g, '')) / 
                  (parseFloat(results.totalDebt.replace(/\s/g, '')) + parseFloat(results.overpayment.replace(/\s/g, ''))) * 100)
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
          windowHeight: pdfContainer.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; 
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        document.body.removeChild(pdfContainer);

        const pdfBlob = pdf.output('blob');
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
      
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = `Расчет_рассрочки_${new Date().toLocaleDateString('ru-RU')}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
    } catch (error) {
      console.error('Ошибка при создании PDF:', error);
      alert('Произошла ошибка при экспорте в PDF');
    }
  };

  const handleShareClick = async () => {
    try {
      const pdfBlob = await generatePdf();
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], `Расчет_рассрочки_${new Date().toLocaleDateString('ru-RU')}.pdf`, { type: 'application/pdf' })] })) {
        await navigator.share({
          title: `Расчёт рассрочки`,
          text: `Результаты расчёта рассрочки: Ежемесячный платёж ${results.monthlyPayment} ₽, Общая сумма ${results.totalAmount} ₽`,
          files: [new File([pdfBlob], `Расчет_рассрочки_${new Date().toLocaleDateString('ru-RU')}.pdf`, { type: 'application/pdf' })]
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Расчёт рассрочки`,
          text: `Результаты расчёта рассрочки: Ежемесячный платёж ${results.monthlyPayment} ₽, Общая сумма ${results.totalAmount} ₽`,
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(`Результаты расчёта рассрочки:\nЕжемесячный платёж: ${results.monthlyPayment} ₽\nОбщая сумма: ${results.totalAmount} ₽\nПоследний платёж: ${results.lastPaymentMonth}`);
          alert('Результаты скопированы в буфер обмена');
        } catch (err) {
          console.error('Не удалось скопировать в буфер обмена:', err);
          prompt('Скопируйте эту информацию:', `Результаты расчёта рассрочки:\nЕжемесячный платёж: ${results.monthlyPayment} ₽\nОбщая сумма: ${results.totalAmount} ₽\nПоследний платёж: ${results.lastPaymentMonth}`);
        }
      } else {
        prompt('Скопируйте эту информацию:', `Результаты расчёта рассрочки:\nЕжемесячный платёж: ${results.monthlyPayment} ₽\nОбщая сумма: ${results.totalAmount} ₽\nПоследний платёж: ${results.lastPaymentMonth}`);
      }
    } catch (error) {
      console.error('Ошибка при попытке поделиться:', error);
      
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(`Результаты расчёта рассрочки:\nЕжемесячный платёж: ${results.monthlyPayment} ₽\nОбщая сумма: ${results.totalAmount} ₽\nПоследний платёж: ${results.lastPaymentMonth}`);
          alert('Результаты скопированы в буфер обмена');
        } catch (err) {
          console.error('Не удалось скопировать в буфер обмена:', err);
          prompt('Скопируйте эту информацию:', `Результаты расчёта рассрочки:\nЕжемесячный платёж: ${results.monthlyPayment} ₽\nОбщая сумма: ${results.totalAmount} ₽\nПоследний платёж: ${results.lastPaymentMonth}`);
        }
      } else {
        prompt('Скопируйте эту информацию:', `Результаты расчёта рассрочки:\nЕжемесячный платёж: ${results.monthlyPayment} ₽\nОбщая сумма: ${results.totalAmount} ₽\nПоследний платёж: ${results.lastPaymentMonth}`);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      const numericValue = parseMoney(value);
      setDisplayAmount(formatMoney(numericValue.toString()));
      setFormData(prev => ({
        ...prev,
        [name]: numericValue.toString()
      }));
    } else if (name === 'initial') {
      const numericValue = parseMoney(value);
      setDisplayInitial(formatMoney(numericValue.toString()));
      setFormData(prev => ({
        ...prev,
        [name]: numericValue.toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value.replace(/\D/g, '')
      }));
    }
  };

  const handleDateChange = (dateString: string) => {
    const date = dateString ? new Date(dateString) : new Date();
    setFormData(prev => ({
      ...prev,
      startDate: date
    }));
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

      const totalAmount = amount * (1 + percent / 100);
      const roundedTotalAmount = roundUp(totalAmount, round);

      const overpayment = roundedTotalAmount - amount;
      const roundedOverpayment = roundUp(overpayment, round);

      const totalDebt = roundedTotalAmount - initial;
      const roundedTotalDebt = roundUp(totalDebt, round);

      const monthlyPayment = roundedTotalDebt / months;
      const roundedMonthlyPayment = roundUp(monthlyPayment, round);

      const lastPaymentDate = new Date(formData.startDate);
      lastPaymentDate.setMonth(lastPaymentDate.getMonth() + months - 1);
      const lastPaymentMonth = lastPaymentDate.toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric'
      });

      setResults({
        monthlyPayment: roundedMonthlyPayment.toLocaleString('ru-RU'),
        totalDebt: roundedTotalDebt.toLocaleString('ru-RU'),
        overpayment: roundedOverpayment.toLocaleString('ru-RU'),
        totalAmount: roundedTotalAmount.toLocaleString('ru-RU'),
        lastPaymentMonth,
      });
    };

    calculateResults();
  }, [formData]);

  return createPortal(
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <TitleField style={{ marginTop: 0, padding: "0 24px 0 24px" }}>
            <CustomTitle style={{ marginBottom: "0", marginLeft: 0 }}>Калькулятор</CustomTitle>
            <div style={{marginLeft: "auto" }}>
              <ExportButton 
                onClick={handleExportToPDF}
              />
              <ExportButton
                  children={"Поделиться"}
                  icon={<ShareIcon />}
                  onClick={handleShareClick}
              />
            </div>
        </TitleField>
        <ModalContent>
          <ColumnsContainer>
            <InputsColumn>
              <InputRow>
                <InputGroup>
                  <Label>Сумма рассрочки, ₽</Label>
                  <InputContainer>
                    <CustomInput 
                      name="amount" 
                      placeholder="Введите сумму" 
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
                      placeholder="Введите количество" 
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
                      placeholder="Введите сумму" 
                      value={displayInitial}
                      onChange={handleInputChange}
                      inputType="rubles"
                    />
                  </InputContainer>
                </InputGroup>
                <InputGroup>
                  <Label>Надбавка, %</Label>
                  <InputContainer>
                    <CustomInput 
                      name="percent" 
                      placeholder="Введите процент" 
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
                      onChange={(date) => setFormData(prev => ({
                        ...prev,
                        startDate: date
                      }))}
                    />
                  </InputContainer>
                </InputGroup>
                <InputGroup>
                  <Label>Округлять до, ₽</Label>
                  <InputContainer>
                    <CustomInput 
                      name="round" 
                      placeholder="Введите сумму" 
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
                    parseFloat(results.totalDebt.replace(/\s/g, '')) > 0 && parseFloat(results.overpayment.replace(/\s/g, '')) > 0
                      ? (parseFloat(results.totalDebt.replace(/\s/g, '')) / 
                        (parseFloat(results.totalDebt.replace(/\s/g, '')) + parseFloat(results.overpayment.replace(/\s/g, ''))) * 100)
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
  padding: 24px;
`;

const ColumnsContainer = styled.div`
  display: flex;
  gap: 42px;
`;

const InputsColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 25px;
  width: 800px;
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
  font-size: 14px;
  color: #333;
  font-weight: 500;
  text-align: left;
`;

const ShareIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.00001 2.50216C8.99998 1.91022 9.20982 1.33743 9.59224 0.885601C9.97466 0.43377 10.5049 0.132162 11.0887 0.0343785C11.6725 -0.0634049 12.2721 0.0489702 12.7809 0.351533C13.2896 0.654095 13.6747 1.12725 13.8675 1.6869C14.0604 2.24655 14.0485 2.85645 13.8341 3.4082C13.6197 3.95995 13.2167 4.41782 12.6965 4.70044C12.1764 4.98305 11.5729 5.0721 10.9934 4.95176C10.4138 4.83141 9.89563 4.50948 9.53101 4.04316L4.91502 6.35116C5.02912 6.77597 5.02912 7.22336 4.91502 7.64816L9.53302 9.95816C9.91574 9.47098 10.4657 9.14326 11.0764 9.03854C11.687 8.93382 12.3147 9.05956 12.8379 9.39139C13.3611 9.72321 13.7424 10.2375 13.908 10.8345C14.0736 11.4315 14.0116 12.0687 13.734 12.6226C13.4564 13.1765 12.9831 13.6076 12.4057 13.8323C11.8284 14.057 11.1882 14.0594 10.6092 13.8389C10.0302 13.6184 9.55374 13.1908 9.27213 12.6389C8.99051 12.0871 8.92383 11.4504 9.08502 10.8522L4.46702 8.54216C4.14602 8.95136 3.7054 9.25027 3.20652 9.39725C2.70765 9.54423 2.17535 9.53196 1.68377 9.36216C1.19219 9.19236 0.765807 8.87348 0.464002 8.44992C0.162198 8.02637 0 7.51924 0 6.99916C0 6.47908 0.162198 5.97195 0.464002 5.5484C0.765807 5.12485 1.19219 4.80596 1.68377 4.63616C2.17535 4.46636 2.70765 4.45409 3.20652 4.60107C3.7054 4.74805 4.14602 5.04696 4.46702 5.45616L9.08502 3.14916C9.02854 2.93813 8.99996 2.72062 9.00001 2.50216ZM11.502 1.00016C11.1038 1.00016 10.7219 1.15835 10.4403 1.43994C10.1587 1.72153 10.0005 2.10344 10.0005 2.50166C10.0005 2.89988 10.1587 3.2818 10.4403 3.56338C10.7219 3.84497 11.1038 4.00316 11.502 4.00316C11.9002 4.00316 12.2821 3.84497 12.5637 3.56338C12.8453 3.2818 13.0035 2.89988 13.0035 2.50166C13.0035 2.10344 12.8453 1.72153 12.5637 1.43994C12.2821 1.15835 11.9002 1.00016 11.502 1.00016ZM11.5 10.0002C11.1022 10.0002 10.7207 10.1582 10.4394 10.4395C10.1581 10.7208 10 11.1023 10 11.5002C10 11.898 10.1581 12.2795 10.4394 12.5608C10.7207 12.8421 11.1022 13.0002 11.5 13.0002C11.8978 13.0002 12.2794 12.8421 12.5607 12.5608C12.842 12.2795 13 11.898 13 11.5002C13 11.1023 12.842 10.7208 12.5607 10.4395C12.2794 10.1582 11.8978 10.0002 11.5 10.0002ZM1.00002 7.00016C1.00002 7.19714 1.03881 7.3922 1.1142 7.57419C1.18958 7.75617 1.30007 7.92153 1.43936 8.06082C1.57864 8.20011 1.744 8.3106 1.92599 8.38598C2.10798 8.46136 2.30303 8.50016 2.50002 8.50016C2.697 8.50016 2.89205 8.46136 3.07404 8.38598C3.25603 8.3106 3.42139 8.20011 3.56068 8.06082C3.69996 7.92153 3.81045 7.75617 3.88583 7.57419C3.96122 7.3922 4.00002 7.19714 4.00002 7.00016C4.00002 6.60234 3.84198 6.22081 3.56068 5.9395C3.27937 5.6582 2.89784 5.50016 2.50002 5.50016C2.10219 5.50016 1.72066 5.6582 1.43936 5.9395C1.15805 6.22081 1.00002 6.60234 1.00002 7.00016Z" fill="black"/>
    </svg>
);

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
  color: 'primary' | 'secondary';
}

const ColorSquare = styled.div<ColorSquareProps>`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background-color: ${props => 
    props.color === 'primary' 
      ? 'rgba(0, 125, 136, 1)' 
      : 'rgba(37, 203, 161, 1)'};
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
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => props.percentage}%;
    background: rgba(0, 125, 136, 1);
    border-radius: 5px 0 0 5px;
  }

  &::after {
    content: '';
    position: absolute;
    left: ${props => props.percentage}%;
    top: 0;
    width: 10px;
    height: 100%;
    background: 
      radial-gradient(circle at 0 50%, 
        rgba(0, 125, 136, 1) 0%, 
        rgba(0, 125, 136, 1) 49%, 
        rgba(37, 203, 161, 1) 50%, 
        rgba(37, 203, 161, 1) 100%);
    transform: translateX(-50%);
  }
`;

export default CalculatorModal;