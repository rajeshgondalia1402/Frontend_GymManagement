import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Phone, ShieldCheck, Loader2, ArrowRight, KeyRound, RotateCcw } from 'lucide-react';
import { hireTrainerService } from '@/services/hireTrainer.service';
import { useToast } from '@/hooks/use-toast';

interface VerificationStepProps {
  email: string;
  mobile: string;
  onEmailChange: (value: string) => void;
  onMobileChange: (value: string) => void;
  onVerified: () => void;
  onResumeDraft: (data: any) => void;
}

export function VerificationStep({
  email,
  mobile,
  onEmailChange,
  onMobileChange,
  onVerified,
  onResumeDraft,
}: VerificationStepProps) {
  const { toast } = useToast();
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [resumeEmail, setResumeEmail] = useState('');
  const [resumeMobile, setResumeMobile] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = useCallback(async () => {
    if (!email || !mobile) {
      toast({ title: 'Please enter both email and mobile number', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const result = await hireTrainerService.sendOtp(email, mobile);

      if (result.isAlreadyVerified) {
        setIsVerified(true);
        toast({ title: 'Email already verified!' });
        // Auto-check for existing draft
        const status = await hireTrainerService.checkVerification(email);
        if (status.hasExistingDraft) {
          toast({ title: 'Existing draft found. Resuming your application...' });
          const draft = await hireTrainerService.resumeDraft(email, mobile);
          onResumeDraft(draft);
        } else {
          // Save step 1 data
          await hireTrainerService.saveStep(email, 1, { mobile });
          onVerified();
        }
        return;
      }

      setOtpSent(true);
      setCountdown(60);
      toast({ title: 'OTP sent to your email!' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [email, mobile, toast, onVerified, onResumeDraft]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({ title: 'Please enter a valid 6-digit OTP', variant: 'destructive' });
      return;
    }

    setVerifying(true);
    try {
      await hireTrainerService.verifyOtp(email, otpCode);
      setIsVerified(true);
      toast({ title: 'Email verified successfully!' });

      // Save step 1
      await hireTrainerService.saveStep(email, 1, { mobile });
      onVerified();
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  }, [email, otpCode, mobile, toast, onVerified]);

  const handleResume = useCallback(async () => {
    if (!resumeEmail || !resumeMobile) {
      toast({ title: 'Please enter both email and mobile number', variant: 'destructive' });
      return;
    }

    setResumeLoading(true);
    try {
      const draft = await hireTrainerService.resumeDraft(resumeEmail, resumeMobile);
      onEmailChange(resumeEmail);
      onMobileChange(resumeMobile);
      onResumeDraft(draft);
      toast({ title: 'Draft loaded successfully!' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      });
    } finally {
      setResumeLoading(false);
    }
  }, [resumeEmail, resumeMobile, toast, onEmailChange, onMobileChange, onResumeDraft]);

  if (showResume) {
    return (
      <Card className="max-w-md mx-auto shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <RotateCcw className="w-6 h-6 text-emerald-600" />
          </div>
          <CardTitle className="text-xl">Resume Application</CardTitle>
          <CardDescription>Enter your registered email and mobile to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Mail className="w-3.5 h-3.5 text-gray-500" /> Email
            </Label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={resumeEmail}
              onChange={(e) => setResumeEmail(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Phone className="w-3.5 h-3.5 text-gray-500" /> Mobile Number
            </Label>
            <Input
              type="tel"
              placeholder="9876543210"
              value={resumeMobile}
              onChange={(e) => setResumeMobile(e.target.value.replace(/\D/g, ''))}
              maxLength={15}
              className="h-11"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => setShowResume(false)}
              className="flex-1 h-11"
            >
              Back
            </Button>
            <Button
              onClick={handleResume}
              disabled={resumeLoading}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200"
            >
              {resumeLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Resume
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto shadow-lg border-0">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
        </div>
        <CardTitle className="text-xl">Email Verification</CardTitle>
        <CardDescription>
          Verify your email to start your trainer application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {/* Email */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Mail className="w-3.5 h-3.5 text-gray-500" /> Email <span className="text-red-500">*</span>
          </Label>
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={otpSent || isVerified}
            className="h-11"
          />
        </div>

        {/* Mobile */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Phone className="w-3.5 h-3.5 text-gray-500" /> Mobile Number <span className="text-red-500">*</span>
          </Label>
          <Input
            type="tel"
            placeholder="9876543210"
            value={mobile}
            onChange={(e) => onMobileChange(e.target.value.replace(/\D/g, ''))}
            disabled={otpSent || isVerified}
            maxLength={15}
            className="h-11"
          />
        </div>

        {/* Send OTP */}
        {!otpSent && !isVerified && (
          <Button
            onClick={handleSendOtp}
            disabled={loading || !email || !mobile}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-md shadow-emerald-200 text-sm font-semibold"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {loading ? 'Sending...' : 'Send OTP'}
          </Button>
        )}

        {/* OTP Input */}
        {otpSent && !isVerified && (
          <div className="space-y-3 pt-1">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
              <KeyRound className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-sm text-emerald-700 font-medium">OTP sent to your email</p>
              <p className="text-xs text-emerald-600 mt-0.5">Check your inbox (and spam folder)</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Enter 6-digit OTP</Label>
              <Input
                type="text"
                placeholder="• • • • • •"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-[0.5em] h-12 font-mono"
              />
            </div>
            <Button
              onClick={handleVerifyOtp}
              disabled={verifying || otpCode.length !== 6}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-md shadow-emerald-200 font-semibold"
            >
              {verifying && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Verify OTP
            </Button>
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-400">Resend OTP in <span className="font-semibold text-gray-600">{countdown}s</span></p>
              ) : (
                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}

        {/* Verified badge */}
        {isVerified && (
          <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">Email verified successfully!</span>
          </div>
        )}

        {/* Resume link */}
        <div className="pt-3 text-center border-t border-gray-100">
          <button
            onClick={() => setShowResume(true)}
            className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
          >
            Already have an application? <span className="font-semibold underline underline-offset-2">Resume here</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
