/**
 * WhatsApp Direct Message Utility
 * Uses WhatsApp's public wa.me link method (no third-party API required)
 */

// Message template types
export type WhatsAppTemplateType =
  | 'EXPIRY_REMINDER'
  | 'PAYMENT_REMINDER'
  | 'OFFER_PROMOTION'
  | 'WELCOME_MESSAGE'
  | 'BIRTHDAY_WISH'
  | 'INACTIVE_MEMBER'
  | 'EXPIRED_MEMBER'
  | 'EXPIRING_MEMBER'
  | 'FOLLOW_UP_INQUIRY'
  | 'PT_EXPIRING'
  | 'TODAY_RENEWAL'
  | 'TRAINER_GREETING'
  | 'GYM_INQUIRY_FOLLOWUP'
  | 'GYM_SUBSCRIPTION_EXPIRED'
  | 'GYM_SUBSCRIPTION_EXPIRING'
  | 'CUSTOM';

// Template configuration interface
export interface WhatsAppTemplate {
  id: WhatsAppTemplateType;
  name: string;
  message: string;
}

// Available message templates
export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'EXPIRY_REMINDER',
    name: 'Membership Expiry Reminder',
    message: `Hi {memberName},

Your membership at {gymName} is expiring on {expiryDate}.

Please renew your membership to continue enjoying our facilities and services.

Thank you!
{gymName} Team`,
  },
  {
    id: 'PAYMENT_REMINDER',
    name: 'Payment Reminder',
    message: `Hi {memberName},

This is a friendly reminder regarding your pending payment at {gymName}.

Please clear your dues at the earliest convenience.

For any queries, feel free to contact us.

Thank you!
{gymName} Team`,
  },
  {
    id: 'OFFER_PROMOTION',
    name: 'Special Offer',
    message: `Hi {memberName},

Great news from {gymName}!

We have an exciting offer for you. Visit us today to know more about our special membership deals.

Limited time offer - Don't miss out!

{gymName} Team`,
  },
  {
    id: 'WELCOME_MESSAGE',
    name: 'Welcome Message',
    message: `Hi {memberName},

Welcome to {gymName}!

We're thrilled to have you as part of our fitness family. Your membership is active until {expiryDate}.

Feel free to reach out if you have any questions.

Let's achieve your fitness goals together!

{gymName} Team`,
  },
  {
    id: 'BIRTHDAY_WISH',
    name: 'Birthday Wish',
    message: `Hi {memberName},

Wishing you a very Happy Birthday from all of us at {gymName}!

May this year bring you health, happiness, and success in all your fitness goals.

Visit us for a special birthday surprise!

{gymName} Team`,
  },
  {
    id: 'INACTIVE_MEMBER',
    name: 'Inactive Member Invitation',
    message: `Hi {memberName},

We miss you at {gymName}!

It's been a while since we've seen you, and we'd love to welcome you back. Your fitness journey doesn't have to wait any longer!

We have exciting membership plans to help you get started again. Visit us today to explore our offers and reignite your fitness goals.

Looking forward to seeing you soon!

{gymName} Team`,
  },
  {
    id: 'EXPIRED_MEMBER',
    name: 'Expired Membership',
    message: `Hi {memberName},

Your membership at {gymName} has expired on {expiryDate}.

Don't let your fitness progress stop! Renew your membership today and continue your journey towards a healthier lifestyle.

We have special renewal offers waiting for you. Visit us or contact us to learn more.

Stay fit, stay healthy!

{gymName} Team`,
  },
  {
    id: 'EXPIRING_MEMBER',
    name: 'Membership Expiring Soon',
    message: `Hi {memberName},

This is a friendly reminder that your membership at {gymName} will be expiring on {expiryDate}.

To ensure uninterrupted access to our facilities and services, please renew your membership before the expiry date.

Visit us today for hassle-free renewal!

Thank you for being a valued member.

{gymName} Team`,
  },
  {
    id: 'FOLLOW_UP_INQUIRY',
    name: 'Follow-up Inquiry',
    message: `Hi {memberName},

Thank you for showing interest in {gymName}!

We wanted to follow up on your recent inquiry. Our team is here to help you start your fitness journey with the right guidance and support.

Would you like to schedule a gym tour or discuss our membership plans? Feel free to reply to this message or visit us at your convenience.

We look forward to welcoming you to our fitness family!

{gymName} Team`,
  },
  {
    id: 'PT_EXPIRING',
    name: 'PT Membership Expiring',
    message: `Hi {memberName},

Your Personal Training (PT) membership at {gymName} is expiring on {expiryDate}.

To continue receiving personalized training sessions with our expert trainers, please renew your PT membership before the expiry date.

Don't miss out on achieving your fitness goals with dedicated guidance!

Contact us today for renewal options.

{gymName} Team`,
  },
  {
    id: 'TODAY_RENEWAL',
    name: 'Today\'s Renewal Reminder',
    message: `Hi {memberName},

Your membership at {gymName} expires TODAY ({expiryDate}).

To avoid any interruption in your fitness routine, please visit us today to renew your membership.

We value you as a member and look forward to continuing this fitness journey together!

{gymName} Team`,
  },
  {
    id: 'TRAINER_GREETING',
    name: 'Trainer Greeting',
    message: `Hello {memberName}`,
  },
  {
    id: 'GYM_INQUIRY_FOLLOWUP',
    name: 'Gym Inquiry Follow-up',
    message: `Hello {gymName},

Thank you for your interest in our Gym Management Application!

We're excited to offer you our *{planName}* plan:

*Plan Details:*
- Plan Name: {planName}
- Duration: {planDuration} months
- Price: ₹{planPrice}

*Key Features:*
- Complete Member Management
- Attendance Tracking
- Payment & Invoice Management
- Trainer & PT Management
- Reports & Analytics
- Mobile App Access

Start managing your gym professionally and grow your business with our easy-to-use platform.

Ready to get started? Register now and take your gym to the next level!

For any questions, feel free to reach out.

Best Regards,
Gym Management Team`,
  },
  {
    id: 'GYM_SUBSCRIPTION_EXPIRED',
    name: 'Gym Subscription Expired',
    message: `Hello {gymName},

This is to inform you that your Gym Management Application subscription has *EXPIRED*.

*Subscription Details:*
- Plan Name: {planName}
- Plan Amount: ₹{planPrice}
- Amount Paid: ₹{amountPaid}
- Expired On: {expiryDate}

Your access to the gym management features has been suspended. To continue using our application and managing your gym efficiently, please renew your subscription at the earliest.

*Benefits of Renewal:*
- Uninterrupted access to all features
- Member data remains safe and secure
- Continue tracking attendance and payments
- Access to reports and analytics

Please contact us to renew your subscription and get back to managing your gym seamlessly.

Best Regards,
Gym Management Team`,
  },
  {
    id: 'GYM_SUBSCRIPTION_EXPIRING',
    name: 'Gym Subscription Expiring',
    message: `Hello {gymName},

Your Gym Management Application subscription is *expiring soon* on *{expiryDate}*.

*Current Plan:* {planName}
*Plan Amount:* ₹{planPrice}

Please renew your subscription to continue using our gym management services without any interruption.

Contact us for renewal.

Thank you,
Gym Management Team`,
  },
];

// Interface for message data
export interface WhatsAppMessageData {
  memberName: string;
  memberPhone: string;
  gymName: string;
  expiryDate?: string;
  customMessage?: string;
  // For gym inquiry follow-up
  planName?: string;
  planDuration?: string;
  planPrice?: string;
  discountText?: string;
  // For gym subscription
  amountPaid?: string;
}

/**
 * Formats a phone number for WhatsApp
 * - Removes all non-digit characters
 * - Adds India country code (91) if not present
 * - Returns null if phone number is invalid
 */
export function formatPhoneForWhatsApp(phone: string | undefined | null): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  let cleanedPhone = phone.replace(/\D/g, '');

  // Handle empty result
  if (!cleanedPhone) return null;

  // If starts with 0, remove it (local format)
  if (cleanedPhone.startsWith('0')) {
    cleanedPhone = cleanedPhone.substring(1);
  }

  // If already has country code (91 for India and 10 digits after)
  if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) {
    return cleanedPhone;
  }

  // If it's a 10-digit Indian number, add country code
  if (cleanedPhone.length === 10) {
    return `91${cleanedPhone}`;
  }

  // If it has more than 10 digits but doesn't start with 91
  // Assume it might have some other prefix, take last 10 digits and add 91
  if (cleanedPhone.length > 10 && !cleanedPhone.startsWith('91')) {
    const last10 = cleanedPhone.slice(-10);
    return `91${last10}`;
  }

  // If already has country code with + or spaces
  if (cleanedPhone.length >= 11) {
    return cleanedPhone;
  }

  // Invalid phone number
  return null;
}

/**
 * Replaces template placeholders with actual values
 */
export function replaceTemplatePlaceholders(
  template: string,
  data: WhatsAppMessageData
): string {
  let message = template;

  // Replace all placeholders
  message = message.replace(/{memberName}/g, data.memberName || 'Member');
  message = message.replace(/{gymName}/g, data.gymName || 'Our Gym');
  message = message.replace(/{expiryDate}/g, data.expiryDate || 'N/A');

  // For gym inquiry follow-up
  message = message.replace(/{planName}/g, data.planName || 'N/A');
  message = message.replace(/{planDuration}/g, data.planDuration || 'N/A');
  message = message.replace(/{planPrice}/g, data.planPrice || 'N/A');
  message = message.replace(/{discountText}/g, data.discountText || '');

  // For gym subscription
  message = message.replace(/{amountPaid}/g, data.amountPaid || 'N/A');

  return message;
}

/**
 * Generates a WhatsApp URL with pre-filled message
 */
export function generateWhatsAppUrl(
  phone: string | undefined | null,
  message: string
): string | null {
  const formattedPhone = formatPhoneForWhatsApp(phone);

  if (!formattedPhone) {
    return null;
  }

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);

  // Generate wa.me URL
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Opens WhatsApp with pre-filled message
 * Works on both desktop (WhatsApp Web) and mobile (WhatsApp App)
 */
export function openWhatsApp(
  phone: string | undefined | null,
  message: string
): { success: boolean; error?: string } {
  const url = generateWhatsAppUrl(phone, message);

  if (!url) {
    return {
      success: false,
      error: 'Invalid or missing phone number. Please ensure the member has a valid phone number.',
    };
  }

  // Open in new tab/window
  window.open(url, '_blank', 'noopener,noreferrer');

  return { success: true };
}

/**
 * Sends WhatsApp message using a template
 */
export function sendWhatsAppFromTemplate(
  templateId: WhatsAppTemplateType,
  data: WhatsAppMessageData
): { success: boolean; error?: string } {
  // Find the template
  const template = WHATSAPP_TEMPLATES.find((t) => t.id === templateId);

  if (!template) {
    return {
      success: false,
      error: 'Template not found',
    };
  }

  // Replace placeholders
  const message = replaceTemplatePlaceholders(template.message, data);

  // Open WhatsApp
  return openWhatsApp(data.memberPhone, message);
}

/**
 * Sends a custom WhatsApp message
 */
export function sendCustomWhatsAppMessage(
  phone: string | undefined | null,
  message: string
): { success: boolean; error?: string } {
  return openWhatsApp(phone, message);
}

/**
 * Gets template by ID
 */
export function getTemplateById(templateId: WhatsAppTemplateType): WhatsAppTemplate | undefined {
  return WHATSAPP_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Validates if a phone number can be used for WhatsApp
 */
export function isValidWhatsAppNumber(phone: string | undefined | null): boolean {
  return formatPhoneForWhatsApp(phone) !== null;
}
