import { api } from './api';

export const doctorService = {
  getDashboardStats: async (date?: string, startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/doctor/dashboard?${params.toString()}`);
      return (response as any).data?.data || null;
    } catch (error) {
      console.error('Error fetching doctor dashboard stats:', error);
      throw error;
    }
  }
};
