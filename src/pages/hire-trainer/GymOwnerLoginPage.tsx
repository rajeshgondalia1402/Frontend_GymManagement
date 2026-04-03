import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Phone,
  Loader2,
  ArrowRight,
  Building2,
  User,
  Mail,
  CheckCircle2,
  Shield,
  Dumbbell,
  Users,
  KeyRound,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { gymOwnerLeadService } from '@/services/gymOwnerLead.service';

type Step = 'mobile' | 'register' | 'otp' | 'success' | 'forgot';

export function GymOwnerLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from'); // 'vacancy' | 'trainer' | null
  const [step, setStep] = useState<Step>('mobile');
  const [loading, setLoading] = useState(false);

  // Form state
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [gymName, setGymName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<string>('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const savedMobile = gymOwnerLeadService.getSavedMobile();
    const savedEmail = gymOwnerLeadService.getSavedEmail();
    if (savedMobile && savedEmail) {
      gymOwnerLeadService.checkSession(savedEmail).then((session) => {
        if (session.isVerified && session.isRegistered && session.lead) {
          navigate('/hire-trainer/search', { replace: true });
        }
      }).catch(() => { /* ignore */ });
    }
  }, [navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // ── Check Mobile ──
  const handleCheckMobile = useCallback(async () => {
    if (!/^\d{10,15}$/.test(mobile)) {
      toast({ title: 'Please enter a valid 10-digit mobile number', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await gymOwnerLeadService.checkMobile(mobile);
      if (res.exists && res.isVerified && res.userType === 'gym_owner' && res.lead) {
        // Gym owner — login
        gymOwnerLeadService.saveMobile(mobile);
        gymOwnerLeadService.saveEmail(res.lead.email);
        gymOwnerLeadService.saveUserType('gym_owner');
        setName(res.lead.name);
        setGymName(res.lead.gymName);
        setStep('success');
        toast({ title: `Welcome back, ${res.lead.name}!` });
        setTimeout(() => navigate('/hire-trainer/search', { replace: true }), 1200);
      } else if (res.exists && res.isVerified && res.userType === 'trainer' && res.trainer) {
        // Trainer — login
        gymOwnerLeadService.saveMobile(mobile);
        gymOwnerLeadService.saveEmail(res.trainer.email);
        gymOwnerLeadService.saveUserType('trainer');
        setName(res.trainer.fullName || 'Trainer');
        setStep('success');
        toast({ title: `Welcome back, ${res.trainer.fullName || 'Trainer'}!` });
        setTimeout(() => navigate('/hire-trainer/search', { replace: true }), 1200);
      } else {
        // Not found
        if (from === 'vacancy') {
          // Trainer needs to register via /hire-trainer/apply
          toast({ title: 'Mobile not registered. Please register as a trainer first.' });
          navigate(`/hire-trainer/apply?mobile=${encodeURIComponent(mobile)}`, { replace: true });
        } else {
          // Gym owner registration flow
          setStep('register');
        }
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [mobile, navigate, from]);

  // ── Register ──
  const handleRegister = useCallback(async () => {
    if (!name.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' });
      return;
    }
    if (!gymName.trim()) {
      toast({ title: 'Please enter your gym name', variant: 'destructive' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Please enter a valid email', variant: 'destructive' });
      return;
    }
    if (!gender) {
      toast({ title: 'Please select your gender', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await gymOwnerLeadService.register({
        email: email.trim(),
        name: name.trim(),
        gymName: gymName.trim(),
        mobile: mobile.trim(),
        gender,
      });
      gymOwnerLeadService.saveUserType('gym_owner');
      setStep('otp');
      setCountdown(60);
      toast({ title: 'OTP sent to your email for verification' });
    } catch (err: any) {
      toast({
        title: 'Registration failed',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [name, gymName, email, mobile, gender]);

  // ── Verify OTP ──
  const handleVerifyOtp = useCallback(async () => {
    if (otpCode.length !== 6) {
      toast({ title: 'Enter 6-digit OTP', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await gymOwnerLeadService.verifyOtp(email, otpCode);
      if (res.verified) {
        gymOwnerLeadService.saveMobile(mobile);
        gymOwnerLeadService.saveEmail(email);
        setStep('success');
        toast({ title: 'Email verified successfully!' });
        setTimeout(() => navigate('/hire-trainer/search', { replace: true }), 1500);
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
  }, [email, otpCode, mobile, navigate]);

  // ── Resend OTP ──
  const handleResend = useCallback(async () => {
    setLoading(true);
    try {
      await gymOwnerLeadService.resendOtp(email);
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

  // ── Forgot Password ──
  const handleForgotPassword = useCallback(async () => {
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      toast({ title: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await gymOwnerLeadService.forgotPassword(forgotEmail);
      setForgotSent(true);
      toast({ title: 'Login details sent to your email' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [forgotEmail]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 flex flex-col">
      {/* Header */}
      <header className="h-14 sm:h-16 border-b border-gray-200 bg-white px-4 sm:px-6 flex items-center shrink-0">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">
            Gym Desk<span className="text-emerald-500"> Pro</span>
          </span>
        </a>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  {step === 'success' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : step === 'register' ? (
                    <Users className="w-6 h-6" />
                  ) : step === 'forgot' ? (
                    <KeyRound className="w-6 h-6" />
                  ) : (
                    <Shield className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    {step === 'mobile' && 'Search Trainers'}
                    {step === 'register' && 'Register Your Gym'}
                    {step === 'otp' && 'Verify Your Email'}
                    {step === 'success' && 'Welcome!'}
                    {step === 'forgot' && 'Forgot Password'}
                  </h1>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {step === 'mobile' && 'Enter your mobile number to login or register'}
                    {step === 'register' && 'Fill in your details to get started'}
                    {step === 'otp' && `OTP sent to ${email}`}
                    {step === 'success' && 'Redirecting to trainers...'}
                    {step === 'forgot' && 'Gym owners & trainers can recover login details'}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {/* ── Mobile Step ── */}
              {step === 'mobile' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="tel"
                        inputMode="numeric"
                        placeholder="Enter 10-digit mobile number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 15))}
                        onKeyDown={(e) => e.key === 'Enter' && handleCheckMobile()}
                        className="pl-10 h-12 text-base"
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleCheckMobile}
                    disabled={loading || mobile.length < 10}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-base"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Continue
                  </Button>

                  {/* Info note */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-2">
                    <p className="text-sm font-semibold text-emerald-800">
                      How it works:
                    </p>
                    <ol className="text-xs text-emerald-700 space-y-1 list-decimal list-inside leading-relaxed">
                      <li><strong>Gym Owners:</strong> Enter your mobile number to login or register your gym</li>
                      <li><strong>Trainers:</strong> Enter your registered mobile number to login instantly</li>
                      <li>New gym owners can register with basic details and verify via email OTP</li>
                      <li>Browse and connect with qualified trainers after login</li>
                    </ol>
                    <p className="text-[11px] text-emerald-600 pt-0.5">
                      No password needed — we use passwordless login for a seamless experience.
                    </p>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-center">
                    <button
                      onClick={() => { setStep('forgot'); setForgotEmail(''); setForgotSent(false); }}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
                    >
                      Forgot your login details?
                    </button>
                  </div>
                </div>
              )}

              {/* ── Register Step ── */}
              {step === 'register' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Mobile number <strong>{mobile}</strong> is not registered. Please complete registration below.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Gym Name <span className="text-red-500">*</span></label>
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

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Email ID <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Mobile No <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="tel"
                        value={mobile}
                        disabled
                        className="pl-10 bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Gender <span className="text-red-500">*</span></label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setGender('Male')}
                        className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                          gender === 'Male'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('Female')}
                        className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                          gender === 'Female'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleRegister}
                    disabled={loading || !name.trim() || !gymName.trim() || !email.trim() || !gender}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-base mt-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Register & Get OTP
                  </Button>

                  <button
                    onClick={() => { setStep('mobile'); setMobile(''); }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ← Change mobile number
                  </button>
                </div>
              )}

              {/* ── OTP Step ── */}
              {step === 'otp' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 leading-relaxed">
                    We&apos;ve sent a 6-digit verification code to <strong>{email}</strong>. Please enter it below to complete your registration.
                  </p>
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
                      className="text-center text-2xl tracking-[0.5em] h-14 font-mono"
                      autoFocus
                    />
                  </div>
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={loading || otpCode.length !== 6}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-base"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Verify & Continue
                  </Button>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      onClick={() => setStep('register')}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      ← Back
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

              {/* ── Forgot Password Step ── */}
              {step === 'forgot' && (
                <div className="space-y-4">
                  {!forgotSent ? (
                    <>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Enter your registered email address (gym owner or trainer) and we&apos;ll send your login details (including your registered mobile number) directly to your inbox.
                      </p>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Registered Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                            className="pl-10 h-12 text-base"
                            autoFocus
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleForgotPassword}
                        disabled={loading || !forgotEmail.trim()}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-base"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send Login Details
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">Email Sent Successfully!</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        We&apos;ve sent your login details to <strong className="text-gray-700">{forgotEmail}</strong>. Please check your inbox and use the registered mobile number to login.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => { setStep('mobile'); setForgotEmail(''); setForgotSent(false); }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ← Back to Login
                  </button>
                </div>
              )}

              {/* ── Success Step ── */}
              {step === 'success' && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Welcome{name ? `, ${name}` : ''}!
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {gymName && (
                      <span className="block text-emerald-600 font-medium">{gymName}</span>
                    )}
                    Redirecting to Search Trainers...
                  </p>
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto mt-4" />
                </div>
              )}
            </div>
          </div>

          {/* Info below card */}
          {step === 'mobile' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Looking for a trainer job?{' '}
                <a
                  href="/hire-trainer/apply"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Apply as a trainer →
                </a>
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 px-4 text-center shrink-0">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Gym Desk Pro. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
