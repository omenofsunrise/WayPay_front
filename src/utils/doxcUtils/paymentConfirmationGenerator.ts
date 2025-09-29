import { saveAs } from 'file-saver';
import { TemplateHandler } from 'easy-template-x';
import { formatMoney } from '../formatPrice';
import type { PaymentTab } from '../../api/types/payment';

class PaymentConfirmationGenerator {
  private templateUrl: string = '/Docs/paymentTab.docx';
  private getDocsData: (id: number) => Promise<PaymentTab | null>;
  
  constructor(getDocsData: (id: number) => Promise<PaymentTab | null>) {
    this.getDocsData = getDocsData;
  }

  /**
   * Генерирует подтверждение оплаты из данных кредита
   */
  public async generatePaymentConfirmation(creditId: number): Promise<void> {
    try {
      const docsData = await this.getDocsData(creditId);
      if (!docsData) {
        throw new Error('Не удалось получить данные для подтверждения оплаты');
      }
      
      const templateData = this.prepareTemplateData(docsData);
      
      const templateFile = await this.loadTemplate(this.templateUrl);
      
      const handler = new TemplateHandler();
      const docx = await handler.process(templateFile, templateData);
      
      const fileName = this.generateFileName(docsData);
      saveAs(docx, fileName);

    } catch (error) {
      console.error('Payment confirmation generation error:', error);
      throw new Error(`Document generation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`);
    }
  }

  /**
   * Подготавливает данные для шаблона подтверждения оплаты
   */
  private prepareTemplateData(docsData: PaymentTab): any {
    const result: any = { 
      contractNumber: docsData.contractNumber || '',
      contractDate: this.formatDate(docsData.contractDate) || '',
      clientName: docsData.clientName || '',
      clientAddress: docsData.clientAddress || '',
      clientPhone: docsData.clientPhone || '',
      employeeFullname: docsData.employeeFullname || '',
      paymentDate: this.formatDate(docsData.paymentDate) || '',
      paymentAmount: docsData.paymentAmount ? formatMoney(docsData.paymentAmount.toString()) : '',
      paymentType: docsData.paymentType || 'Банковский перевод',
    };

    return result;
  }

  /**
   * Форматирует дату в строку
   */
  private formatDate(date: Date): string {
    if (!date) return '';
    
    try {
      return new Date(date).toLocaleDateString('ru-RU');
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  }

  private async loadTemplate(url: string): Promise<Blob> {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`);
    }
    
    const templateFile = await response.blob();
    const isLikelyDocx = await this.verifyDocxSignature(templateFile);
    
    if (!isLikelyDocx) {
      throw new Error('Файл шаблона не является valid DOCX');
    }
    
    return templateFile;
  }

  private generateFileName(docsData: PaymentTab): string {
    const clientName = docsData.clientName 
      ? docsData.clientName.split(' ')[0] 
      : 'клиент';
    
    const contractNumber = docsData.contractNumber ? `_${docsData.contractNumber}` : '';
    
    return `Подтверждение_оплаты${contractNumber}_${clientName}.docx`;
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

export default PaymentConfirmationGenerator;