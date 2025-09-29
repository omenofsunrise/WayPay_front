import { saveAs } from 'file-saver';
import { TemplateHandler } from 'easy-template-x';
import type { CreditDocs } from '../../api/types/credit';
import { formatMoney } from '../formatPrice';

class PaymentConfirmationGenerator {
  private templateUrl: string = '/Docs/paymentTab.docx';
  private getDocsData: (id: number) => Promise<CreditDocs | null>;
  
  constructor(getDocsData: (id: number) => Promise<CreditDocs | null>) {
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
  private prepareTemplateData(docsData: CreditDocs): any {
    const result: any = { 
      contractNumber: docsData.contractNumber || '',
      contractDate: docsData.contractDate || '',
      clientName: docsData.clientName || '',
      clientAddress: docsData.clientAddress || '',
      clientPhone: docsData.clientPhone || '',
      employeeFullname: docsData.employeeFullname || ''
    };
    
    // Добавляем данные о последнем платеже из графика платежей
    if (docsData.paymentSchedule && docsData.paymentSchedule.length > 0) {
      const lastPayment = docsData.paymentSchedule[docsData.paymentSchedule.length - 1];
      
      result.paymentDate = lastPayment.date || '';
      result.paymentAmount = lastPayment.payment ? formatMoney(lastPayment.payment.toString()) : '';
      result.paymentType = 'Банковский перевод'; // Можно добавить поле в тип, если нужно
      result.restAmount = lastPayment.balance ? formatMoney(lastPayment.balance.toString()) : '';
    } else {
      // Если нет графика платежей, используем основные данные
      result.paymentDate = new Date().toLocaleDateString('ru-RU');
      result.paymentAmount = docsData.totalAmount ? formatMoney(docsData.totalAmount.toString()) : '';
      result.paymentType = 'Банковский перевод';
      result.restAmount = '0';
    }

    return result;
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

  private generateFileName(docsData: CreditDocs): string {
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