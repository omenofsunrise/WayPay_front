import { saveAs } from 'file-saver';
import { TemplateHandler } from 'easy-template-x';
import type { CreditDocs, PaymentScheduleItem } from '../api/types/credit';

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
  public async generateFromCreditData(creditId: number, templateUrl?: string): Promise<void> {
    try {
      const docsData = await this.getDocsData(creditId);
      if (!docsData) {
        throw new Error('Не удалось получить данные для документа');
      }
      
      // Форматируем данные для шаблона
      const templateData = this.prepareTemplateData(docsData);
      
      const templateFile = await this.loadTemplate(templateUrl || this.templateUrl);
      
      const handler = new TemplateHandler();
      const docx = await handler.process(templateFile, templateData);
      
      const fileName = this.generateFileName(docsData);
      saveAs(docx, fileName);

    } catch (error) {
      console.error('Document generation error:', error);
      throw new Error(`Document generation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`);
    }
  }

  /**
   * Подготавливает данные для шаблона, включая таблицу платежей
   */
  private prepareTemplateData(docsData: CreditDocs): any {
      if (!docsData.paymentSchedule || docsData.paymentSchedule.length === 0) {
          return docsData;
      }
      
      const paymentTable = docsData.paymentSchedule.map((item, index) => ({
          index: (index + 1).toString(),
          date: item.date,
          balance: item.balance,
          payment: item.payment,
          note: item.note || ''
      }));

      const hasGuarantor = !!docsData.guarantorName;
      
      return {
          ...docsData,
          paymentTable,
          hasGuarantor
      };
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

  private generateFileName(docsData: CreditDocs): string {
    const clientName = docsData.clientName 
      ? docsData.clientName.split(' ')[0] 
      : 'клиент';
    return `Договор_${docsData.contractNumber}_${clientName}.docx`;
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