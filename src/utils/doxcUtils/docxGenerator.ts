import { saveAs } from 'file-saver';
import { TemplateHandler, MimeType } from 'easy-template-x';
import type { CreditDocs, SoldProductItem } from '../../api/types/credit';
import { formatMoney } from '../formatPrice';

/** Поля одного поручителя в шаблонах договоров. */
type GuarantorTemplateFields = {
  guarantorNumber: string;
  guarantorName: string;
  guarantorBirthdate: string;
  guarantorPassportSeries: string;
  guarantorPassportNumber: string;
  guarantorDocIssueDate: string;
  guarantorPhone: string;
  guarantorAddress: string;
};

class DocxGenerator {
  private templateUrl: string;
  private getDocsData: (id: number) => Promise<CreditDocs | null>;
  
  constructor(
    getDocsData: (id: number) => Promise<CreditDocs | null>,
    templateUrl: string = '/Docs/salesContract.docx'
  ) {
    this.getDocsData = getDocsData;
    this.templateUrl = templateUrl;
  }

  /**
   * Генерирует документ из данных кредита и инициирует его скачивание
   */
  public async generateFromCreditData(
    creditId: number, 
    templateUrl: string = '/Docs/salesContract.docx'
  ): Promise<void> {
    try {
      const docsData = await this.getDocsData(creditId);
      if (!docsData) {
        throw new Error('Не удалось получить данные для документа');
      }
      
      const templateData = await this.prepareTemplateData(docsData);
      
      const templateFile = await this.loadTemplate(templateUrl);
      
      const handler = new TemplateHandler({
        maxXmlDepth: 30,
      });

      // Договор поручительства составляется на одного человека — при
      // нескольких поручителях делаем отдельный файл на каждого.
      const guarantors: GuarantorTemplateFields[] = templateData.guarantorsList;
      if (templateUrl.includes('guaranteeandConsentAgreement') && guarantors.length > 1) {
        for (const [index, guarantor] of guarantors.entries()) {
          const docx = await handler.process(templateFile, { ...templateData, ...guarantor });
          const surname = guarantor.guarantorName.split(' ')[0] || `${index + 1}`;
          const fileName = this.generateFileName(docsData, templateUrl)
            .replace(/\.docx$/, `_поручитель_${index + 1}_${surname}.docx`);
          saveAs(docx, fileName);
        }
        return;
      }

      const docx = await handler.process(templateFile, templateData);
      
      const fileName = this.generateFileName(docsData, templateUrl);
      saveAs(docx, fileName);

    } catch (error) {
      console.error('Document generation error:', error);
      throw new Error(`Document generation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`);
    }
  }

  /**
   * Подготавливает данные для шаблона, включая таблицы платежей и продуктов
   */
  private async prepareTemplateData(docsData: CreditDocs): Promise<any> {
    const result: any = { ...docsData };
    
    if (docsData.paymentSchedule && docsData.paymentSchedule.length > 0) {
      result.paymentTableTwoColumns = this.prepareTwoColumnPaymentData(docsData.paymentSchedule);
      
      result.paymentTable = docsData.paymentSchedule.map((item, index) => ({
        index: (index + 1).toString(),
        date: item.date,
        balance: item.balance,
        payment: item.payment,
        note: item.note || ''
      }));
    }

    if (docsData.soldProducts && docsData.soldProducts.length > 0) {
      result.productsTable = docsData.soldProducts.map((product, index) => ({
        index: (index + 1).toString(),
        name: product.name,
        price: formatMoney(product.price.toString()),
      }));

      result.totalProductsPrice = this.calculateTotal(docsData.soldProducts, 'price');
      result.totalSurchargeAmount = this.calculateTotal(docsData.soldProducts, 'surchargeAmount');
      result.totalProductsAmount = this.calculateTotal(docsData.soldProducts, 'totalAmount');
    }

    // Обработка изображений по URL
    await this.processImageUrls(result, docsData.logo);

    // Поручители для шаблона. Поля названы как старые одиночные (guarantorName…),
    // чтобы внутри цикла {#guarantorsList} работали те же теги.
    const guarantorsList: GuarantorTemplateFields[] = (docsData.guarantors ?? []).map((g) => ({
      guarantorNumber: String(g.number),
      guarantorName: g.name ?? '',
      guarantorBirthdate: g.birthdate ?? '',
      guarantorPassportSeries: g.passportSeries ?? '',
      guarantorPassportNumber: g.passportNumber ?? '',
      guarantorDocIssueDate: g.docIssueDate ?? '',
      guarantorPhone: g.phone ?? '',
      guarantorAddress: g.address ?? '',
    }));
    // Бэкенд без списка: один поручитель из старых полей.
    if (guarantorsList.length === 0 && docsData.guarantorName) {
      guarantorsList.push({
        guarantorNumber: '1',
        guarantorName: docsData.guarantorName,
        guarantorBirthdate: docsData.guarantorBirthdate ?? '',
        guarantorPassportSeries: docsData.guarantorPassportSeries ?? '',
        guarantorPassportNumber: docsData.guarantorPassportNumber ?? '',
        guarantorDocIssueDate: docsData.guarantorDocIssueDate ?? '',
        guarantorPhone: docsData.guarantorPhone ?? '',
        guarantorAddress: docsData.guarantorAddress ?? '',
      });
    }
    result.guarantorsList = guarantorsList;
    result.guarantorNames = guarantorsList.map((g) => g.guarantorName).filter(Boolean).join(', ');
    result.hasGuarantor = guarantorsList.length > 0;
    result.hasProducts = !!docsData.soldProducts && docsData.soldProducts.length > 0;
    
    return result;
  }

  /**
   * Обрабатывает URL изображений и конвертирует их в формат для easy-template-x
   */
private async processImageUrls(result: any, url: string): Promise<void> {
  if (!this.isValidImageUrl(url)) {
    console.warn('Invalid image URL:', url);
    return;
  }

  try {
    console.log('Fetching image from:', url);
    
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'image/*',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Empty image response');
    }

    const contentType = response.headers.get('content-type');
    let format: string = MimeType.Jpeg;
    
    if (contentType) {
      const typeMap: Record<string, string> = {
        'image/png': MimeType.Png,
        'image/jpeg': MimeType.Jpeg,
        'image/jpg': MimeType.Jpeg,
        'image/gif': MimeType.Gif,
        'image/bmp': MimeType.Bmp,
      };
      
      for (const [contentTypePattern, mimeType] of Object.entries(typeMap)) {
        if (contentType.includes(contentTypePattern)) {
          format = mimeType;
          break;
        }
      }
    }

    console.log('Image processed successfully, format:', format, 'size:', arrayBuffer.byteLength);
    
    result.superphoto = {
      _type: 'image' as const,
      source: arrayBuffer,
      format: format,
      width: 120,
      height: 120,
      altText: 'Фото клиента'
    };
    
  } catch (error) {
    console.error('Failed to load image:', error);
    // Можно добавить fallback изображение
    result.superphoto = null;
  }
}

  /**
   * Проверяет, является ли URL допустимым для изображения
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const urlLower = url.toLowerCase();
    
    return imageExtensions.some(ext => urlLower.includes(ext)) ||
           urlLower.startsWith('data:image/');
  }

  /**
   * Загружает изображение по URL и конвертирует в base64
   */
private async fetchImageAsArrayBuffer(url: string): Promise<{ buffer: ArrayBuffer; format: string } | null> {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // Определяем формат из Content-Type или URL
    const contentType = response.headers.get('content-type');
    let format = 'jpeg'; // значение по умолчанию
    
    if (contentType) {
      const typeMap: Record<string, string> = {
        'image/jpeg': 'jpeg',
        'image/jpg': 'jpeg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/bmp': 'bmp',
        'image/webp': 'webp'
      };
      format = typeMap[contentType] || 'jpeg';
    } else {
      // Определяем по расширению URL
      const urlLower = url.toLowerCase();
      if (urlLower.includes('.png')) format = 'png';
      else if (urlLower.includes('.gif')) format = 'gif';
      else if (urlLower.includes('.bmp')) format = 'bmp';
      else if (urlLower.includes('.webp')) format = 'webp';
    }

    return { buffer: arrayBuffer, format };
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

  /**
   * Вычисляет общую сумму для указанного поля в массиве продуктов
   */
  private calculateTotal(products: SoldProductItem[], field: keyof SoldProductItem): string {
    let total = 0;
    
    products.forEach(product => {
      const value = product[field];
      if (value && typeof value === 'string') {
        const numericValue = parseFloat(value.replace(/\s/g, '').replace(',', '.'));
        if (!isNaN(numericValue)) {
          total += numericValue;
        }
      }
    });
    
    return this.formatNumberWithSpaces(total);
  }

  /**
   * Создает данные для таблицы с двумя колонками платежей
   */
  private prepareTwoColumnPaymentData(paymentSchedule: any[]): any[] {
    const totalPayments = paymentSchedule.length;
    const half = Math.ceil(totalPayments / 2);
    
    const result = [];
    
    for (let i = 0; i < half; i++) {
      const leftPayment = paymentSchedule[i];
      const rightPayment = paymentSchedule[i + half];
      
      const row: any = {
        leftIndex: (i + 1).toString(),
        leftDate: leftPayment?.date || '',
        leftPayment: leftPayment?.payment || '',
        leftBalance: leftPayment?.balance || '',
        leftNote: leftPayment?.note || ''
      };
      
      if (rightPayment) {
        row.rightIndex = (i + half + 1).toString();
        row.rightDate = rightPayment.date;
        row.rightPayment = rightPayment.payment;
        row.rightBalance = rightPayment.balance;
        row.rightNote = rightPayment.note || '';
      }
      
      result.push(row);
    }
    
    return result;
  }

  /**
   * Форматирует число с пробелами тысяч
   */
  private formatNumberWithSpaces(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  private async loadTemplate(url: string): Promise<Blob> {
    const response = await fetch(url, {
      mode: 'cors', // Явно указываем CORS режим
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    });
    
    const templateFile = await response.blob();
    const isLikelyDocx = await this.verifyDocxSignature(templateFile);
    
    if (!isLikelyDocx) {
      throw new Error('Файл шаблона не является valid DOCX');
    }
    
    return templateFile;
  }

  private generateFileName(docsData: CreditDocs, templateUrl: string): string {
    const clientName = docsData.clientName 
      ? docsData.clientName.split(' ')[0] 
      : 'клиент';
    
    let docType = 'Договор';
    
    if (templateUrl.includes('schedules.docx')) {
      docType = 'График_платежей';
    } else if (templateUrl.includes('guaranteeContract')) {
      docType = 'Договор_поручительства';
    } else if (templateUrl.includes('guaranteeandConsentAgreement')) {
      docType = 'Договор_поручительства_и_согласие';
    } else if (templateUrl.includes('salesContract')) {
      return `${clientName}.docx`;
    }
    
    const contractNumber = docsData.contractNumber ? `_${docsData.contractNumber}` : '';
    
    return `${docType}${contractNumber}_${clientName}.docx`;
  }

  private async verifyDocxSignature(blob: Blob): Promise<boolean> {
    try {
      const buffer = await blob.slice(0, 4).arrayBuffer();
      const view = new DataView(buffer);
      return view.getUint32(0) === 0x504B0304;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }
}

export default DocxGenerator;