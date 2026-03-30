import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { StepWizard } from '@/components/shared/StepWizard';
import { VerificationStep } from './steps/VerificationStep';
import { TrainerDetailsStep } from './steps/TrainerDetailsStep';
import { hireTrainerService } from '@/services/hireTrainer.service';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Send, Dumbbell, Shield, FileText } from 'lucide-react';
import type { HireTrainerDocument, HireTrainer } from '@/types';

const STEPS = [
  { label: 'Verification', description: 'Email & Mobile' },
  { label: 'Trainer Details', description: 'Profile Information' },
];

const BENEFITS = [
  { icon: Dumbbell, text: 'Get discovered by top gyms' },
  { icon: Shield, text: 'Verified profile badge' },
  { icon: FileText, text: 'Save & resume anytime' },
];

export function TrainerApplicationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [hireTrainerId, setHireTrainerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({ country: 'India' });
  const [documents, setDocuments] = useState<HireTrainerDocument[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleVerified = useCallback(() => {
    setCurrentStep(2);
  }, []);

  const handleResumeDraft = useCallback((draft: HireTrainer) => {
    setEmail(draft.email);
    setMobile(draft.mobile);
    setHireTrainerId(draft.id);
    setDocuments(draft.documents || []);

    // Populate form data
    const data: Record<string, any> = {};
    const fields = [
      'fullName', 'address', 'whatsappNumber', 'country', 'state', 'city',
      'role', 'totalYearsExperience', 'ptExperienceYears', 'ptExperienceMonths',
      'currentSalary', 'expectedSalary', 'howSoonCanJoin', 'specialization',
      'currentGymName', 'reasonForLeaving', 'numberOfGymsChanged',
      'gender', 'maritalStatus',
    ];
    fields.forEach((f) => {
      if ((draft as any)[f] !== null && (draft as any)[f] !== undefined) {
        data[f] = String((draft as any)[f]);
      }
    });
    if (!data.country) data.country = 'India';
    setFormData(data);
    setCurrentStep(draft.currentStep > 1 ? 2 : 2);
  }, []);

  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset city when state changes
      if (field === 'state') {
        updated.city = '';
      }
      return updated;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.totalYearsExperience && formData.totalYearsExperience !== 0) {
      newErrors.totalYearsExperience = 'Experience is required';
    }
    if (!formData.currentSalary && formData.currentSalary !== 0) {
      newErrors.currentSalary = 'Current salary is required';
    }
    if (!formData.expectedSalary && formData.expectedSalary !== 0) {
      newErrors.expectedSalary = 'Expected salary is required';
    }
    if (!formData.howSoonCanJoin) newErrors.howSoonCanJoin = 'This field is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveStep = useCallback(async () => {
    setSaving(true);
    try {
      const result = await hireTrainerService.saveStep(email, 2, formData);
      if (!hireTrainerId) setHireTrainerId(result.id);
      toast({ title: 'Progress saved!' });
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [email, formData, hireTrainerId, toast]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep2()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Save step 2 data first
      const result = await hireTrainerService.saveStep(email, 2, formData);
      if (!hireTrainerId) setHireTrainerId(result.id);

      // Submit
      await hireTrainerService.submitApplication(email);
      navigate('/hire-trainer/success');
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }, [email, formData, hireTrainerId, navigate, toast]);

  return (
    <PublicLayout>
      {/* Hero banner */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-green-500 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-16 w-48 h-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Dumbbell className="w-4 h-4" />
            Trainer Registration
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Start Your Fitness Career Today
          </h1>
          <p className="mt-3 text-emerald-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join our network of certified personal trainers. Complete the form below and get connected with gyms looking for talent like you.
          </p>

          {/* Benefit pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium"
              >
                <b.icon className="w-3.5 h-3.5" />
                {b.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-10 pb-10">
        {/* Step Wizard card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
          <StepWizard steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <VerificationStep
            email={email}
            mobile={mobile}
            onEmailChange={setEmail}
            onMobileChange={setMobile}
            onVerified={handleVerified}
            onResumeDraft={handleResumeDraft}
          />
        )}

        {currentStep === 2 && (
          <>
            <TrainerDetailsStep
              formData={formData}
              onChange={handleFieldChange}
              documents={documents}
              onDocumentsChange={setDocuments}
              hireTrainerId={hireTrainerId}
              errors={errors}
            />

            {/* Sticky bottom navigation on mobile, normal on desktop */}
            <div className="mt-8 max-w-3xl mx-auto">
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep(1)}
                  className="gap-2 text-gray-600"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Verification
                </Button>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleSaveStep}
                    disabled={saving}
                    className="flex-1 sm:flex-none"
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Draft
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-md shadow-emerald-200"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Submit Application
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
