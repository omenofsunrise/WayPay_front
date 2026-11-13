import apiClient from "../client";
import type {
  ContractTemplate,
  ContractTemplateVariables,
} from "../types/contractTemplate";

const basePath = "/contract-templates";

const contractTemplateService = {
  async getAll(): Promise<ContractTemplate[]> {
    const response = await apiClient.get<ContractTemplate[]>(basePath);
    return response.data;
  },

  async getVariables(): Promise<string[]> {
    const response = await apiClient.get<ContractTemplateVariables>(
      `${basePath}/variables`
    );
    return response.data.variables;
  },

  async upload(name: string, file: File): Promise<ContractTemplate> {
    const form = new FormData();
    form.append("name", name);
    form.append("file", file);
    const response = await apiClient.post<ContractTemplate>(basePath, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 180000,
    });
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${basePath}/${id}`);
  },

  async download(id: number): Promise<Blob> {
    const response = await apiClient.get(`${basePath}/${id}/download`, {
      responseType: "blob",
      timeout: 30000,
    });
    return response.data;
  },

  async generate(id: number, creditId: number): Promise<Blob> {
    const response = await apiClient.get(
      `${basePath}/${id}/generate/${creditId}`,
      { responseType: "blob", timeout: 30000 }
    );
    return response.data;
  },
};

export default contractTemplateService;
