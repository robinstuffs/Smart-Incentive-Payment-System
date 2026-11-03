import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const userToken = localStorage.getItem('user_access_token');
    const adminToken = localStorage.getItem('access_token');
    const token = userToken || adminToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const userToken = localStorage.getItem('user_access_token');
      const adminToken = localStorage.getItem('access_token');
      if (userToken) {
        localStorage.removeItem('user_access_token');
        localStorage.removeItem('user_role');
        window.location.href = '/user/login';
      } else if (adminToken) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (surname: string, firstname: string, middlename: string, username: string, email: string, password: string) =>
    apiClient.post('/auth/register', { surname, firstname, middlename, username, email, password }),
  login: (username: string, password: string) =>
    apiClient.post('/auth/login', { username, password }),
  logout: () => apiClient.post('/auth/logout'),
  protected: () => apiClient.get('/auth/protected'),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => apiClient.get('/admin/dashboard'),

  // User Management
  getUsers: () => apiClient.get('/admin/users'),
  blockUser: (userId: number) => apiClient.put(`/admin/users/${userId}/block`),
  unblockUser: (userId: number) => apiClient.put(`/admin/users/${userId}/unblock`),
  editUser: (userId: number, data: any) => apiClient.put(`/admin/users/${userId}`, data),
  deleteUser: (userId: number) => apiClient.delete(`/admin/users/${userId}`),

  // Application Management
  getApplications: (filters?: { status?: string; ml_prediction?: string }) =>
    apiClient.get('/admin/applications', { params: filters }),
  updateApplicationStatus: (appId: number, data: any) =>
    apiClient.put(`/admin/applications/${appId}/status`, data),

  // Payment Monitoring
  getPayments: () => apiClient.get('/admin/payments'),
  detectDuplicatePayments: () => apiClient.get('/admin/payments/duplicates'),

  // System Settings
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (data: any) => apiClient.post('/admin/settings', data),

  // ML Interpretability
  getMLInterpretability: () => apiClient.get('/admin/ml-interpretability'),

  // Bank Management
  getBanks: () => apiClient.get('/admin/banks'),
  createBank: (data: { name: string; abbreviation: string }) => apiClient.post('/admin/banks', data),
  updateBank: (bankId: number, data: { name: string; abbreviation: string }) => apiClient.put(`/admin/banks/${bankId}`, data),
  deleteBank: (bankId: number) => apiClient.delete(`/admin/banks/${bankId}`),

    // Reports
  getReportMeta: () => apiClient.get('/admin/reports/meta'),
};

// User APIs
export const userAPI = {
  submitApplication: (data: any) => apiClient.post('/user/applications', data),
  getApplications: () => apiClient.get('/user/applications'),
  getApplicationResult: (appId: number) => apiClient.get(`/user/applications/${appId}/result`),
  getSingleApplication: (appId: number) => apiClient.get(`/user/applications/${appId}`),
  claimIncentive: (appId: number) => apiClient.post(`/user/applications/${appId}/claim-incentive`),
  getUserProfile: () => apiClient.get('/user/profile'),
  updateUserProfile: (data: any) => apiClient.put('/user/profile', data),
  updatePaymentDetails: (data: { account_name: string; account_number: string; bank_id: number }) =>
    apiClient.put('/user/profile/payment-details', data),
  getBanks: () => apiClient.get('/user/banks'),
};

export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An error occurred. Please try again.';
};

export const showSuccessToast = (message: string) => {
  toast.success(message, { duration: 3000 });
};

export const showErrorToast = (error: any) => {
  const message = handleApiError(error);
  toast.error(message, { duration: 4000 });
};

export default apiClient;
