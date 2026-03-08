/**
 * Email Template System
 * 
 * Scalable, centralized email template system for Gym Desk Pro.
 * All email templates should be registered here.
 * Company: Logikshub Solution - Gym Desk Pro
 * Domain: logikshubsolution.com
 */

// =====================================================
// Template Types & Interfaces
// =====================================================

export type EmailTemplateType =
  | 'GYM_INQUIRY'
  | 'GYM_WELCOME'
  | 'GYM_OWNER_CREDENTIALS'
  | 'NEW_MEMBER_CREDENTIALS'
  | 'SUBSCRIPTION_RENEWAL'
  | 'SUBSCRIPTION_EXPIRY'
  | 'PAYMENT_RECEIPT'
  | 'FOLLOWUP_REMINDER'
  | 'CUSTOM';

export interface EmailTemplateConfig {
  id: EmailTemplateType;
  name: string;
  subject: string;
  description: string;
}

export interface EmailTemplatePlaceholders {
  [key: string]: string | number | undefined;
}

// =====================================================
// Company Branding Constants
// =====================================================

const COMPANY = {
  name: 'Logikshub Solution',
  product: 'Gym Desk Pro',
  fullName: 'Logikshub Solution - Gym Desk Pro',
  domain: 'logikshubsolution.com',
  email: 'support@logikshubsolution.com',
  website: 'https://logikshubsolution.com',
  tagline: 'Smart Gym Management, Simplified.',
  primaryColor: '#6366F1',   // Indigo-500
  secondaryColor: '#8B5CF6', // Violet-500
  accentColor: '#EC4899',    // Pink-500
  darkBg: '#1E1B4B',         // Indigo-950
  lightBg: '#F5F3FF',        // Violet-50
};

// =====================================================
// Shared Email Layout Components (HTML)
// =====================================================

const emailHeader = () => `
  <div style="background: linear-gradient(135deg, ${COMPANY.primaryColor} 0%, ${COMPANY.secondaryColor} 50%, ${COMPANY.accentColor} 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <div style="display: inline-block; background: rgba(255,255,255,0.15); border-radius: 16px; padding: 12px 24px; margin-bottom: 16px;">
      <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; font-family: 'Segoe UI', Arial, sans-serif;">
        🏋️ ${COMPANY.product}
      </h1>
    </div>
    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
      by ${COMPANY.name}
    </p>
  </div>
`;

const emailFooter = () => `
  <div style="background: ${COMPANY.darkBg}; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 8px; color: rgba(255,255,255,0.7); font-size: 13px; font-family: 'Segoe UI', Arial, sans-serif;">
      Powered by <strong style="color: #FFFFFF;">${COMPANY.fullName}</strong>
    </p>
    <p style="margin: 0 0 8px; color: rgba(255,255,255,0.5); font-size: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
      ${COMPANY.tagline}
    </p>
    <div style="margin: 16px 0 12px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
      <a href="https://${COMPANY.domain}" style="color: ${COMPANY.primaryColor}; text-decoration: none; font-size: 13px; font-weight: 600; background: rgba(99,102,241,0.15); padding: 6px 16px; border-radius: 20px;">
        🌐 ${COMPANY.domain}
      </a>
    </div>
    <p style="margin: 12px 0 0; color: rgba(255,255,255,0.35); font-size: 11px; font-family: 'Segoe UI', Arial, sans-serif;">
      © ${new Date().getFullYear()} ${COMPANY.name}. All rights reserved.
    </p>
  </div>
`;

const emailWrapper = (bodyContent: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${COMPANY.product}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td>
              ${emailHeader()}
            </td>
          </tr>
          <tr>
            <td style="padding: 0;">
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td>
              ${emailFooter()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// =====================================================
// Info Row Helper
// =====================================================

const infoRow = (icon: string, label: string, value: string) => `
  <tr>
    <td style="padding: 10px 16px; border-bottom: 1px solid #F1F5F9; width: 40%;">
      <span style="font-size: 16px; margin-right: 8px;">${icon}</span>
      <span style="color: #64748B; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${label}</span>
    </td>
    <td style="padding: 10px 16px; border-bottom: 1px solid #F1F5F9; color: #1E293B; font-size: 14px; font-weight: 500;">
      ${value}
    </td>
  </tr>
`;

// =====================================================
// GYM INQUIRY Email Template
// =====================================================

export interface GymInquiryEmailData {
  gymName: string;
  mobileNo: string;
  email?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  planName?: string;
  planPrice?: string | number;
  planDuration?: string | number;
  enquiryType?: string;
  memberSize?: string | number;
  sellerName?: string;
  sellerMobileNo?: string;
  nextFollowupDate?: string;
  note?: string;
  inquiryDate?: string;
}

const generateGymInquiryBody = (data: GymInquiryEmailData): string => {
  const inquiryDate = data.inquiryDate || new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // Build address string
  const addressParts = [data.address1, data.address2, data.city, data.state].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Not provided';

  const bodyContent = `
    <!-- Greeting Banner -->
    <div style="padding: 30px 30px 20px; text-align: center;">
      <div style="display: inline-block; background: linear-gradient(135deg, #EEF2FF, #F5F3FF); border-radius: 12px; padding: 20px 30px; border: 1px solid #E0E7FF;">
        <h2 style="margin: 0 0 6px; color: ${COMPANY.darkBg}; font-size: 22px; font-weight: 700;">
          New Gym Inquiry Received! 🎉
        </h2>
        <p style="margin: 0; color: #6366F1; font-size: 14px; font-weight: 500;">
          Inquiry Date: ${inquiryDate}
        </p>
      </div>
    </div>

    <!-- Welcome Message -->
    <div style="padding: 0 30px 20px;">
      <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Dear <strong style="color: ${COMPANY.darkBg};">${data.gymName}</strong>,
      </p>
      <p style="margin: 10px 0 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Thank you for showing interest in <strong>${COMPANY.product}</strong>! We are excited to help you streamline and grow your gym business. Below are the details of your inquiry:
      </p>
    </div>

    <!-- Gym Details Section -->
    <div style="padding: 0 30px 20px;">
      <div style="background: #FAFAFA; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden;">
        <div style="background: linear-gradient(90deg, ${COMPANY.primaryColor}, ${COMPANY.secondaryColor}); padding: 12px 16px;">
          <h3 style="margin: 0; color: #FFFFFF; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">
            📋 INQUIRY DETAILS
          </h3>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('🏢', 'Gym Name', data.gymName)}
          ${infoRow('📞', 'Mobile No', data.mobileNo)}
          ${data.email ? infoRow('📧', 'Email', data.email) : ''}
          ${infoRow('📍', 'Address', fullAddress)}
          ${data.memberSize ? infoRow('👥', 'Member Size', String(data.memberSize)) : ''}
          ${data.enquiryType ? infoRow('📝', 'Enquiry Type', data.enquiryType) : ''}
        </table>
      </div>
    </div>

    <!-- Subscription Plan Section -->
    ${data.planName ? `
    <div style="padding: 0 30px 20px;">
      <div style="background: linear-gradient(135deg, #FFF7ED, #FFFBEB); border-radius: 10px; border: 1px solid #FED7AA; overflow: hidden;">
        <div style="background: linear-gradient(90deg, #F59E0B, #EF4444); padding: 12px 16px;">
          <h3 style="margin: 0; color: #FFFFFF; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">
            💎 SUBSCRIPTION PLAN
          </h3>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('📦', 'Plan', data.planName)}
          ${data.planPrice ? infoRow('💰', 'Price', `₹${Number(data.planPrice).toLocaleString('en-IN')}`) : ''}
          ${data.planDuration ? infoRow('📅', 'Duration', `${data.planDuration} days`) : ''}
        </table>
      </div>
    </div>
    ` : ''}

    <!-- Seller Info Section -->
    ${data.sellerName ? `
    <div style="padding: 0 30px 20px;">
      <div style="background: #F0FDF4; border-radius: 10px; border: 1px solid #BBF7D0; overflow: hidden;">
        <div style="background: linear-gradient(90deg, #22C55E, #16A34A); padding: 12px 16px;">
          <h3 style="margin: 0; color: #FFFFFF; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">
            🤝 SALES REPRESENTATIVE
          </h3>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('👤', 'Seller Name', data.sellerName)}
          ${data.sellerMobileNo ? infoRow('📱', 'Seller Mobile', data.sellerMobileNo) : ''}
        </table>
      </div>
    </div>
    ` : ''}

    <!-- Follow-up Date -->
    ${data.nextFollowupDate ? `
    <div style="padding: 0 30px 20px;">
      <div style="background: linear-gradient(135deg, #EEF2FF, #E0E7FF); border: 2px dashed ${COMPANY.primaryColor}; border-radius: 10px; padding: 16px 20px; text-align: center;">
        <p style="margin: 0; color: ${COMPANY.primaryColor}; font-size: 14px; font-weight: 700;">
          📅 Next Follow-up Date: <span style="color: ${COMPANY.darkBg}; font-size: 16px;">${data.nextFollowupDate}</span>
        </p>
      </div>
    </div>
    ` : ''}

    <!-- Note Section -->
    ${data.note ? `
    <div style="padding: 0 30px 20px;">
      <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 0 8px 8px 0; padding: 14px 18px;">
        <p style="margin: 0 0 4px; color: #92400E; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📌 Note</p>
        <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.5;">${data.note}</p>
      </div>
    </div>
    ` : ''}

    <!-- What's Next Section -->
    <div style="padding: 0 30px 20px;">
      <div style="background: linear-gradient(135deg, #F0FDF4, #ECFDF5); border-radius: 10px; border: 1px solid #BBF7D0; padding: 20px;">
        <h3 style="margin: 0 0 12px; color: #166534; font-size: 16px; font-weight: 700;">
          ✅ What Happens Next?
        </h3>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 6px 0; color: #15803D; font-size: 14px;">
              <span style="display: inline-block; background: #22C55E; color: white; width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px; font-size: 12px; font-weight: 700; margin-right: 10px;">1</span>
              Our team will review your inquiry details
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #15803D; font-size: 14px;">
              <span style="display: inline-block; background: #22C55E; color: white; width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px; font-size: 12px; font-weight: 700; margin-right: 10px;">2</span>
              You'll receive a personalized demo of ${COMPANY.product}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #15803D; font-size: 14px;">
              <span style="display: inline-block; background: #22C55E; color: white; width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px; font-size: 12px; font-weight: 700; margin-right: 10px;">3</span>
              Get started with the best gym management solution!
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- CTA Button -->
    <div style="padding: 0 30px 30px; text-align: center;">
      <a href="https://${COMPANY.domain}" style="display: inline-block; background: linear-gradient(135deg, ${COMPANY.primaryColor}, ${COMPANY.secondaryColor}); color: #FFFFFF; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(99,102,241,0.4);">
        🌐 Visit ${COMPANY.product}
      </a>
      <p style="margin: 12px 0 0; color: #94A3B8; font-size: 13px;">
        Have questions? Contact us at <a href="mailto:${COMPANY.email}" style="color: ${COMPANY.primaryColor}; text-decoration: none; font-weight: 600;">${COMPANY.email}</a>
      </p>
    </div>
  `;

  return emailWrapper(bodyContent);
};

// =====================================================
// GYM WELCOME Email Template
// =====================================================

export interface GymWelcomeEmailData {
  gymName: string;
  ownerName?: string;
  email: string;
  mobileNo?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  planName?: string;
  planPrice?: string | number;
  planDuration?: string | number;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  website?: string;
  gstRegNo?: string;
}

const generateGymWelcomeBody = (data: GymWelcomeEmailData): string => {
  const registrationDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const addressParts = [data.address1, data.address2, data.city, data.state, data.zipcode].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Not provided';

  const bodyContent = `
    <!-- Welcome Banner -->
    <div style="padding: 30px 30px 20px; text-align: center;">
      <div style="display: inline-block; background: linear-gradient(135deg, #ECFDF5, #F0FDF4); border-radius: 16px; padding: 24px 36px; border: 1px solid #A7F3D0;">
        <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
        <h2 style="margin: 0 0 6px; color: ${COMPANY.darkBg}; font-size: 24px; font-weight: 800;">
          Welcome to ${COMPANY.product}!
        </h2>
        <p style="margin: 0; color: #059669; font-size: 14px; font-weight: 600;">
          Your gym has been successfully registered
        </p>
      </div>
    </div>

    <!-- Greeting -->
    <div style="padding: 0 30px 20px;">
      <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Dear <strong style="color: ${COMPANY.darkBg};">${data.gymName}</strong>,
      </p>
      <p style="margin: 10px 0 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Congratulations! Your gym has been registered with <strong>${COMPANY.product}</strong> on <strong>${registrationDate}</strong>. We are thrilled to have you onboard. Below are your registration details:
      </p>
    </div>

    <!-- Gym Registration Details -->
    <div style="padding: 0 30px 20px;">
      <div style="background: #FAFAFA; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden;">
        <div style="background: linear-gradient(90deg, ${COMPANY.primaryColor}, ${COMPANY.secondaryColor}); padding: 12px 16px;">
          <h3 style="margin: 0; color: #FFFFFF; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">
            🏢 GYM REGISTRATION DETAILS
          </h3>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('🏋️', 'Gym Name', data.gymName)}
          ${infoRow('📧', 'Email', data.email)}
          ${data.mobileNo ? infoRow('📞', 'Mobile No', data.mobileNo) : ''}
          ${infoRow('📍', 'Address', fullAddress)}
          ${data.gstRegNo ? infoRow('📄', 'GST Reg No', data.gstRegNo) : ''}
          ${data.website ? infoRow('🌐', 'Website', data.website) : ''}
        </table>
      </div>
    </div>

    <!-- Subscription Plan Section -->
    ${data.planName ? `
    <div style="padding: 0 30px 20px;">
      <div style="background: linear-gradient(135deg, #FFF7ED, #FFFBEB); border-radius: 10px; border: 1px solid #FED7AA; overflow: hidden;">
        <div style="background: linear-gradient(90deg, #F59E0B, #EF4444); padding: 12px 16px;">
          <h3 style="margin: 0; color: #FFFFFF; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">
            💎 YOUR SUBSCRIPTION PLAN
          </h3>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('📦', 'Plan', data.planName)}
          ${data.planPrice ? infoRow('💰', 'Price', `₹${Number(data.planPrice).toLocaleString('en-IN')}`) : ''}
          ${data.planDuration ? infoRow('📅', 'Duration', `${data.planDuration} days`) : ''}
          ${data.subscriptionStart ? infoRow('🟢', 'Start Date', data.subscriptionStart) : ''}
          ${data.subscriptionEnd ? infoRow('🔴', 'End Date', data.subscriptionEnd) : ''}
        </table>
      </div>
    </div>
    ` : ''}

    <!-- Getting Started Section -->
    <div style="padding: 0 30px 20px;">
      <div style="background: linear-gradient(135deg, #EEF2FF, #F5F3FF); border-radius: 10px; border: 1px solid #C7D2FE; padding: 20px;">
        <h3 style="margin: 0 0 14px; color: ${COMPANY.darkBg}; font-size: 16px; font-weight: 700;">
          🚀 Getting Started
        </h3>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; color: #4338CA; font-size: 14px;">
              <span style="display: inline-block; background: ${COMPANY.primaryColor}; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 10px;">1</span>
              <strong>Log in</strong> to your Gym Desk Pro dashboard with your credentials
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4338CA; font-size: 14px;">
              <span style="display: inline-block; background: ${COMPANY.primaryColor}; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 10px;">2</span>
              <strong>Add your members</strong> and manage memberships effortlessly
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4338CA; font-size: 14px;">
              <span style="display: inline-block; background: ${COMPANY.primaryColor}; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 10px;">3</span>
              <strong>Track attendance</strong>, payments, and gym performance in real-time
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4338CA; font-size: 14px;">
              <span style="display: inline-block; background: ${COMPANY.primaryColor}; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 10px;">4</span>
              <strong>Explore features</strong> like trainer management, expense tracking & more
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Key Features Highlights -->
    <div style="padding: 0 30px 20px;">
      <div style="background: #F0FDF4; border-radius: 10px; border: 1px solid #BBF7D0; padding: 20px;">
        <h3 style="margin: 0 0 14px; color: #166534; font-size: 16px; font-weight: 700;">
          ⭐ What You Get with ${COMPANY.product}
        </h3>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 5px 0; color: #15803D; font-size: 14px;">✅ Member & Membership Management</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #15803D; font-size: 14px;">✅ Attendance Tracking System</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #15803D; font-size: 14px;">✅ Trainer & PT Session Management</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #15803D; font-size: 14px;">✅ Payment & Expense Reports</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #15803D; font-size: 14px;">✅ WhatsApp Notifications</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #15803D; font-size: 14px;">✅ Professional Dashboard & Analytics</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- CTA -->
    <div style="padding: 0 30px 30px; text-align: center;">
      <a href="https://${COMPANY.domain}" style="display: inline-block; background: linear-gradient(135deg, ${COMPANY.primaryColor}, ${COMPANY.secondaryColor}); color: #FFFFFF; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(99,102,241,0.4);">
        🚀 Go to Dashboard
      </a>
      <p style="margin: 12px 0 0; color: #94A3B8; font-size: 13px;">
        Need help? Contact us at <a href="mailto:${COMPANY.email}" style="color: ${COMPANY.primaryColor}; text-decoration: none; font-weight: 600;">${COMPANY.email}</a>
      </p>
    </div>
  `;

  return emailWrapper(bodyContent);
};

// =====================================================
// GYM OWNER CREDENTIALS Email Template
// =====================================================

export interface GymOwnerCredentialsEmailData {
  gymName: string;
  ownerName?: string;
  email: string;
  password: string;
  planName?: string;
  subscriptionEnd?: string;
  loginUrl?: string;
}

const generateGymOwnerCredentialsBody = (data: GymOwnerCredentialsEmailData): string => {
  const loginUrl = data.loginUrl || 'https://gymdeskpro.in/gymlogin';
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const bodyContent = `
    <!-- Credentials Banner -->
    <div style="padding: 30px 30px 20px; text-align: center;">
      <div style="display: inline-block; background: linear-gradient(135deg, #EEF2FF, #F5F3FF); border-radius: 16px; padding: 24px 36px; border: 1px solid #C7D2FE;">
        <div style="font-size: 48px; margin-bottom: 8px;">🔐</div>
        <h2 style="margin: 0 0 6px; color: ${COMPANY.darkBg}; font-size: 24px; font-weight: 800;">
          Your Login Credentials
        </h2>
        <p style="margin: 0; color: #6366F1; font-size: 14px; font-weight: 600;">
          ${COMPANY.product} — Gym Account Ready!
        </p>
      </div>
    </div>

    <!-- Greeting -->
    <div style="padding: 0 30px 20px;">
      <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Dear <strong style="color: ${COMPANY.darkBg};">${data.ownerName || data.gymName}</strong>,
      </p>
      <p style="margin: 10px 0 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Your gym account on <strong>${COMPANY.product}</strong> has been created successfully on <strong>${generatedDate}</strong>.
        Below are your login credentials — please keep them safe and do not share them with anyone.
      </p>
    </div>

    <!-- Credentials Box -->
    <div style="padding: 0 30px 20px;">
      <div style="background: linear-gradient(135deg, #1E1B4B, #312E81); border-radius: 14px; padding: 28px 28px 24px; position: relative; overflow: hidden;">
        <!-- decorative circle -->
        <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
        <div style="position: absolute; bottom: -20px; left: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>

        <h3 style="margin: 0 0 20px; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
          🏋️ Gym: ${data.gymName}
        </h3>

        <!-- Username row -->
        <div style="background: rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 18px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.12);">
          <p style="margin: 0 0 4px; color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">📧 Username / Email</p>
          <p style="margin: 0; color: #A5F3FC; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">${data.email}</p>
        </div>

        <!-- Password row -->
        <div style="background: rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 18px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.12);">
          <p style="margin: 0 0 4px; color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">🔑 Password</p>
          <p style="margin: 0; color: #FDE68A; font-size: 18px; font-weight: 800; letter-spacing: 2px; font-family: 'Courier New', monospace;">${data.password}</p>
        </div>

        ${data.planName ? `
        <!-- Plan row -->
        <div style="background: rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 18px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.12);">
          <p style="margin: 0 0 4px; color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">💎 Plan</p>
          <p style="margin: 0; color: #C4B5FD; font-size: 15px; font-weight: 700;">${data.planName}</p>
        </div>
        ` : ''}

        ${data.subscriptionEnd ? `
        <!-- Expiry row -->
        <div style="background: rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 18px; border: 1px solid rgba(255,255,255,0.12);">
          <p style="margin: 0 0 4px; color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">📅 Subscription Valid Until</p>
          <p style="margin: 0; color: #6EE7B7; font-size: 15px; font-weight: 700;">${data.subscriptionEnd}</p>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Security Notice -->
    <div style="padding: 0 30px 20px;">
      <div style="background: #FFF7ED; border-left: 4px solid #F59E0B; border-radius: 0 8px 8px 0; padding: 14px 18px;">
        <p style="margin: 0 0 4px; color: #92400E; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">⚠️ Security Notice</p>
        <p style="margin: 0; color: #78350F; font-size: 13px; line-height: 1.6;">Please change your password after your first login. Do not share your credentials with anyone. If you did not request this account, contact us immediately at <a href="mailto:${COMPANY.email}" style="color: #D97706; font-weight: 600;">${COMPANY.email}</a>.</p>
      </div>
    </div>

    <!-- Steps to Login -->
    <div style="padding: 0 30px 20px;">
      <div style="background: linear-gradient(135deg, #F0FDF4, #ECFDF5); border-radius: 10px; border: 1px solid #BBF7D0; padding: 20px;">
        <h3 style="margin: 0 0 14px; color: #166534; font-size: 16px; font-weight: 700;">🚀 How to Login</h3>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; color: #15803D; font-size: 14px;">
              <span style="display: inline-block; background: #22C55E; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 10px;">1</span>
              Click the <strong>Login to Dashboard</strong> button below
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #15803D; font-size: 14px;">
              <span style="display: inline-block; background: #22C55E; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 10px;">2</span>
              Enter your <strong>email</strong> and <strong>password</strong> from above
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #15803D; font-size: 14px;">
              <span style="display: inline-block; background: #22C55E; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 10px;">3</span>
              <strong>Change your password</strong> from the profile settings for security
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #15803D; font-size: 14px;">
              <span style="display: inline-block; background: #22C55E; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 10px;">4</span>
              Start managing your gym with <strong>${COMPANY.product}</strong>!
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- CTA -->
    <div style="padding: 0 30px 30px; text-align: center;">
      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, ${COMPANY.primaryColor}, ${COMPANY.secondaryColor}); color: #FFFFFF; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(99,102,241,0.4);">
        🔐 Login to Dashboard
      </a>
      <p style="margin: 14px 0 0; color: #94A3B8; font-size: 13px;">
        Login URL: <a href="${loginUrl}" style="color: ${COMPANY.primaryColor}; text-decoration: none; font-weight: 600;">${loginUrl}</a>
      </p>
      <p style="margin: 8px 0 0; color: #94A3B8; font-size: 13px;">
        Need help? Contact us at <a href="mailto:${COMPANY.email}" style="color: ${COMPANY.primaryColor}; text-decoration: none; font-weight: 600;">${COMPANY.email}</a>
      </p>
    </div>
  `;

  return emailWrapper(bodyContent);
};

// =====================================================
// NEW MEMBER CREDENTIALS Email Template
// =====================================================

export interface NewMemberCredentialsEmailData {
  memberName: string;
  email: string;
  phone?: string;
  password: string;
  packageName?: string;
  packageFees?: string | number;
  membershipStartDate?: string;
  membershipEndDate?: string;
  gymName?: string;
}

const generateNewMemberCredentialsBody = (data: NewMemberCredentialsEmailData): string => {
  const loginUrl = 'https://gymdeskpro.in/login';
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const bodyContent = `
    <!-- Welcome Banner -->
    <div style="padding: 30px 30px 20px; text-align: center;">
      <div style="display: inline-block; background: linear-gradient(135deg, #ECFDF5, #F0FDF4); border-radius: 16px; padding: 24px 36px; border: 1px solid #A7F3D0;">
        <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
        <h2 style="margin: 0 0 6px; color: ${COMPANY.darkBg}; font-size: 24px; font-weight: 800;">
          Welcome to the Gym!
        </h2>
        <p style="margin: 0; color: #059669; font-size: 14px; font-weight: 600;">
          Your membership has been activated — Membership Date: ${generatedDate}
        </p>
      </div>
    </div>

    <!-- Greeting -->
    <div style="padding: 0 30px 20px;">
      <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Dear <strong style="color: ${COMPANY.darkBg};">${data.memberName}</strong>,
      </p>
      <p style="margin: 10px 0 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Congratulations! Your <strong>Regular Membership</strong> has been successfully created${data.gymName ? ` at <strong>${data.gymName}</strong>` : ''}.
        Below are your membership details and login credentials for the member portal.
      </p>
    </div>

    <!-- Credentials Box -->
    <div style="padding: 0 30px 20px;">
      <div style="background: linear-gradient(135deg, #1E1B4B, #312E81); border-radius: 14px; padding: 28px 28px 24px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
        <div style="position: absolute; bottom: -20px; left: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>

        <h3 style="margin: 0 0 20px; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
          🔐 Your Login Credentials
        </h3>

        <!-- Username row -->
        <div style="background: rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 18px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.12);">
          <p style="margin: 0 0 4px; color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">👤 Username</p>
          <p style="margin: 0; color: #A5F3FC; font-size: 14px; font-weight: 700; letter-spacing: 0.5px;">${data.email}${data.phone ? `&nbsp;&nbsp;/&nbsp;&nbsp;${data.phone}` : ''}</p>
        </div>

        <!-- Password row -->
        <div style="background: rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 18px; border: 1px solid rgba(255,255,255,0.12);">
          <p style="margin: 0 0 4px; color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">🔑 Password</p>
          <p style="margin: 0; color: #FDE68A; font-size: 18px; font-weight: 800; letter-spacing: 2px; font-family: 'Courier New', monospace;">${data.password}</p>
        </div>
      </div>
    </div>

    <!-- Membership Details -->
    <div style="padding: 0 30px 20px;">
      <div style="background: #FAFAFA; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden;">
        <div style="background: linear-gradient(90deg, ${COMPANY.primaryColor}, ${COMPANY.secondaryColor}); padding: 12px 16px;">
          <h3 style="margin: 0; color: #FFFFFF; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">
            🏋️ MEMBERSHIP DETAILS
          </h3>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('👤', 'Member Name', data.memberName)}
          ${infoRow('📧', 'Email', data.email)}
          ${data.phone ? infoRow('📞', 'Mobile No', data.phone) : ''}
          ${data.packageName ? infoRow('📦', 'Package', data.packageName) : ''}
          ${data.packageFees !== undefined ? infoRow('💰', 'Package Fees', `₹${Number(data.packageFees).toLocaleString('en-IN')}`) : ''}
          ${data.membershipStartDate ? infoRow('🟢', 'Start Date', data.membershipStartDate) : ''}
          ${data.membershipEndDate ? infoRow('🔴', 'Expiry Date', data.membershipEndDate) : ''}
        </table>
      </div>
    </div>

    ${data.membershipEndDate ? `
    <!-- Expiry Highlight -->
    <div style="padding: 0 30px 20px;">
      <div style="background: linear-gradient(135deg, #FFF7ED, #FFFBEB); border: 2px dashed #F59E0B; border-radius: 10px; padding: 16px 20px; text-align: center;">
        <p style="margin: 0; color: #92400E; font-size: 14px; font-weight: 700;">
          📅 Your membership is valid until: <span style="color: #B45309; font-size: 16px; font-weight: 800;">${data.membershipEndDate}</span>
        </p>
      </div>
    </div>
    ` : ''}

    <!-- Security Notice -->
    <div style="padding: 0 30px 20px;">
      <div style="background: #FFF7ED; border-left: 4px solid #F59E0B; border-radius: 0 8px 8px 0; padding: 14px 18px;">
        <p style="margin: 0 0 4px; color: #92400E; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">⚠️ Security Notice</p>
        <p style="margin: 0; color: #78350F; font-size: 13px; line-height: 1.6;">Please change your password after your first login. Do not share your credentials with anyone. If you have any questions, contact your gym.</p>
      </div>
    </div>

    <!-- CTA -->
    <div style="padding: 0 30px 30px; text-align: center;">
      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, ${COMPANY.primaryColor}, ${COMPANY.secondaryColor}); color: #FFFFFF; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(99,102,241,0.4);">
        🏋️ Access Member Portal
      </a>
      <p style="margin: 14px 0 0; color: #94A3B8; font-size: 13px;">
        Portal URL: <a href="${loginUrl}" style="color: ${COMPANY.primaryColor}; text-decoration: none; font-weight: 600;">${loginUrl}</a>
      </p>
      <p style="margin: 8px 0 0; color: #94A3B8; font-size: 13px;">
        Need help? Contact us at <a href="mailto:${COMPANY.email}" style="color: ${COMPANY.primaryColor}; text-decoration: none; font-weight: 600;">${COMPANY.email}</a>
      </p>
    </div>
  `;

  return emailWrapper(bodyContent);
};

// =====================================================
// Template Registry
// =====================================================


export const EMAIL_TEMPLATE_CONFIGS: EmailTemplateConfig[] = [
  {
    id: 'GYM_INQUIRY',
    name: 'Gym Inquiry Confirmation',
    subject: '🏋️ Welcome to Gym Desk Pro — Your Inquiry Has Been Received!',
    description: 'Sent when a new gym inquiry is created with an email address',
  },
  {
    id: 'GYM_WELCOME',
    name: 'Gym Welcome',
    subject: '🎉 Welcome to Gym Desk Pro!',
    description: 'Sent when a gym is onboarded successfully',
  },
  {
    id: 'GYM_OWNER_CREDENTIALS',
    name: 'Gym Owner Login Credentials',
    subject: '🔐 Your Gym Desk Pro Login Credentials — {gymName}',
    description: 'Sent when a gym owner account is created with their login credentials',
  },
  {
    id: 'NEW_MEMBER_CREDENTIALS',
    name: 'New Member Welcome & Credentials',
    subject: '🎉 Welcome! Your Gym Membership is Active — Login Details Inside',
    description: 'Sent when a new regular member is added with their membership and login details',
  },
  {
    id: 'SUBSCRIPTION_RENEWAL',
    name: 'Subscription Renewal',
    subject: '✅ Your Gym Desk Pro Subscription Has Been Renewed',
    description: 'Sent after successful subscription renewal',
  },
  {
    id: 'SUBSCRIPTION_EXPIRY',
    name: 'Subscription Expiry Reminder',
    subject: '⚠️ Your Gym Desk Pro Subscription Is Expiring Soon',
    description: 'Sent before subscription expiry',
  },
  {
    id: 'PAYMENT_RECEIPT',
    name: 'Payment Receipt',
    subject: '🧾 Payment Received — Gym Desk Pro',
    description: 'Sent after a payment is processed',
  },
  {
    id: 'FOLLOWUP_REMINDER',
    name: 'Followup Reminder',
    subject: '📅 Follow-up Reminder — Gym Desk Pro',
    description: 'Sent as a reminder for scheduled followups',
  },
];

// =====================================================
// Template Generator Functions Map
// =====================================================

type TemplateGenerator = (data: any) => string;

const templateGenerators: Record<string, TemplateGenerator> = {
  GYM_INQUIRY: generateGymInquiryBody,
  GYM_WELCOME: generateGymWelcomeBody,
  GYM_OWNER_CREDENTIALS: generateGymOwnerCredentialsBody,
  NEW_MEMBER_CREDENTIALS: generateNewMemberCredentialsBody,
  // Add more generators as templates are built:
  // SUBSCRIPTION_RENEWAL: generateSubscriptionRenewalBody,
  // etc.
};

// =====================================================
// Public API
// =====================================================

/**
 * Get template config by ID
 */
export function getEmailTemplateConfig(templateId: EmailTemplateType): EmailTemplateConfig | undefined {
  return EMAIL_TEMPLATE_CONFIGS.find((t) => t.id === templateId);
}

/**
 * Generate the full HTML email body for a given template
 */
export function generateEmailHtml(templateId: EmailTemplateType, data: any): string | null {
  const generator = templateGenerators[templateId];
  if (!generator) {
    console.warn(`[EmailTemplates] No generator found for template: ${templateId}`);
    return null;
  }
  return generator(data);
}

/**
 * Get the subject line for a template, with optional dynamic replacements
 */
export function getEmailSubject(templateId: EmailTemplateType, replacements?: Record<string, string>): string {
  const config = getEmailTemplateConfig(templateId);
  if (!config) return `Notification from ${COMPANY.fullName}`;

  let subject = config.subject;
  if (replacements) {
    Object.entries(replacements).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`{${key}}`, 'g'), value);
    });
  }
  return subject;
}

/**
 * Build a complete email payload ready to send
 */
export function buildEmailPayload(
  templateId: EmailTemplateType,
  recipientEmail: string,
  data: any,
  subjectReplacements?: Record<string, string>,
): { to: string; subject: string; html: string } | null {
  const html = generateEmailHtml(templateId, data);
  if (!html) return null;

  const subject = getEmailSubject(templateId, subjectReplacements);

  return {
    to: recipientEmail,
    subject,
    html,
  };
}
