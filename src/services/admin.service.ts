import api, { BACKEND_BASE_URL } from './api';
import type {
  ApiResponse,
  AdminDashboard,
  Gym,
  GymSubscriptionPlan,
  User,
  Occupation,
  EnquiryType,
  PaymentType,
  GymSubscriptionHistory,
  RenewGymSubscriptionRequest,
  GymSubscriptionHistoryParams,
  GymInquiry,
  GymInquiryFollowup,
  CreateGymInquiryRequest,
  GymInquiryParams,
} from '@/types';

export const adminService = {
  // Dashboard
  async getDashboard(): Promise<AdminDashboard> {
    const response = await api.get<ApiResponse<AdminDashboard>>('/admin/dashboard');
    return response.data.data;
  },

  // Subscription Plans
  async getSubscriptionPlans(): Promise<GymSubscriptionPlan[]> {
    const response = await api.get<ApiResponse<{ items: GymSubscriptionPlan[], pagination: any }>>('/admin/subscription-plans');
    return response.data.data.items;
  },

  async createSubscriptionPlan(data: Partial<GymSubscriptionPlan>): Promise<GymSubscriptionPlan> {
    const response = await api.post<ApiResponse<GymSubscriptionPlan>>('/admin/subscription-plans', data);
    return response.data.data;
  },

  async updateSubscriptionPlan(id: string, data: Partial<GymSubscriptionPlan>): Promise<GymSubscriptionPlan> {
    const response = await api.put<ApiResponse<GymSubscriptionPlan>>(`/admin/subscription-plans/${id}`, data);
    return response.data.data;
  },

  async deleteSubscriptionPlan(id: string): Promise<void> {
    await api.delete(`/admin/subscription-plans/${id}`);
  },

  // Gyms
  async getGyms(
    page = 1,
    limit = 100,
    search = '',
    subscriptionStatus?: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON',
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<{ items: Gym[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const params: Record<string, any> = { page, limit };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    if (subscriptionStatus) {
      params.subscriptionStatus = subscriptionStatus;
    }
    if (sortBy) {
      params.sortBy = sortBy;
    }
    if (sortOrder) {
      params.sortOrder = sortOrder;
    }
    console.debug('Fetching gyms with params:', params);
    const response = await api.get<{ success: boolean; message: string; data: { items: Gym[]; pagination: { page: number; limit: number; total: number; totalPages: number } } }>('/admin/gyms', { params });
    console.debug('Gyms response:', response.data);
    // Return the nested data structure
    return response.data.data;
  },

  async getGym(id: string): Promise<Gym> {
    const response = await api.get<ApiResponse<Gym>>(`/admin/gyms/${id}`);
    return response.data.data;
  },

  async createGym(data: Partial<Gym>): Promise<Gym> {
    // Clean up payload - only include non-empty, valid values
    const payload: Record<string, any> = {};
    
    // Required field
    if (data.name && typeof data.name === 'string' && data.name.trim()) {
      payload.name = data.name.trim();
    }
    
    // String fields - only include if non-empty string
    const stringFields = ['address1', 'address2', 'city', 'state', 'zipcode', 'mobileNo', 'phoneNo', 'email', 'gstRegNo', 'website', 'note', 'address', 'phone'];
    for (const field of stringFields) {
      const value = (data as any)[field];
      if (value && typeof value === 'string' && value.trim()) {
        payload[field] = value.trim();
      }
    }
    
    // Logo - only include if it's a valid non-empty string (filename)
    if (data.logo && typeof data.logo === 'string' && data.logo.trim() && data.logo !== 'null' && data.logo !== 'undefined') {
      payload.logo = data.logo.trim();
    }
    
    // ID fields - only include if valid UUID-like string
    if (data.subscriptionPlanId && typeof data.subscriptionPlanId === 'string' && data.subscriptionPlanId.trim()) {
      payload.subscriptionPlanId = data.subscriptionPlanId.trim();
    }
    if (data.ownerId && typeof data.ownerId === 'string' && data.ownerId.trim()) {
      payload.ownerId = data.ownerId.trim();
    }

    // Extra discount
    if ((data as any).extraDiscount !== undefined && (data as any).extraDiscount !== null) {
      payload.extraDiscount = Number((data as any).extraDiscount);
    }

    console.debug('Creating gym with payload:', payload);
    const response = await api.post<ApiResponse<Gym>>('/admin/gyms', payload);
    console.debug('Create gym response:', response.data);
    return response.data.data;
  },

  async updateGym(id: string, data: Partial<Gym>): Promise<Gym> {
    // Clean up payload - only include non-empty, valid values
    const payload: Record<string, any> = {};
    
    // Name field
    if (data.name && typeof data.name === 'string' && data.name.trim()) {
      payload.name = data.name.trim();
    }
    
    // String fields - only include if non-empty string
    const stringFields = ['address1', 'address2', 'city', 'state', 'zipcode', 'mobileNo', 'phoneNo', 'email', 'gstRegNo', 'website', 'note', 'address', 'phone'];
    for (const field of stringFields) {
      const value = (data as any)[field];
      if (value && typeof value === 'string' && value.trim()) {
        payload[field] = value.trim();
      }
    }
    
    // Logo - only include if it's a valid non-empty string (filename)
    if (data.logo && typeof data.logo === 'string' && data.logo.trim() && data.logo !== 'null' && data.logo !== 'undefined') {
      payload.logo = data.logo.trim();
    }
    
    // ID fields - only include if valid UUID-like string
    if (data.subscriptionPlanId && typeof data.subscriptionPlanId === 'string' && data.subscriptionPlanId.trim()) {
      payload.subscriptionPlanId = data.subscriptionPlanId.trim();
    }
    if (data.ownerId && typeof data.ownerId === 'string' && data.ownerId.trim()) {
      payload.ownerId = data.ownerId.trim();
    }

    // Extra discount
    if ((data as any).extraDiscount !== undefined && (data as any).extraDiscount !== null) {
      payload.extraDiscount = Number((data as any).extraDiscount);
    }

    console.debug('Updating gym with payload:', payload);
    const response = await api.put<ApiResponse<Gym>>(`/admin/gyms/${id}`, payload);
    console.debug('Update gym response:', response.data);
    return response.data.data;
  },

  async uploadGymLogo(gymId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('gymLogo', file);
    console.debug('Uploading gym logo for gym:', gymId);
    const response = await api.post<ApiResponse<{ filename: string; url?: string; logo?: string }>>(`/admin/gyms/${gymId}/upload-logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.debug('Upload logo response:', response.data);
    // Return just the filename - the backend saves file to GymLogo folder and returns filename
    const data = response.data.data;
    // If backend returns filename or logo, use it; otherwise extract from url
    if (data.filename) {
      return data.filename;
    }
    if (data.logo) {
      return data.logo;
    }
    // Fallback: if backend returns full url, extract just the filename
    if (data.url) {
      const urlParts = data.url.split('/');
      return urlParts[urlParts.length - 1];
    }
    return '';
  },

  // Helper to get full logo URL from gymLogo field value
  getGymLogoUrl(gymLogo: string | undefined | null): string {
    if (!gymLogo) return '';
    // If already a full URL, return as is
    if (gymLogo.startsWith('http://') || gymLogo.startsWith('https://') || gymLogo.startsWith('data:')) {
      return gymLogo;
    }
    // Construct full URL: BACKEND_BASE_URL + gymLogo path
    // gymLogo from API contains the relative path (e.g., "/uploads/gym-logos/image.jpg")
    return `${BACKEND_BASE_URL}${gymLogo.startsWith('/') ? '' : '/'}${gymLogo}`;
  },

  async deleteGym(id: string): Promise<void> {
    await api.delete(`/admin/gyms/${id}`);
  },

  async toggleGymStatus(id: string): Promise<Gym> {
    console.debug('Toggle gym status:', id);
    const response = await api.patch<ApiResponse<Gym>>(`/admin/gyms/${id}/toggle-status`);
    return response.data.data;
  },

  async assignGymOwner(gymId: string, ownerId: string, password?: string): Promise<Gym> {
    const url = `/admin/gyms/${gymId}/assign-owner`;
    const payload: { ownerId: string; password?: string } = { ownerId };
    if (password) {
      payload.password = password;
    }
    console.debug('Assign gym owner - URL:', url, 'Payload:', { ...payload, password: payload.password ? '***' : undefined });
    try {
      const response = await api.patch<ApiResponse<Gym>>(url, payload);
      console.debug('Assign owner response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Assign owner error - Status:', error?.response?.status, 'Data:', error?.response?.data);
      throw error;
    }
  },

  // Gym Owners
  async getGymOwners(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/admin/gym-owners');
    console.debug('Gym owners response:', response.data);
    // Handle both array response and object with items property
    const data = response.data.data;
    let owners: User[] = [];
    
    if (Array.isArray(data)) {
      owners = data;
    } else if (data && typeof data === 'object' && 'items' in data) {
      owners = (data as any).items;
    }
    
    // Map the response to ensure ownedGym has the correct structure and name is populated
    return owners.map((owner: any) => ({
      ...owner,
      // Map firstName/lastName to name if name is not present
      name: owner.name || `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email,
      // Handle different response formats: gymName, gym, or ownedGym
      ownedGym: owner.ownedGym || owner.gym || (owner.gymName ? { id: owner.gymId || '', name: owner.gymName } : null),
      gymName: owner.gymName, // Keep original gymName for direct access
    }));
  },

  async createGymOwner(data: { email: string; password: string; name: string; phone?: string }): Promise<User> {
    // Clean up data - remove empty optional fields
    const payload = {
      email: data.email.trim(),
      password: data.password,
      name: data.name.trim(),
      ...(data.phone && { phone: data.phone.trim() }),
    };
    console.debug('Creating gym owner with payload:', { ...payload, password: '***' });
    const response = await api.post<ApiResponse<User>>('/admin/gym-owners', payload);
    console.debug('Create gym owner response:', response.data);
    // Handle case where response.data is the user directly or nested in data property
    return response.data.data || response.data as unknown as User;
  },

  async updateGymOwner(id: string, data: { name?: string; email?: string; phone?: string; password?: string; firstName?: string; lastName?: string }): Promise<User> {
    // Clean up payload - remove empty/undefined values
    const payload: Record<string, any> = {};
    // Support both name and firstName/lastName
    if (data.name?.trim()) {
      const nameParts = data.name.trim().split(' ');
      payload.firstName = nameParts[0] || '';
      payload.lastName = nameParts.slice(1).join(' ') || '';
    }
    if (data.firstName?.trim()) payload.firstName = data.firstName.trim();
    if (data.lastName?.trim()) payload.lastName = data.lastName.trim();
    if (data.email?.trim()) payload.email = data.email.trim();
    if (data.phone?.trim()) payload.phone = data.phone.trim();
    if (data.password?.trim()) payload.password = data.password.trim();
    
    console.debug('Updating gym owner with payload:', { ...payload, password: payload.password ? '***' : undefined });
    const response = await api.put<ApiResponse<User>>(`/admin/gym-owners/${id}`, payload);
    console.debug('Update gym owner response:', response.data);
    return response.data.data || response.data as unknown as User;
  },

  async resetGymOwnerPassword(id: string): Promise<{ ownerId: string; email: string; temporaryPassword: string; message: string }> {
    const response = await api.post<ApiResponse<{ ownerId: string; email: string; temporaryPassword: string; message: string }>>(`/admin/gym-owners/${id}/reset-password`);
    console.debug('Reset gym owner password response:', response.data);
    return response.data.data;
  },

  async toggleUserStatus(id: string): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/admin/users/${id}/toggle-status`);
    return response.data.data;
  },

  // Occupation Master
  async getOccupations(): Promise<Occupation[]> {
    const response = await api.get<ApiResponse<Occupation[] | { items: Occupation[] }>>('/admin/occupations');
    console.debug('Occupations API response:', response.data);
    const data = response.data.data;

    // Handle different response structures
    let occupations: Occupation[] = [];

    if (Array.isArray(data)) {
      occupations = data;
    } else if (data && typeof data === 'object') {
      if ('items' in data) {
        occupations = (data as { items: Occupation[] }).items;
      } else if ('occupations' in data) {
        occupations = (data as { occupations: Occupation[] }).occupations;
      } else if ('data' in data) {
        occupations = (data as { data: Occupation[] }).data;
      }
    }

    console.debug('Parsed occupations:', occupations);
    return occupations;
  },

  async createOccupation(data: { occupationName: string; description?: string }): Promise<Occupation> {
    const response = await api.post<ApiResponse<Occupation>>('/admin/occupations', data);
    return response.data.data;
  },

  async updateOccupation(id: string, data: { occupationName?: string; description?: string; isActive?: boolean }): Promise<Occupation> {
    const response = await api.put<ApiResponse<Occupation>>(`/admin/occupations/${id}`, data);
    return response.data.data;
  },

  async deleteOccupation(id: string): Promise<Occupation> {
    const response = await api.delete<ApiResponse<Occupation>>(`/admin/occupations/${id}`);
    return response.data.data;
  },

  async getOccupationUsage(id: string): Promise<{ usageCount: number; canDelete: boolean }> {
    const response = await api.get<ApiResponse<{ usageCount: number; canDelete: boolean }>>(`/admin/occupations/${id}/usage`);
    return response.data.data;
  },

  // Enquiry Type Master
  async getEnquiryTypes(): Promise<EnquiryType[]> {
    const response = await api.get<ApiResponse<EnquiryType[] | { items: EnquiryType[] }>>('/admin/enquiry-types');
    console.debug('Enquiry Types API response:', response.data);
    const data = response.data.data;

    // Handle different response structures
    let enquiryTypes: EnquiryType[] = [];

    if (Array.isArray(data)) {
      enquiryTypes = data;
    } else if (data && typeof data === 'object') {
      if ('items' in data) {
        enquiryTypes = (data as { items: EnquiryType[] }).items;
      } else if ('enquiryTypes' in data) {
        enquiryTypes = (data as { enquiryTypes: EnquiryType[] }).enquiryTypes;
      } else if ('data' in data) {
        enquiryTypes = (data as { data: EnquiryType[] }).data;
      }
    }

    console.debug('Parsed enquiry types:', enquiryTypes);
    return enquiryTypes;
  },

  async createEnquiryType(data: { name: string }): Promise<EnquiryType> {
    const response = await api.post<ApiResponse<EnquiryType>>('/admin/enquiry-types', data);
    return response.data.data;
  },

  async updateEnquiryType(id: string, data: { name?: string; isActive?: boolean }): Promise<EnquiryType> {
    const response = await api.put<ApiResponse<EnquiryType>>(`/admin/enquiry-types/${id}`, data);
    return response.data.data;
  },

  async deleteEnquiryType(id: string): Promise<EnquiryType> {
    const response = await api.delete<ApiResponse<EnquiryType>>(`/admin/enquiry-types/${id}`);
    return response.data.data;
  },

  async getEnquiryTypeUsage(id: string): Promise<{ usageCount: number; canDelete: boolean }> {
    const response = await api.get<ApiResponse<{ usageCount: number; canDelete: boolean }>>(`/admin/enquiry-types/${id}/usage`);
    return response.data.data;
  },

  // Payment Type Master
  async getPaymentTypes(): Promise<PaymentType[]> {
    const response = await api.get<ApiResponse<PaymentType[] | { items: PaymentType[] }>>('/admin/payment-types');
    console.debug('Payment Types API response:', response.data);
    const data = response.data.data;

    let paymentTypes: PaymentType[] = [];

    if (Array.isArray(data)) {
      paymentTypes = data;
    } else if (data && typeof data === 'object') {
      if ('items' in data) {
        paymentTypes = (data as { items: PaymentType[] }).items;
      } else if ('paymentTypes' in data) {
        paymentTypes = (data as { paymentTypes: PaymentType[] }).paymentTypes;
      } else if ('data' in data) {
        paymentTypes = (data as { data: PaymentType[] }).data;
      }
    }

    console.debug('Parsed payment types:', paymentTypes);
    return paymentTypes;
  },

  async createPaymentType(data: { paymentTypeName: string; description?: string }): Promise<PaymentType> {
    const response = await api.post<ApiResponse<PaymentType>>('/admin/payment-types', data);
    return response.data.data;
  },

  async updatePaymentType(id: string, data: { paymentTypeName?: string; description?: string; isActive?: boolean }): Promise<PaymentType> {
    const response = await api.put<ApiResponse<PaymentType>>(`/admin/payment-types/${id}`, data);
    return response.data.data;
  },

  async deletePaymentType(id: string): Promise<PaymentType> {
    const response = await api.delete<ApiResponse<PaymentType>>(`/admin/payment-types/${id}`);
    return response.data.data;
  },

  async getPaymentTypeUsage(id: string): Promise<{ usageCount: number; canDelete: boolean; details: { subscriptions: number; settlements: number; expenses: number } }> {
    const response = await api.get<ApiResponse<{ usageCount: number; canDelete: boolean; details: { subscriptions: number; settlements: number; expenses: number } }>>(`/admin/payment-types/${id}/usage`);
    return response.data.data;
  },

  // =====================================================
  // Gym Subscription Management
  // =====================================================

  /**
   * Renew a gym's subscription - can be same plan (renewal) or different plan (upgrade/downgrade)
   * @param gymId - The gym ID to renew subscription for
   * @param data - Renewal request data including subscriptionPlanId, paymentMode, paidAmount, notes
   */
  async renewGymSubscription(gymId: string, data: RenewGymSubscriptionRequest & { extraDiscount?: number }): Promise<GymSubscriptionHistory> {
    console.debug('Renewing gym subscription:', { gymId, data });
    const response = await api.post<ApiResponse<GymSubscriptionHistory>>(`/admin/gyms/${gymId}/renew-subscription`, data);
    console.debug('Renew subscription response:', response.data);
    return response.data.data;
  },

  /**
   * Get subscription history for a specific gym
   * @param gymId - The gym ID to fetch history for
   * @param params - Query parameters for pagination, search, and filters
   */
  async getGymSubscriptionHistory(
    gymId: string, 
    params: GymSubscriptionHistoryParams = {}
  ): Promise<{ items: GymSubscriptionHistory[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const queryParams: Record<string, any> = {
      page: params.page || 1,
      limit: params.limit || 10,
    };
    
    if (params.search) queryParams.search = params.search;
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
    if (params.paymentStatus) queryParams.paymentStatus = params.paymentStatus;
    if (params.renewalType) queryParams.renewalType = params.renewalType;

    console.debug('Fetching gym subscription history:', { gymId, queryParams });
    const response = await api.get<ApiResponse<GymSubscriptionHistory[] | { items: GymSubscriptionHistory[]; pagination: any }>>(`/admin/gyms/${gymId}/subscription-history`, { params: queryParams });
    console.debug('Subscription history response:', response.data);
    
    const data = response.data.data;
    
    // Handle both array and paginated response formats
    if (Array.isArray(data)) {
      return {
        items: data,
        pagination: (response.data as any).pagination || { page: 1, limit: 10, total: data.length, totalPages: 1 }
      };
    }
    
    return {
      items: data.items || [],
      pagination: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
    };
  },

  /**
   * Get a single subscription history record by ID
   * @param id - The subscription history record ID
   */
  async getSubscriptionHistoryById(id: string): Promise<GymSubscriptionHistory> {
    console.debug('Fetching subscription history by ID:', id);
    const response = await api.get<ApiResponse<GymSubscriptionHistory>>(`/admin/subscription-history/${id}`);
    console.debug('Subscription history record:', response.data);
    return response.data.data;
  },

  // =====================================================
  // Gym Inquiries
  // =====================================================

  async getGymInquiries(params: GymInquiryParams = {}): Promise<{ items: GymInquiry[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const queryParams: Record<string, any> = {
      page: params.page || 1,
      limit: params.limit || 10,
    };
    if (params.search) queryParams.search = params.search;
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
    if (params.subscriptionPlanId) queryParams.subscriptionPlanId = params.subscriptionPlanId;
    if (params.isActive !== undefined) queryParams.isActive = String(params.isActive);

    const response = await api.get<ApiResponse<{ items: GymInquiry[]; pagination: any }>>('/admin/gym-inquiries', { params: queryParams });
    const data = response.data.data;
    if (Array.isArray(data)) {
      return {
        items: data as unknown as GymInquiry[],
        pagination: (response.data as any).pagination || { page: 1, limit: 10, total: (data as any).length, totalPages: 1 },
      };
    }
    return {
      items: data.items || [],
      pagination: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  async getGymInquiryById(id: string): Promise<GymInquiry> {
    const response = await api.get<ApiResponse<GymInquiry>>(`/admin/gym-inquiries/${id}`);
    return response.data.data;
  },

  async createGymInquiry(data: CreateGymInquiryRequest): Promise<GymInquiry> {
    const response = await api.post<ApiResponse<GymInquiry>>('/admin/gym-inquiries', data);
    return response.data.data;
  },

  async updateGymInquiry(id: string, data: Partial<CreateGymInquiryRequest>): Promise<GymInquiry> {
    const response = await api.put<ApiResponse<GymInquiry>>(`/admin/gym-inquiries/${id}`, data);
    return response.data.data;
  },

  async toggleGymInquiryStatus(id: string): Promise<GymInquiry> {
    const response = await api.patch<ApiResponse<GymInquiry>>(`/admin/gym-inquiries/${id}/toggle-status`);
    return response.data.data;
  },

  async getGymInquiryFollowups(id: string): Promise<GymInquiryFollowup[]> {
    const response = await api.get<ApiResponse<GymInquiryFollowup[]>>(`/admin/gym-inquiries/${id}/followups`);
    return response.data.data;
  },

  async createGymInquiryFollowup(id: string, data: { followupDate?: string; note?: string }): Promise<GymInquiryFollowup> {
    const response = await api.post<ApiResponse<GymInquiryFollowup>>(`/admin/gym-inquiries/${id}/followups`, data);
    return response.data.data;
  },

  // =====================================================
  // Members (for gym owner accordion report)
  // =====================================================

  /**
   * Get members with optional filters (for admin accordion report)
   * @param params - Query parameters including gymId for filtering by gym
   */
  async getMembers(params: {
    gymId?: string;
    page?: number;
    limit?: number;
    search?: string;
    membershipStatus?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  } = {}): Promise<{ items: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const queryParams: Record<string, any> = {
      page: params.page || 1,
      limit: params.limit || 100,
    };

    if (params.gymId) queryParams.gymId = params.gymId;
    if (params.search) queryParams.search = params.search;
    if (params.membershipStatus) queryParams.membershipStatus = params.membershipStatus;

    console.debug('Fetching members with params:', queryParams);
    const response = await api.get<ApiResponse<any>>('/admin/members', { params: queryParams });
    console.debug('Members response:', response.data);

    const data = response.data.data;

    // Handle both array and paginated response formats
    if (Array.isArray(data)) {
      return {
        items: data,
        pagination: (response.data as any).pagination || { page: 1, limit: 100, total: data.length, totalPages: 1 }
      };
    }

    return {
      items: data.items || data.members || [],
      pagination: data.pagination || { page: 1, limit: 100, total: 0, totalPages: 1 }
    };
  },
};
