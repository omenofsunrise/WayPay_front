export interface BranchWithCoordinatesResponse {
  id: number;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;

  schedules: WorkScheduleResponse[];
}

export interface CreateBranchRequest {
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  schedules: WorkScheduleRequest[];
}

export interface UpdateBranchRequest {
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  schedules: WorkScheduleRequest[];
}

export interface WorkScheduleResponse {
  id: number;
  dayOfWeek: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  openTime: string;
  closeTime: string; 
  isWorking: boolean;
}

export interface WorkScheduleRequest {
  dayOfWeek: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  openTime: string; 
  closeTime: string;
  isWorking: boolean;
}

export const formatTimeForInput = (timeString: string): string => {
  return timeString.substring(0, 5);
};

export const formatTimeForApi = (timeInput: string): string => {
  return timeInput.length === 5 ? `${timeInput}:00` : timeInput;
};

export const daysOfWeek = [
  'Sunday',
  'Monday', 
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const;