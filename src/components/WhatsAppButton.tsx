import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { WhatsAppFilledIcon } from '@/components/ui/icons';
import {
  WHATSAPP_TEMPLATES,
  WhatsAppTemplateType,
  WhatsAppMessageData,
  replaceTemplatePlaceholders,
  openWhatsApp,
  isValidWhatsAppNumber,
  getTemplateById,
} from '@/utils/whatsapp';
import { AlertCircle, Send, MessageSquare } from 'lucide-react';

interface WhatsAppButtonProps {
  memberName: string;
  memberPhone: string | undefined | null;
  gymName: string;
  expiryDate?: string;
  variant?: 'icon' | 'button' | 'dropdown-item';
  defaultTemplate?: WhatsAppTemplateType;
  showTemplateSelector?: boolean;
  className?: string;
  disabled?: boolean;
}

export function WhatsAppButton({
  memberName,
  memberPhone,
  gymName,
  expiryDate,
  variant = 'icon',
  defaultTemplate = 'EXPIRY_REMINDER',
  showTemplateSelector = true,
  className = '',
  disabled = false,
}: WhatsAppButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateType>(defaultTemplate);
  const [customMessage, setCustomMessage] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const messageData: WhatsAppMessageData = {
    memberName,
    memberPhone: memberPhone || '',
    gymName,
    expiryDate,
  };

  const isPhoneValid = isValidWhatsAppNumber(memberPhone);

  // Get the preview message
  const getPreviewMessage = () => {
    if (isCustom) {
      return replaceTemplatePlaceholders(customMessage, messageData);
    }
    const template = getTemplateById(selectedTemplate);
    return template ? replaceTemplatePlaceholders(template.message, messageData) : '';
  };

  // Handle direct send (without template selector)
  const handleDirectSend = () => {
    if (!isPhoneValid) {
      toast({
        title: 'Invalid Phone Number',
        description: 'This member does not have a valid phone number for WhatsApp.',
        variant: 'destructive',
      });
      return;
    }

    if (showTemplateSelector) {
      setDialogOpen(true);
    } else {
      const template = getTemplateById(defaultTemplate);
      if (template) {
        const message = replaceTemplatePlaceholders(template.message, messageData);
        const result = openWhatsApp(memberPhone, message);
        if (!result.success) {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive',
          });
        }
      }
    }
  };

  // Handle send from dialog
  const handleSend = () => {
    const message = getPreviewMessage();
    const result = openWhatsApp(memberPhone, message);

    if (result.success) {
      setDialogOpen(false);
      toast({
        title: 'WhatsApp Opened',
        description: `Opening WhatsApp chat with ${memberName}`,
      });
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  // Handle template change
  const handleTemplateChange = (value: string) => {
    if (value === 'CUSTOM') {
      setIsCustom(true);
      // Initialize custom message with current template
      const currentTemplate = getTemplateById(selectedTemplate);
      if (currentTemplate && !customMessage) {
        setCustomMessage(currentTemplate.message);
      }
    } else {
      setIsCustom(false);
      setSelectedTemplate(value as WhatsAppTemplateType);
    }
  };

  // Render based on variant
  const renderTrigger = () => {
    const buttonContent = (
      <WhatsAppFilledIcon
        size={variant === 'icon' ? 16 : 14}
        className={isPhoneValid ? 'text-green-600' : 'text-gray-400'}
      />
    );

    if (variant === 'icon') {
      return (
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${isPhoneValid ? 'hover:bg-green-50 hover:text-green-600' : 'cursor-not-allowed opacity-50'} ${className}`}
          onClick={handleDirectSend}
          disabled={disabled || !isPhoneValid}
          title={isPhoneValid ? `Send WhatsApp message to ${memberName}` : 'Invalid phone number'}
        >
          {buttonContent}
        </Button>
      );
    }

    if (variant === 'button') {
      return (
        <Button
          variant="outline"
          size="sm"
          className={`${isPhoneValid ? 'text-green-600 border-green-300 hover:bg-green-50' : 'cursor-not-allowed opacity-50'} ${className}`}
          onClick={handleDirectSend}
          disabled={disabled || !isPhoneValid}
        >
          {buttonContent}
          <span className="ml-2">WhatsApp</span>
        </Button>
      );
    }

    // dropdown-item variant - returns just the click handler for use in DropdownMenuItem
    return null;
  };

  return (
    <>
      {renderTrigger()}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WhatsAppFilledIcon size={20} className="text-green-600" />
              Send WhatsApp Message
            </DialogTitle>
            <DialogDescription>
              Send a message to {memberName} via WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Phone number display */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Sending to: <strong>{memberPhone || 'No phone number'}</strong>
              </span>
              {!isPhoneValid && (
                <span className="flex items-center gap-1 text-red-500 text-xs ml-auto">
                  <AlertCircle className="h-3 w-3" />
                  Invalid number
                </span>
              )}
            </div>

            {/* Template selector */}
            <div className="space-y-2">
              <Label>Message Template</Label>
              <Select
                value={isCustom ? 'CUSTOM' : selectedTemplate}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {WHATSAPP_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM">Custom Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom message input */}
            {isCustom && (
              <div className="space-y-2">
                <Label>Custom Message</Label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter your custom message..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Available placeholders: {'{memberName}'}, {'{gymName}'}, {'{expiryDate}'}
                </p>
              </div>
            )}

            {/* Message preview */}
            <div className="space-y-2">
              <Label>Message Preview</Label>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg max-h-48 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-sans text-green-800">
                  {getPreviewMessage()}
                </pre>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!isPhoneValid}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Send via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * WhatsApp Dropdown Menu Item
 * For use inside DropdownMenuContent
 */
interface WhatsAppDropdownItemProps {
  memberName: string;
  memberPhone: string | undefined | null;
  gymName: string;
  expiryDate?: string;
  onSelect?: () => void;
}

export function useWhatsAppAction({
  memberName,
  memberPhone,
  gymName,
  expiryDate,
}: WhatsAppDropdownItemProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateType>('EXPIRY_REMINDER');
  const [customMessage, setCustomMessage] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const messageData: WhatsAppMessageData = {
    memberName,
    memberPhone: memberPhone || '',
    gymName,
    expiryDate,
  };

  const isPhoneValid = isValidWhatsAppNumber(memberPhone);

  const getPreviewMessage = () => {
    if (isCustom) {
      return replaceTemplatePlaceholders(customMessage, messageData);
    }
    const template = getTemplateById(selectedTemplate);
    return template ? replaceTemplatePlaceholders(template.message, messageData) : '';
  };

  const handleTemplateChange = (value: string) => {
    if (value === 'CUSTOM') {
      setIsCustom(true);
      const currentTemplate = getTemplateById(selectedTemplate);
      if (currentTemplate && !customMessage) {
        setCustomMessage(currentTemplate.message);
      }
    } else {
      setIsCustom(false);
      setSelectedTemplate(value as WhatsAppTemplateType);
    }
  };

  const handleSend = () => {
    const message = getPreviewMessage();
    const result = openWhatsApp(memberPhone, message);

    if (result.success) {
      setDialogOpen(false);
      toast({
        title: 'WhatsApp Opened',
        description: `Opening WhatsApp chat with ${memberName}`,
      });
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const openDialog = () => {
    if (!isPhoneValid) {
      toast({
        title: 'Invalid Phone Number',
        description: 'This member does not have a valid phone number for WhatsApp.',
        variant: 'destructive',
      });
      return;
    }
    setDialogOpen(true);
  };

  const WhatsAppDialog = () => (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WhatsAppFilledIcon size={20} className="text-green-600" />
            Send WhatsApp Message
          </DialogTitle>
          <DialogDescription>
            Send a message to {memberName} via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Sending to: <strong>{memberPhone || 'No phone number'}</strong>
            </span>
          </div>

          <div className="space-y-2">
            <Label>Message Template</Label>
            <Select
              value={isCustom ? 'CUSTOM' : selectedTemplate}
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {WHATSAPP_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
                <SelectItem value="CUSTOM">Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCustom && (
            <div className="space-y-2">
              <Label>Custom Message</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your custom message..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Available placeholders: {'{memberName}'}, {'{gymName}'}, {'{expiryDate}'}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Message Preview</Label>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg max-h-48 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-sans text-green-800">
                {getPreviewMessage()}
              </pre>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Send via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return {
    openDialog,
    WhatsAppDialog,
    isPhoneValid,
  };
}
