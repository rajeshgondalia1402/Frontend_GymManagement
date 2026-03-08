import api from './api';
import type {
  ApiResponse,
  PaginatedResponse,
  BiometricDevice,
  CreateBiometricDeviceRequest,
  UpdateBiometricDeviceRequest,
  BiometricEnrollmentStatus,
  EnrollBiometricRequest,
  MemberBiometric,
  Attendance,
  AttendanceWithMember,
  CheckInRequest,
  CheckInResponse,
  CheckOutResponse,
  ManualAttendanceRequest,
  UpdateAttendanceRequest,
  DailyAttendanceSummary,
  MemberAttendanceSummary,
  AttendanceReport,
  AttendanceStreak,
  AttendanceCalendarEntry,
  AttendanceListParams,
  DailyReportWithMembers,
  MemberAttendanceHistory,
} from '@/types';

// ============================================
// Gym Owner - Biometric Device Management
// ============================================

export const biometricDeviceService = {
  async create(data: CreateBiometricDeviceRequest): Promise<BiometricDevice> {
    const response = await api.post<ApiResponse<BiometricDevice>>('/gym-owner/biometric-devices', data);
    return response.data.data;
  },

  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<BiometricDevice>> {
    const response = await api.get<PaginatedResponse<BiometricDevice>>('/gym-owner/biometric-devices', { params });
    return response.data;
  },

  async getById(deviceId: string): Promise<BiometricDevice> {
    const response = await api.get<ApiResponse<BiometricDevice>>(`/gym-owner/biometric-devices/${deviceId}`);
    return response.data.data;
  },

  async update(deviceId: string, data: UpdateBiometricDeviceRequest): Promise<BiometricDevice> {
    const response = await api.put<ApiResponse<BiometricDevice>>(`/gym-owner/biometric-devices/${deviceId}`, data);
    return response.data.data;
  },

  async delete(deviceId: string): Promise<void> {
    await api.delete(`/gym-owner/biometric-devices/${deviceId}`);
  },

  async testConnection(deviceId: string): Promise<{ deviceId: string; isOnline: boolean; lastSeenAt?: string }> {
    const response = await api.post<ApiResponse<{ deviceId: string; isOnline: boolean; lastSeenAt?: string }>>(
      `/gym-owner/biometric-devices/${deviceId}/test`
    );
    return response.data.data;
  },
};

// ============================================
// Gym Owner - Member Biometric Enrollment
// ============================================

export const memberBiometricService = {
  async enroll(memberId: string, data: EnrollBiometricRequest): Promise<MemberBiometric> {
    const response = await api.post<ApiResponse<MemberBiometric>>(
      `/gym-owner/members/${memberId}/biometric/enroll`,
      data
    );
    return response.data.data;
  },

  async getStatus(memberId: string): Promise<BiometricEnrollmentStatus> {
    const response = await api.get<ApiResponse<BiometricEnrollmentStatus>>(
      `/gym-owner/members/${memberId}/biometric/status`
    );
    return response.data.data;
  },

  async update(memberId: string, data: Partial<EnrollBiometricRequest>): Promise<MemberBiometric> {
    const response = await api.put<ApiResponse<MemberBiometric>>(
      `/gym-owner/members/${memberId}/biometric/update`,
      data
    );
    return response.data.data;
  },

  async delete(memberId: string): Promise<void> {
    await api.delete(`/gym-owner/members/${memberId}/biometric`);
  },

  async verify(memberId: string, fingerTemplate: string): Promise<{ isMatch: boolean; matchScore?: number }> {
    const response = await api.post<ApiResponse<{ isMatch: boolean; matchScore?: number }>>(
      `/gym-owner/members/${memberId}/biometric/verify`,
      { fingerTemplate }
    );
    return response.data.data;
  },
};

// ============================================
// Gym Owner - Attendance Management
// ============================================

export const gymOwnerAttendanceService = {
  async getAll(params?: AttendanceListParams): Promise<PaginatedResponse<AttendanceWithMember>> {
    const response = await api.get<PaginatedResponse<AttendanceWithMember>>('/gym-owner/attendance', { params });
    return response.data;
  },

  async getToday(): Promise<DailyAttendanceSummary> {
    const response = await api.get<ApiResponse<DailyAttendanceSummary>>('/gym-owner/attendance/today');
    return response.data.data;
  },

  async getMemberHistory(memberId: string, params?: AttendanceListParams): Promise<MemberAttendanceHistory> {
    const response = await api.get<ApiResponse<MemberAttendanceHistory>>(
      `/gym-owner/attendance/member/${memberId}`,
      { params }
    );
    return response.data.data;
  },

  async createManual(data: ManualAttendanceRequest): Promise<Attendance> {
    const response = await api.post<ApiResponse<Attendance>>('/gym-owner/attendance/manual', data);
    return response.data.data;
  },

  async update(attendanceId: string, data: UpdateAttendanceRequest): Promise<Attendance> {
    const response = await api.put<ApiResponse<Attendance>>(`/gym-owner/attendance/${attendanceId}`, data);
    return response.data.data;
  },

  // Reports
  async getDailyReport(date?: string): Promise<DailyReportWithMembers> {
    const response = await api.get<ApiResponse<DailyReportWithMembers>>('/gym-owner/attendance/reports/daily', {
      params: { date },
    });
    return response.data.data;
  },

  async getWeeklyReport(startDate?: string): Promise<AttendanceReport> {
    const response = await api.get<ApiResponse<AttendanceReport>>('/gym-owner/attendance/reports/weekly', {
      params: { startDate },
    });
    return response.data.data;
  },

  async getMonthlyReport(year?: number, month?: number): Promise<AttendanceReport> {
    const response = await api.get<ApiResponse<AttendanceReport>>('/gym-owner/attendance/reports/monthly', {
      params: { year, month },
    });
    return response.data.data;
  },
};

// ============================================
// Attendance Kiosk (Check-in Terminal)
// ============================================

export const attendanceKioskService = {
  async checkIn(data: CheckInRequest): Promise<CheckInResponse> {
    const response = await api.post<ApiResponse<CheckInResponse>>('/attendance/check-in', data);
    return response.data.data;
  },

  async checkOut(data: { fingerTemplate: string; deviceId?: string }): Promise<CheckOutResponse> {
    const response = await api.post<ApiResponse<CheckOutResponse>>('/attendance/check-out', data);
    return response.data.data;
  },

  async identify(fingerTemplate: string): Promise<{ isMatch: boolean; memberId?: string; memberName?: string; memberPhoto?: string }> {
    const response = await api.post<ApiResponse<{ isMatch: boolean; memberId?: string; memberName?: string; memberPhoto?: string }>>(
      '/attendance/identify',
      { fingerTemplate }
    );
    return response.data.data;
  },

  async getTodayForGym(gymId: string): Promise<AttendanceWithMember[]> {
    const response = await api.get<ApiResponse<AttendanceWithMember[]>>(`/attendance/today/${gymId}`);
    return response.data.data;
  },
};

// ============================================
// Member Self-Service
// ============================================

export const memberAttendanceService = {
  async getMyAttendance(params?: AttendanceListParams): Promise<PaginatedResponse<Attendance>> {
    const response = await api.get<PaginatedResponse<Attendance>>('/member/attendance/my-attendance', { params });
    return response.data;
  },

  async getMySummary(): Promise<MemberAttendanceSummary> {
    const response = await api.get<ApiResponse<MemberAttendanceSummary>>('/member/attendance/my-attendance/summary');
    return response.data.data;
  },

  async getMyCalendar(year?: number, month?: number): Promise<AttendanceCalendarEntry[]> {
    const response = await api.get<ApiResponse<AttendanceCalendarEntry[]>>('/member/attendance/my-attendance/calendar', {
      params: { year, month },
    });
    return response.data.data;
  },

  async getMyStreak(): Promise<AttendanceStreak> {
    const response = await api.get<ApiResponse<AttendanceStreak>>('/member/attendance/my-attendance/streak');
    return response.data.data;
  },
};

// ============================================
// Admin System-wide
// ============================================

export const adminAttendanceService = {
  async getAllGymsAttendance(params?: AttendanceListParams): Promise<PaginatedResponse<AttendanceWithMember & { gym?: { id: string; name: string } }>> {
    const response = await api.get<PaginatedResponse<AttendanceWithMember & { gym?: { id: string; name: string } }>>(
      '/admin/attendance/all',
      { params }
    );
    return response.data;
  },

  async getGymAttendance(gymId: string, params?: AttendanceListParams): Promise<PaginatedResponse<AttendanceWithMember>> {
    const response = await api.get<PaginatedResponse<AttendanceWithMember>>(`/admin/attendance/gym/${gymId}`, { params });
    return response.data;
  },

  async getAllDevices(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<BiometricDevice & { gym?: { id: string; name: string } }>> {
    const response = await api.get<PaginatedResponse<BiometricDevice & { gym?: { id: string; name: string } }>>(
      '/admin/attendance/devices',
      { params }
    );
    return response.data;
  },
};

// Combined export for convenience
export const attendanceService = {
  device: biometricDeviceService,
  biometric: memberBiometricService,
  gymOwner: gymOwnerAttendanceService,
  kiosk: attendanceKioskService,
  member: memberAttendanceService,
  admin: adminAttendanceService,
};

export default attendanceService;
