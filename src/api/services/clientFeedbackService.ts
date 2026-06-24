import apiClient from "../client";
import {
  FEEDBACK_MARK_VALUE,
  type CreateClientFeedbackRequest,
} from "../types/clientFeedback";

class ClientFeedbackService {
  async createFeedback(data: CreateClientFeedbackRequest): Promise<void> {
    // mark передаётся числовым значением enum (Good=1, Difficult=2, ...).
    await apiClient.post("/ClientFeedback", {
      clientId: data.clientId,
      mark: FEEDBACK_MARK_VALUE[data.mark],
      stars: data.stars ?? 0,
      comment: data.comment ?? "",
    });
  }
}

export default new ClientFeedbackService();
