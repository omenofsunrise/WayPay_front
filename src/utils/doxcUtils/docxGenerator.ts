import { saveAs } from 'file-saver';
import { TemplateHandler } from 'easy-template-x';
import type { CreditDocs, SoldProductItem } from '../../api/types/credit';
import { formatMoney } from '../formatPrice';

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
      
      const handler = new TemplateHandler();
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
    
    // Обработка логотипа
    if (docsData.logo) {
      try {
        const logoImage = await this.loadImageAsBase64(docsData.logo);
        result.logo = {
          _type: 'image',
          source: logoImage,
          format: this.getImageFormat(docsData.logo),
          width: 100, // Настройте размер по необходимости
          height: 50,
          altText: 'Logo'
        };
      } catch (error) {
        console.warn('Не удалось загрузить логотип:', error);
        result.logo = null;
      }
    }

    if (docsData.paymentSchedule && docsData.paymentSchedule.length > 0) {
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

    result.hasGuarantor = !!docsData.guarantorName;
    result.hasProducts = !!docsData.soldProducts && docsData.soldProducts.length > 0;
    
    return result;
  }

  /**
   * Загружает изображение и конвертирует в base64
   */
  private async loadImageAsBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Убираем префикс data:image/...;base64,
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading image:', error);
      throw new Error(`Failed to load image: ${imageUrl}`);
    }
  }

  /**
   * Определяет формат изображения по URL
   */
  private getImageFormat(imageUrl: string): string {
    const extension = imageUrl.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'png':
        return 'png';
      case 'jpg':
      case 'jpeg':
        return 'jpeg';
      case 'gif':
        return 'gif';
      case 'bmp':
        return 'bmp';
      case 'svg':
        return 'svg';
      default:
        return 'jpeg'; // default format
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
   * Форматирует число с пробелами тысяч
   */
  private formatNumberWithSpaces(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  private async loadTemplate(url: string): Promise<Blob> {
    const response = await fetch(url, {
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
    } else if (templateUrl.includes('salesContractSinglePage')) {
      docType = 'Договор_купли_продажи_одностраничный';
    } else if (templateUrl.includes('salesContract')) {
      docType = 'Договор_купли_продажи';
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