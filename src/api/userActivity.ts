import apiClient from "./client";

export interface UserActivityDay {
  date: string;
  uniqueUsers: number;
  interactions: number;
}

export interface UserActivityStats {
  days: number;
  onlineNow: number;
  uniqueUsers: number;
  interactedUsers: number;
  events: number;
  byDay: UserActivityDay[];
}

export const getUserActivityStats = async (days = 30) => {
  const response = await apiClient.get<UserActivityStats>("/UserActivity/stats", {
    params: { days },
  });
  return response.data;
};
