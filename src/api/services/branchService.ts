import apiClient from '../client';
import type { 
  BranchWithCoordinatesResponse, 
  CreateBranchRequest,
  UpdateBranchRequest 
} from '../types/branch';

class BranchService {
  async getMyBranches(): Promise<BranchWithCoordinatesResponse[]> {
    const response = await apiClient.get<BranchWithCoordinatesResponse[]>('/Branch/my');
    return response.data;
  }

  async createBranch(branchData: CreateBranchRequest): Promise<BranchWithCoordinatesResponse> {
    const response = await apiClient.post<BranchWithCoordinatesResponse>('/Branch', branchData);
    return response.data;
  }

  async updateBranch(id: number, branchData: UpdateBranchRequest): Promise<BranchWithCoordinatesResponse> {
    const response = await apiClient.put<BranchWithCoordinatesResponse>(`/Branch/${id}`, branchData);
    return response.data;
  }

  async deleteBranch(id: number): Promise<void> {
    await apiClient.delete(`/Branch/${id}`);
  }
}

export default new BranchService();