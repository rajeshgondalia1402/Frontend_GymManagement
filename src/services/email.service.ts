/**
 * Email Service
 * 
 * Centralized service for sending emails via the backend API.
 * All email sending should go through this service.
 * 
 * The backend is expected to have an endpoint:
 *   POST /api/v1/admin/send-email
 *   Body: { to: string; subject: string; html: string }
 * 
 * The backend should handle SMTP configuration (logikshubsolution.com).
 */

import api from './api';
import type { ApiResponse } from '@/types';

export interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  message?: string;
}

export const emailService = {
  /**
   * Send an email through the backend mail service
   * @param data - Email payload with to, subject, and html body
   */
  async sendEmail(data: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      const response = await api.post<ApiResponse<SendEmailResponse>>('/admin/send-email', data);
      return response.data.data;
    } catch (error: any) {
      console.error('[EmailService] Failed to send email:', error?.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Send multiple emails (batch)
   * @param emails - Array of email payloads
   */
  async sendBulkEmails(emails: SendEmailRequest[]): Promise<{ sent: number; failed: number; errors?: string[] }> {
    try {
      const response = await api.post<ApiResponse<{ sent: number; failed: number; errors?: string[] }>>('/admin/send-bulk-emails', { emails });
      return response.data.data;
    } catch (error: any) {
      console.error('[EmailService] Failed to send bulk emails:', error?.response?.data || error.message);
      throw error;
    }
  },
};

export default emailService;
