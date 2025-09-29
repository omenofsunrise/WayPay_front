import { saveAs } from 'file-saver';
import { TemplateHandler } from 'easy-template-x';
import type { InvestorAgreementResponse } from '../../api/types/investor';

class InvestorDocxGenerator {
  private templateUrl: string = '/Docs/investor.docx';

  public async generateInvestorContract(
    investorData: InvestorAgreementResponse,
    investorName: string
  ): Promise<void> {
    try {
      const templateData = this.prepareTemplateData(investorData);
      
      const templateFile = await this.loadTemplate(this.templateUrl);
      
      const handler = new TemplateHandler();
      const docx = await handler.process(templateFile, templateData);
      
      const fileName = this.generateFileName(investorName);
      saveAs(docx, fileName);

    } catch (error) {
      console.error('Investor document generation error:', error);
      throw new Error(`Document generation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`);
    }
  }

  private prepareTemplateData(data: InvestorAgreementResponse): any {
    return {
      city: data.city,
      investorDate: data.investorDate,
      investorName: data.investorName,
      investment: data.investment,
      investorPie: data.investorPie,
      companyPie: data.companyPie,
      investorMonths: data.investorMonths,
      directorName: data.directorName
    };
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
    
    return await response.blob();
  }

  private generateFileName(investorName: string): string {
    const formattedName = investorName.split(' ')[0];
    return `Договор_инвестора_${formattedName}.docx`;
  }
}

export default InvestorDocxGenerator;