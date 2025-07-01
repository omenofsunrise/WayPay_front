import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import { formatDate } from './dateFormatter';
import { formatMoney } from './formatPrice';

interface ClientData {
  fullName: string;
  birthDate: string;
  passportSeries: string;
  passportNumber: string;
  passportIssuedBy: string;
  passportIssueDate: string;
  passportDepartmentCode: string;
  address: string;
  phone: string;
}

interface SellerData {
  fullName: string;
  ogrnip: string;
  inn: string;
  address: string;
  bankAccount: string;
  bankName: string;
  bankCorrAccount: string;
  bankInn: string;
  bankBik: string;
  email: string;
}

interface ProductData {
  name: string;
  fullCost: number;
  baseCost: number;
  markup: number;
  initialPayment: number;
  remainingPayment: number;
  termMonths: number;
  finalPaymentDate: string;
}

export interface ContractData {
  contractNumber: string;
  contractDate: string;
  client: ClientData;
  seller: SellerData;
  product: ProductData;
  guarantor?: {
    fullName: string;
    relation: string;
  };
}

export async function generateSalesContractDocx(data: ContractData): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Заголовок договора
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `ДОГОВОР № ${data.contractNumber}`,
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'купли – продажи товара с рассрочкой платежа',
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: `г. Грозный\t\t\t\t\t\t\t${formatDate(data.contractDate)} г.`,
                size: 22,
              }),
            ],
          }),

          // Преамбула
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `${data.client.fullName}, ${formatDate(data.client.birthDate)} года рождения, паспорт ${data.client.passportSeries} № ${data.client.passportNumber} выдан ${data.client.passportIssuedBy} ${formatDate(data.client.passportIssueDate)} г., код подразделения ${data.client.passportDepartmentCode}, проживающий по адресу: ${data.client.address} (далее - Покупатель) действующий как физическое лицо, с одной стороны и `,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `Индивидуальный предприниматель ${data.seller.fullName}, ОГРНИП ${data.seller.ogrnip} (далее - Продавец), с другой стороны, в дальнейшем при совместном упоминании именуемые Стороны, а по отдельности – Сторона, заключили настоящий договор (далее – Договор) о нижеследующем:`,
              }),
            ],
          }),

          // Раздел 1. ПРЕДМЕТ ДОГОВОРА
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: '1. ПРЕДМЕТ ДОГОВОРА',
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            numbering: {
              level: 0,
              reference: "1",
            },
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: `Продавец обязуется передать Покупателю в собственность товар: ${data.product.name}, а Покупатель обязуется принять и оплатить Товар.`,
              }),
            ],
          }),
          new Paragraph({
            numbering: {
              level: 0,
              reference: "1",
            },
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: `Покупатель приобретает в собственность Товар на условиях рассрочки платежа сроком на ${data.product.termMonths} (${numberToWords(data.product.termMonths)}) календарных месяца с конечным сроком полной оплаты не позднее ${formatDate(data.product.finalPaymentDate)} г. и в соответствии с Графиком погашения задолженности, отраженной в настоящем договоре.`,
              }),
            ],
          }),
          // ... остальные пункты раздела 1

          // Раздел 2. ПРАВА И ОБЯЗАННОСТИ СТОРОН
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: '2. ПРАВА И ОБЯЗАННОСТИ СТОРОН',
                bold: true,
              }),
            ],
          }),
          // ... пункты раздела 2

          // Раздел 3. ЦЕНА ТОВАРА И ПОРЯДОК РАСЧЕТОВ
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: '3. ЦЕНА ТОВАРА И ПОРЯДОК РАСЧЕТОВ',
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            numbering: {
              level: 0,
              reference: "3",
            },
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: `Полная стоимость Товара составляет ${formatMoney(data.product.fullCost.toString())} (${numberToWords(data.product.fullCost)}) рублей, в том числе базовая стоимость ${formatMoney(data.product.baseCost.toString())} (${numberToWords(data.product.baseCost)}) рублей и сумма торговой наценки ${formatMoney(data.product.markup.toString())} (${numberToWords(data.product.markup)}) рублей. `,
              }),
              new TextRun({
                text: 'Оплата производится путём перечисления денежных средств на счёт Продавца, указанный в Договоре или путём внесения наличных денежных средств в кассу Продавца.',
                break: 1,
              }),
            ],
          }),
          // ... остальные пункты раздела 3

          // График платежей
          new Paragraph({
            text: "График платежей:",
            spacing: { before: 200, after: 100 },
          }),
          createPaymentScheduleTable(data.product),

          // Раздел 4. ОБЕСПЕЧЕНИЕ ИСПОЛНЕНИЯ ОБЯЗАТЕЛЬСТВ
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: '4. ОБЕСПЕЧЕНИЕ ИСПОЛНЕНИЯ ОБЯЗАТЕЛЬСТВ',
                bold: true,
              }),
            ],
          }),
          // ... пункты раздела 4

          // Раздел 6. АДРЕСА, ПОДПИСИ И РЕКВИЗИТЫ СТОРОН
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: '6. АДРЕСА, ПОДПИСИ И РЕКВИЗИТЫ СТОРОН',
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            text: "Продавец:",
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Индивидуальный предприниматель\n${data.seller.fullName}`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Юридический адрес:\n${data.seller.address}`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `ИНН ${data.seller.inn}\nОГРНИП ${data.seller.ogrnip}`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Расчетный счет ${data.seller.bankAccount}\nБанк ${data.seller.bankName}`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Корр. счет Банка ${data.seller.bankCorrAccount}\nИНН Банка ${data.seller.bankInn}\nБИК Банка ${data.seller.bankBik}`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `E-mail: ${data.seller.email}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "___________________________",
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: "Подпись",
            spacing: { after: 200 },
          }),

          // Покупатель
          new Paragraph({
            text: "Покупатель:",
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `${data.client.fullName}\n${formatDate(data.client.birthDate)} года рождения`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `паспорт ${data.client.passportSeries} № ${data.client.passportNumber} выдан ${data.client.passportIssuedBy} ${formatDate(data.client.passportIssueDate)} г.`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `код подразделения ${data.client.passportDepartmentCode}\nпроживающий по адресу: ${data.client.address}`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Тел. ${data.client.phone}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "___________________________",
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: "Подпись",
            spacing: { after: 400 },
          }),

          // Согласие на обработку персональных данных
          new Paragraph({
            text: "Согласие субъекта на обработку персональных данных",
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: `Я, ${data.client.fullName}, проживающий(ая) по адресу: ${data.client.address}, паспорт ${data.client.passportSeries} ${data.client.passportNumber}, ${formatDate(data.client.passportIssueDate)} г., ${data.client.passportIssuedBy}, на основании статей 9, 11 Федерального закона от 27 июля 2006 г. № 152-ФЗ «О персональных данных» в целях исполнения договора купли - продажи даю свое согласие ${data.seller.fullName} (Продавцу), получающего согласие субъекта персональных данных на автоматизированную, а также без использования средств автоматизации обработку своих персональных данных, включая сбор, систематизацию, накопление, хранение, уточнение (обновление, изменение), использование, обезличивание, блокирование, уничтожение персональных данных.`,
            spacing: { after: 200 },
          }),
          // ... остальная часть согласия
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

function createPaymentScheduleTable(product: ProductData): Table {
  const rows = [];
  const monthlyPayment = product.remainingPayment / product.termMonths;
  const contractDate = new Date(product.finalPaymentDate);
  
  // Заголовок таблицы
  rows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph("№ п/п")],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph("Сумма платежа")],
          width: { size: 30, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph("Срок оплаты")],
          width: { size: 30, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph("Статус")],
          width: { size: 30, type: WidthType.PERCENTAGE },
        }),
      ],
    })
  );

  // Добавляем строки с платежами
  for (let i = 0; i < product.termMonths; i++) {
    const paymentDate = new Date(contractDate);
    paymentDate.setMonth(paymentDate.getMonth() - (product.termMonths - i - 1));
    
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph((i + 1).toString())],
          }),
          new TableCell({
            children: [new Paragraph(formatMoney(monthlyPayment.toString()))],
          }),
          new TableCell({
            children: [new Paragraph(formatDate(paymentDate))],
          }),
          new TableCell({
            children: [new Paragraph("Не оплачено")],
          }),
        ],
      })
    );
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function numberToWords(num: number): string {
  // Реализация преобразования числа в слова (можно использовать готовую библиотеку)
  // Здесь упрощенная версия для примера
  const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const tens = ['', 'десять', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  
  if (num === 0) return 'ноль';
  
  let result = '';
  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;
  
  if (thousands > 0) {
    result += numberToWords(thousands) + ' тысяча ';
  }
  
  const h = Math.floor(remainder / 100);
  const t = Math.floor((remainder % 100) / 10);
  const u = remainder % 10;
  
  if (h > 0) {
    result += hundreds[h] + ' ';
  }
  
  if (t === 1) {
    result += teens[u] + ' ';
  } else {
    if (t > 1) {
      result += tens[t] + ' ';
    }
    if (u > 0) {
      result += units[u] + ' ';
    }
  }
  
  return result.trim();
}

export async function generateGuaranteeContractDocx(data: ContractData): Promise<Blob> {
  if (!data.guarantor) {
    throw new Error("Guarantor data is required for guarantee contract");
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Заголовок договора
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `ДОГОВОР № ${data.contractNumber}-Г`,
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'поручительства',
                bold: true,
                size: 24,
              }),
            ],
          }),
          // ... остальное содержимое договора поручительства
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}