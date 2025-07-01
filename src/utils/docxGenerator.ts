import { saveAs } from 'file-saver';
import { TemplateHandler } from 'easy-template-x';
import type { BuyerData, SellerData, ProductData, ContractData } from '../api/utils/contractTypes';

class DocxGenerator {
  private templateUrl: string;

  constructor(templateUrl: string = '/Docs/salesContract.docx') {
    this.templateUrl = templateUrl;
  }

  /**
   * Генерирует договор купли-продажи и инициирует его скачивание
   */
  public async generateAndDownloadContract(
    buyer: BuyerData,
    seller: SellerData,
    product: ProductData,
    contract: ContractData
  ): Promise<void> {
    let templateFile: Blob;

    try {
      // 1. Load template with better error handling
      const response = await fetch(this.templateUrl, {
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      });
      
      templateFile = await response.blob();
      
      const isLikelyDocx = await this.verifyDocxSignature(templateFile);
      if (!isLikelyDocx) {
        throw new Error('File does not appear to be a valid DOCX (missing PK signature)');
      }

      // Additional validation for the template file
      if (templateFile.size === 0) {
        throw new Error('Empty template file received');
      }
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream", // Some servers send this
        "" // Sometimes the type is empty but file is valid
      ];

      if (!validTypes.includes(templateFile.type)) {
        console.warn(`Unexpected file type: ${templateFile.type}`);
        // Don't throw error here - proceed and let the template processor handle validation
      }

      // 2. Validate data
      this.validateContractData(buyer, seller, product, contract);

      // 3. Prepare data
      const data = this.prepareTemplateData(buyer, seller, product, contract);

      // 4. Process template with additional error details
      const handler = new TemplateHandler();
      console.log('Template file before processing:', templateFile);
      
      const docx = await handler.process(templateFile, data);
      
      // 5. Save file
      const fileName = `Договор_${contract.contractNumber}_${buyer.lastName}.docx`;
      saveAs(docx, fileName);

    } catch (error) {
      console.error('Document generation error:', {
        error,
        templateUrl: this.templateUrl,
        templateSize: templateFile?.size,
        templateType: templateFile?.type
      });
      
      throw new Error(`Document generation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`);
    }
  }

  private validateContractData(
    buyer: BuyerData,
    seller: SellerData,
    product: ProductData,
    contract: ContractData
  ): void {
    if (!buyer.lastName || !seller.lastName || !product.name || !contract.contractNumber) {
      throw new Error('Не заполнены обязательные поля');
    }

    if (product.totalPrice <= 0) {
      throw new Error('Сумма договора должна быть больше нуля');
    }
  }
  
  /**
   * Подготавливает данные для замены в шаблоне
   */
  private prepareTemplateData(
    buyer: BuyerData,
    seller: SellerData,
    product: ProductData,
    contract: ContractData
  ): Record<string, any> {
    // Форматируем даты
    const contractDateFormatted = this.formatDate(contract.contractDate);
    const buyerBirthDateFormatted = this.formatDate(buyer.birthDate);
    const buyerPassportDateFormatted = this.formatDate(buyer.passportIssueDate);
    const finalPaymentDateFormatted = this.formatDate(contract.finalPaymentDate);

    // Форматируем сумму
    const totalPriceFormatted = this.formatCurrency(product.totalPrice);
    const basePriceFormatted = this.formatCurrency(product.basePrice);
    const markupFormatted = this.formatCurrency(product.markup);
    const initialPaymentFormatted = this.formatCurrency(contract.initialPayment);
    const remainingPaymentFormatted = this.formatCurrency(product.totalPrice - contract.initialPayment);

    // Подготавливаем данные для таблицы платежей
    const paymentSchedule = this.generatePaymentSchedule(
      product.totalPrice - contract.initialPayment,
      contract.initialPaymentDate,
      contract.finalPaymentDate,
      contract.paymentDay
    );

    return {
      // Шапка договора
      contractNumber: contract.contractNumber,
      contractYear: contract.contractDate.getFullYear(),
      contractDate: contractDateFormatted,
      city: 'Мистер Город',

      // Данные покупателя
      buyerFullName: `${buyer.lastName} ${buyer.firstName} ${buyer.middleName}`,
      buyerBirthDate: buyerBirthDateFormatted,
      buyerPassportSeries: buyer.passportSeries,
      buyerPassportNumber: buyer.passportNumber,
      buyerPassportIssueDate: buyerPassportDateFormatted,
      buyerPassportIssuedBy: buyer.passportIssuedBy,
      buyerPassportDepartmentCode: buyer.passportDepartmentCode,
      buyerAddress: buyer.address,
      buyerPhone: buyer.phone,

      // Данные продавца
      sellerFullName: `${seller.lastName} ${seller.firstName} ${seller.middleName}`,
      sellerOgrnip: seller.ogrnip,
      sellerLegalAddress: seller.legalAddress,
      sellerInn: seller.inn,
      sellerBankAccount: seller.bankAccount,
      sellerBankName: seller.bankName,
      sellerCorrAccount: seller.corrAccount,
      sellerBankInn: seller.bankInn,
      sellerBankBik: seller.bankBik,
      sellerEmail: seller.email,
      sellerShopAddress: seller.shopAddress,

      // Данные товара
      productName: product.name,
      productModel: product.model,
      productSpecs: product.specs,
      totalPrice: totalPriceFormatted,
      basePrice: basePriceFormatted,
      markup: markupFormatted,
      initialPayment: initialPaymentFormatted,
      remainingPayment: remainingPaymentFormatted,
      finalPaymentDate: finalPaymentDateFormatted,
      installmentMonths: product.installmentMonths,

      // График платежей
      paymentSchedule: paymentSchedule,

      // Поручитель (если есть)
      guarantorFullName: contract.guarantor ? 
        `${contract.guarantor.lastName} ${contract.guarantor.firstName} ${contract.guarantor.middleName}` : 
        'не указано',
      guarantorRelation: contract.guarantor?.relation || 'не указано',

      // Согласие на обработку персональных данных
      consentPeriod: '12 (двенадцать)',
      consentDate: contractDateFormatted
    };
  }

  /**
   * Генерирует график платежей для таблицы
   */
  private generatePaymentSchedule(
    totalAmount: number,
    startDate: Date,
    endDate: Date,
    paymentDay: number
  ): Array<{ number: number; date: string; amount: string }> {
    const schedule = [];
    const months = this.monthDiff(startDate, endDate);
    const monthlyPayment = totalAmount / months;

    let currentDate = new Date(startDate);
    
    for (let i = 1; i <= months; i++) {
      // Устанавливаем день платежа
      const paymentDate = new Date(currentDate);
      paymentDate.setDate(paymentDay);
      
      // Если день платежа уже прошел в текущем месяце, переходим к следующему
      if (paymentDate < currentDate) {
        paymentDate.setMonth(paymentDate.getMonth() + 1);
      }

      schedule.push({
        number: i,
        date: this.formatDate(paymentDate),
        amount: this.formatCurrency(monthlyPayment)
      });

      // Переходим к следующему месяцу
      currentDate = new Date(paymentDate);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return schedule;
  }

  /**
   * Форматирует дату в строку "дд.мм.гггг"
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('ru-RU');
  }

  /**
   * Форматирует сумму в строку с разделителями и валютой
   */
  private formatCurrency(amount: number): string {
    return amount.toLocaleString('ru-RU') + ' руб.';
  }

  /**
   * Преобразует число в слова (для суммы прописью)
   */
  private numberToWords(num: number): string {
    // Здесь должна быть реализация преобразования числа в слова
    // Для простоты оставим заглушку
    return 'сумма прописью';
  }

  /**
   * Вычисляет разницу между датами в месяцах
   */
  private monthDiff(startDate: Date, endDate: Date): number {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
           (endDate.getMonth() - startDate.getMonth());
  }

  private ensureDate(date: Date | string): Date {
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    throw new Error('Некорректный формат даты');
  }

  private async verifyDocxSignature(blob: Blob): Promise<boolean> {
    try {
      const buffer = await blob.slice(0, 4).arrayBuffer();
      const view = new DataView(buffer);
      // DOCX files start with PK (zip format)
      return view.getUint32(0) === 0x504B0304;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }
}

export default DocxGenerator;