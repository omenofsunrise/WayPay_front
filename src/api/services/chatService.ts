import socialApiClient from "../socialApiClient";

export const ChatService = {
  getGlobalMessages: async () => {
    try {
      const response = await socialApiClient.get('/messages/global');
      return response.data;
    } catch (error) {
      console.error('Error fetching global messages:', error);
      throw error;
    }
  },

  getCompanyMessages: async (companyId: string) => {
    try {
      const response = await socialApiClient.get(`/messages/company/${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching company messages:', error);
      throw error;
    }
  },

  getPrivateMessages: async (userId: string) => {
    try {
      const response = await socialApiClient.get(`/messages/private/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching private messages:', error);
      throw error;
    }
  }
};