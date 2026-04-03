import api from './api';
import type {
  ApiResponse,
  PaginatedResponse,
  HireTrainer,
  HireTrainerDocument,
  HireTrainerSearchResult,
  HireTrainerSearchParams,
  OtpResponse,
  VerificationStatus,
} from '@/types';

export const hireTrainerService = {
  // OTP & Verification
  async sendOtp(email: string, mobile: string): Promise<OtpResponse> {
    const response = await api.post<ApiResponse<OtpResponse>>('/hire-trainer/send-otp', { email, mobile });
    return response.data.data!;
  },

  async verifyOtp(email: string, otpCode: string): Promise<{ verified: boolean; message: string }> {
    const response = await api.post<ApiResponse<{ verified: boolean; message: string }>>('/hire-trainer/verify-otp', { email, otpCode });
    return response.data.data!;
  },

  async checkVerification(email: string): Promise<VerificationStatus> {
    const response = await api.post<ApiResponse<VerificationStatus>>('/hire-trainer/check-verification', { email });
    return response.data.data!;
  },

  // Draft management
  async saveStep(email: string, step: number, data: Record<string, any>): Promise<{ id: string; currentStep: number }> {
    const response = await api.post<ApiResponse<{ id: string; currentStep: number }>>('/hire-trainer/save-step', { email, step, data });
    return response.data.data!;
  },

  async submitApplication(email: string): Promise<{ id: string }> {
    const response = await api.post<ApiResponse<{ id: string }>>('/hire-trainer/submit', { email });
    return response.data.data!;
  },

  async resumeDraft(email: string, mobile: string): Promise<HireTrainer> {
    const response = await api.post<ApiResponse<HireTrainer>>('/hire-trainer/resume', { email, mobile });
    return response.data.data!;
  },

  // File upload
  async uploadCertificate(hireTrainerId: string, file: File): Promise<HireTrainerDocument> {
    const formData = new FormData();
    formData.append('certificate', file);
    formData.append('hireTrainerId', hireTrainerId);

    const response = await api.post<ApiResponse<HireTrainerDocument>>('/hire-trainer/upload-certificate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  },

  // My Profile
  async getMyProfile(email: string): Promise<HireTrainer> {
    const response = await api.get<ApiResponse<HireTrainer>>(`/hire-trainer/my?email=${encodeURIComponent(email)}`);
    return response.data.data!;
  },

  async updateProfile(email: string, data: Record<string, any>): Promise<HireTrainer> {
    const response = await api.put<ApiResponse<HireTrainer>>('/hire-trainer/update', { email, ...data });
    return response.data.data!;
  },

  // Search
  async searchTrainers(params: HireTrainerSearchParams): Promise<PaginatedResponse<HireTrainerSearchResult>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await api.get(
      `/hire-trainer/search?${queryParams.toString()}`
    );
    const body = response.data;
    // API returns { data: { items, pagination } } — normalize to PaginatedResponse shape
    const inner = body.data ?? body;
    return {
      success: body.success,
      message: body.message,
      data: inner.items ?? inner.data ?? [],
      pagination: inner.pagination ?? body.pagination,
    };
  },

  async getTrainerProfile(id: string): Promise<HireTrainer> {
    const response = await api.get<ApiResponse<HireTrainer>>(`/hire-trainer/${id}`);
    return response.data.data!;
  },
};
