export interface ContractTemplate {
  id: number;
  name: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractTemplateVariables {
  variables: string[];
}
