import api from './api';
import type {
  ApiResponse,
  GymOwnerLeadOtpResponse,
  GymOwnerLeadVerifyResponse,
  GymOwnerLeadSessionResponse,
  GymOwnerLeadCheckMobileResponse,
  GymOwnerLeadRegisterResponse,
} from '@/types';

const STORAGE_KEY = 'gym-owner-lead-email';
const MOBILE_KEY = 'gym-owner-lead-mobile';
const USER_TYPE_KEY = 'gym-owner-lead-user-type';

export const gymOwnerLeadService = {
  // OTP
  async sendOtp(email: string): Promise<GymOwnerLeadOtpResponse> {
    const response = await api.post<ApiResponse<GymOwnerLeadOtpResponse>>(
      '/gym-owner-lead/send-otp',
      { email },
    );
    return response.data.data!;
  },

  async verifyOtp(email: string, otpCode: string): Promise<GymOwnerLeadVerifyResponse> {
    const response = await api.post<ApiResponse<GymOwnerLeadVerifyResponse>>(
      '/gym-owner-lead/verify-otp',
      { email, otpCode },
    );
    return response.data.data!;
  },

  // Register
  async register(data: {
    email: string;
    name: string;
    gymName: string;
    mobile: string;
    gender: string;
  }): Promise<GymOwnerLeadRegisterResponse> {
    const response = await api.post<ApiResponse<GymOwnerLeadRegisterResponse>>(
      '/gym-owner-lead/register',
      data,
    );
    return response.data.data!;
  },

  // Check mobile (passwordless login)
  async checkMobile(mobile: string): Promise<GymOwnerLeadCheckMobileResponse> {
    const response = await api.post<ApiResponse<GymOwnerLeadCheckMobileResponse>>(
      '/gym-owner-lead/check-mobile',
      { mobile },
    );
    return response.data.data!;
  },

  // Session check
  async checkSession(email: string): Promise<GymOwnerLeadSessionResponse> {
    const response = await api.post<ApiResponse<GymOwnerLeadSessionResponse>>(
      '/gym-owner-lead/check-session',
      { email },
    );
    return response.data.data!;
  },

  // Resend OTP
  async resendOtp(email: string): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/gym-owner-lead/resend-otp',
      { email },
    );
    return response.data.data!;
  },

  // Forgot Password — send login details to email
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/gym-owner-lead/forgot-password',
      { email },
    );
    return response.data.data!;
  },

  // Local storage helpers
  saveEmail(email: string) {
    localStorage.setItem(STORAGE_KEY, email);
  },

  getSavedEmail(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  },

  clearEmail() {
    localStorage.removeItem(STORAGE_KEY);
  },

  saveMobile(mobile: string) {
    localStorage.setItem(MOBILE_KEY, mobile);
  },

  getSavedMobile(): string | null {
    return localStorage.getItem(MOBILE_KEY);
  },

  clearMobile() {
    localStorage.removeItem(MOBILE_KEY);
  },

  saveUserType(userType: string) {
    localStorage.setItem(USER_TYPE_KEY, userType);
  },

  getUserType(): string | null {
    return localStorage.getItem(USER_TYPE_KEY);
  },

  clearUserType() {
    localStorage.removeItem(USER_TYPE_KEY);
  },
};
