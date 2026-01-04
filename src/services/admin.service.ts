import api, { BACKEND_BASE_URL } from './api';
import type { 
  ApiResponse, 
  AdminDashboard, 
  Gym, 
  GymSubscriptionPlan,
  User,
  Occupation,
  EnquiryType,
  PaymentType
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
  async getGyms(page = 1, limit = 100, search = ''): Promise<{ items: Gym[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const params: Record<string, any> = { page, limit };
    if (search && search.trim()) {
      params.search = search.trim();
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

  async assignGymOwner(gymId: string, ownerId: string): Promise<Gym> {
    const url = `/admin/gyms/${gymId}/assign-owner`;
    const payload = { ownerId };
    console.debug('Assign gym owner - URL:', url, 'Payload:', payload);
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
    
    // Map the response to ensure ownedGym has the correct structure
    return owners.map((owner: any) => ({
      ...owner,
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

  async updateGymOwner(id: string, data: { name?: string; email?: string; phone?: string }): Promise<User> {
    // Clean up payload - remove empty/undefined values
    const payload: Record<string, any> = {};
    if (data.name?.trim()) payload.name = data.name.trim();
    if (data.email?.trim()) payload.email = data.email.trim();
    if (data.phone?.trim()) payload.phone = data.phone.trim();
    
    console.debug('Updating gym owner with payload:', payload);
    const response = await api.put<ApiResponse<User>>(`/admin/gym-owners/${id}`, payload);
    console.debug('Update gym owner response:', response.data);
    return response.data.data || response.data as unknown as User;
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
};
