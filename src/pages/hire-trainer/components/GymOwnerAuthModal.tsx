import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Mail,
  Loader2,
  ArrowRight,
  Building2,
  User,
  Phone,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { gymOwnerLeadService } from '@/services/gymOwnerLead.service';
import type { GymOwnerLead } from '@/types';

interface GymOwnerAuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (lead: GymOwnerLead) => void;
}

type Step = 'email' | 'otp' | 'register' | 'success';

export function GymOwnerAuthModal({ open, onClose, onAuthenticated }: GymOwnerAuthModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [name, setName] = useState('');
  const [gymName, setGymName] = useState('');
  const [mobile, setMobile] = useState('');

  // Existing lead returned from verify
  const [existingLead, setExistingLead] = useState<GymOwnerLead | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('email');
      setOtpCode('');
      setName('');
      setGymName('');
      setMobile('');
      setExistingLead(null);

      // Pre-fill saved email
      const saved = gymOwnerLeadService.getSavedEmail();
      if (saved) setEmail(saved);
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent background scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // ── Send OTP ──
  const handleSendOtp = useCallback(async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Please enter a valid email', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await gymOwnerLeadService.sendOtp(email);
      gymOwnerLeadService.saveEmail(email);

      if (res.isAlreadyVerified && res.isRegistered) {
        // Already registered — check session to get lead data
        const session = await gymOwnerLeadService.checkSession(email);
        if (session.lead) {
          setExistingLead(session.lead);
          setStep('success');
          setTimeout(() => onAuthenticated(session.lead!), 1200);
          return;
        }
      }

      setStep('otp');
      setCountdown(60);
      toast({ title: 'OTP sent to your email' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [email, onAuthenticated]);

  // ── Verify OTP ──
  const handleVerifyOtp = useCallback(async () => {
    if (otpCode.length !== 6) {
      toast({ title: 'Enter 6-digit OTP', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await gymOwnerLeadService.verifyOtp(email, otpCode);

      if (res.isRegistered && res.lead) {
        // Already registered — go straight to success
        setExistingLead(res.lead);
        gymOwnerLeadService.saveEmail(email);
        setStep('success');
        setTimeout(() => onAuthenticated(res.lead!), 1200);
      } else {
        // Need registration
        setStep('register');
      }
    } catch (err: any) {
      toast({
        title: 'Verification failed',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [email, otpCode, onAuthenticated]);

  // ── Register ──
  const handleRegister = useCallback(async () => {
    if (!name.trim() || !gymName.trim() || !mobile.trim()) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    if (!/^\d{10,15}$/.test(mobile)) {
      toast({ title: 'Enter a valid mobile number', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await gymOwnerLeadService.register({ email, name: name.trim(), gymName: gymName.trim(), mobile: mobile.trim(), gender: 'Male' });
      gymOwnerLeadService.saveEmail(email);
      gymOwnerLeadService.saveMobile(mobile.trim());
      setExistingLead(res.lead);
      setStep('success');
      setTimeout(() => onAuthenticated(res.lead), 1200);
    } catch (err: any) {
      toast({
        title: 'Registration failed',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [email, name, gymName, mobile, onAuthenticated]);

  // ── Resend OTP ──
  const handleResend = useCallback(async () => {
    setLoading(true);
    try {
      await gymOwnerLeadService.sendOtp(email);
      setCountdown(60);
      setOtpCode('');
      toast({ title: 'OTP resent to your email' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [email]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-5 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                {step === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {step === 'email' && 'Verify Your Identity'}
                  {step === 'otp' && 'Enter OTP'}
                  {step === 'register' && 'Complete Your Profile'}
                  {step === 'success' && 'Welcome!'}
                </h2>
                <p className="text-emerald-100 text-sm">
                  {step === 'email' && 'Login with your email to contact trainers'}
                  {step === 'otp' && `Code sent to ${email}`}
                  {step === 'register' && 'Tell us about your gym'}
                  {step === 'success' && 'You can now contact trainers'}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {/* ── Email Step ── */}
            {step === 'email' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={loading || !email}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Send OTP
                </Button>
                <p className="text-xs text-gray-400 text-center">
                  No password required — we&apos;ll verify via email OTP
                </p>
              </div>
            )}

            {/* ── OTP Step ── */}
            {step === 'otp' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">6-Digit OTP</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                    maxLength={6}
                    className="text-center text-xl tracking-[0.5em] h-14 font-mono"
                    autoFocus
                  />
                </div>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otpCode.length !== 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Verify OTP
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => { setStep('email'); setOtpCode(''); }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ← Change email
                  </button>
                  {countdown > 0 ? (
                    <span className="text-gray-400">Resend in {countdown}s</span>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={loading}
                      className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Register Step ── */}
            {step === 'register' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Gym Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Your gym name"
                      value={gymName}
                      onChange={(e) => setGymName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 15))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleRegister}
                  disabled={loading || !name.trim() || !gymName.trim() || !mobile.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Complete Registration
                </Button>
              </div>
            )}

            {/* ── Success Step ── */}
            {step === 'success' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Welcome{existingLead?.name ? `, ${existingLead.name}` : ''}!
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {existingLead?.gymName && (
                    <span className="block text-emerald-600 font-medium">{existingLead.gymName}</span>
                  )}
                  Redirecting to contact trainer...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
