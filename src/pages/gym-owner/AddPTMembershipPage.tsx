import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addMonths } from 'date-fns';
import {
  ArrowLeft, Dumbbell, Calendar, IndianRupee, User, Save, AlertTriangle, Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { gymOwnerService } from '@/services/gymOwner.service';
import { BACKEND_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { BMICalculator } from '@/components/BMICalculator';
import type { Trainer, CreatePTAddon, CoursePackage } from '@/types';

const PAY_MODES = ['Cash', 'Card', 'UPI', 'Online', 'Cheque', 'Other'];

// Validation error type
interface ValidationErrors {
  package?: string;
  trainer?: string;
  fees?: string;
  sessions?: string;
  startDate?: string;
  endDate?: string;
}

export function AddPTMembershipPage() {
  const navigate = useNavigate();
  const { id: memberId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  // Form state
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<CoursePackage | null>(null);
  const [ptPackageName, setPtPackageName] = useState('');
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [sessionsTotal, setSessionsTotal] = useState(12);
  const [sessionDuration, setSessionDuration] = useState(60);
  const [ptPackageFees, setPtPackageFees] = useState(0);
  const [ptMaxDiscount, setPtMaxDiscount] = useState(0);
  const [ptExtraDiscount, setPtExtraDiscount] = useState(0);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [initialPayment, setInitialPayment] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [goals, setGoals] = useState('');
  const [notes, setNotes] = useState('');
  const [showBMICalculator, setShowBMICalculator] = useState(false);

  // Validation errors state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isReady = isAuthenticated && !authLoading && !!memberId;

  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => gymOwnerService.getMember(memberId!),
    enabled: isReady,
    retry: 1,
  });

  const { data: trainers = [], isLoading: trainersLoading } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => gymOwnerService.getTrainers(),
    enabled: isReady,
    retry: 1,
  });

  const { data: allActivePackages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['coursePackages', 'active'],
    queryFn: () => gymOwnerService.getActiveCoursePackages(),
    enabled: isReady,
    retry: 1,
  });

  const ptPackages = useMemo(() =>
    allActivePackages.filter((pkg: CoursePackage) => pkg.coursePackageType === 'PT'),
    [allActivePackages]
  );

  const ptFinalFees = useMemo(() => Math.max(0, ptPackageFees - ptMaxDiscount - ptExtraDiscount), [ptPackageFees, ptMaxDiscount, ptExtraDiscount]);
  const pendingAmount = useMemo(() => Math.max(0, ptFinalFees - initialPayment), [ptFinalFees, initialPayment]);
  const paymentStatus = useMemo(() => {
    if (initialPayment >= ptFinalFees && ptFinalFees > 0) return 'PAID';
    if (initialPayment > 0) return 'PARTIAL';
    return 'PENDING';
  }, [initialPayment, ptFinalFees]);

  // Auto-calculate end date when start date changes and package with months is selected
  useEffect(() => {
    if (selectedPackage && startDate) {
      const months = selectedPackage.Months || selectedPackage.months || 0;
      if (months > 0) {
        const calculatedEndDate = addMonths(new Date(startDate), months);
        setEndDate(format(calculatedEndDate, 'yyyy-MM-dd'));
      }
    }
  }, [startDate, selectedPackage]);

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
    setTouched(prev => ({ ...prev, package: true }));
    const selectedPkg = ptPackages.find((pkg: CoursePackage) => pkg.id === packageId);
    if (selectedPkg) {
      setSelectedPackage(selectedPkg);
      setPtPackageName(selectedPkg.packageName);
      setPtPackageFees(selectedPkg.fees);
      if (selectedPkg.discountType === 'PERCENTAGE') {
        setPtMaxDiscount(Math.round(selectedPkg.fees * (selectedPkg.maxDiscount / 100)));
      } else {
        setPtMaxDiscount(selectedPkg.maxDiscount);
      }

      // Auto-calculate end date based on package months
      const months = selectedPkg.Months || selectedPkg.months || 0;
      if (months > 0 && startDate) {
        const calculatedEndDate = addMonths(new Date(startDate), months);
        setEndDate(format(calculatedEndDate, 'yyyy-MM-dd'));
      }

      // Clear package error when selected
      setErrors(prev => ({ ...prev, package: undefined, fees: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!selectedPackageId || !ptPackageName) {
      newErrors.package = 'Please select a PT package';
    }
    if (!selectedTrainerId) {
      newErrors.trainer = 'Please select a trainer';
    }
    if (ptPackageFees <= 0) {
      newErrors.fees = 'Package fees must be greater than 0';
    }
    if (sessionsTotal < 1) {
      newErrors.sessions = 'At least 1 session required';
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    // Mark all fields as touched on submit
    setTouched({ package: true, trainer: true, fees: true, sessions: true, startDate: true, endDate: true });
    
    return Object.keys(newErrors).length === 0;
  };

  const addPTMutation = useMutation({
    mutationFn: (data: CreatePTAddon) => gymOwnerService.addPTAddon(memberId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      toast({ title: 'PT Membership added successfully!' });
      navigate('/gym-owner/members');
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to add PT membership',
        description: err?.response?.data?.message || 'An error occurred',
        variant: 'destructive'
      });
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) {
      // Mark all fields as touched to show errors
      setTouched({
        package: true,
        trainer: true,
        fees: true,
        sessions: true,
        startDate: true,
        endDate: true,
      });
      toast({ title: 'Please fix the validation errors', description: 'All required fields must be filled correctly', variant: 'destructive' });
      return;
    }

    const data: CreatePTAddon = {
      ptPackageName,
      trainerId: selectedTrainerId,
      sessionsTotal,
      sessionDuration,
      ptPackageFees,
      ptMaxDiscount,
      ptExtraDiscount,
      ptFinalFees,
      initialPayment,
      paymentMode,
      startDate,
      endDate,
      goals: goals || undefined,
      notes: notes || undefined,
    };

    addPTMutation.mutate(data);
  };

  // Handle field blur for validation
  const handleBlur = (field: keyof ValidationErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate the specific field
    const newErrors = { ...errors };
    switch (field) {
      case 'package':
        if (!selectedPackageId || !ptPackageName) {
          newErrors.package = 'Please select a PT package';
        } else {
          delete newErrors.package;
        }
        break;
      case 'trainer':
        if (!selectedTrainerId) {
          newErrors.trainer = 'Please select a trainer';
        } else {
          delete newErrors.trainer;
        }
        break;
      case 'fees':
        if (ptPackageFees <= 0) {
          newErrors.fees = 'Package fees must be greater than 0';
        } else {
          delete newErrors.fees;
        }
        break;
      case 'sessions':
        if (sessionsTotal < 1) {
          newErrors.sessions = 'At least 1 session required';
        } else {
          delete newErrors.sessions;
        }
        break;
      case 'startDate':
        if (!startDate) {
          newErrors.startDate = 'Start date is required';
        } else {
          delete newErrors.startDate;
        }
        break;
      case 'endDate':
        if (!endDate) {
          newErrors.endDate = 'End date is required';
        } else if (startDate && new Date(endDate) < new Date(startDate)) {
          newErrors.endDate = 'End date must be after start date';
        } else {
          delete newErrors.endDate;
        }
        break;
    }
    setErrors(newErrors);
  };

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  const isLoading = authLoading || memberLoading || trainersLoading || packagesLoading;

  if (isLoading || !isReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <p className="text-lg text-muted-foreground">Member not found</p>
        <Button onClick={() => navigate('/gym-owner/members')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back to Members
        </Button>
      </div>
    );
  }

  if (member.memberType === 'PT' || member.memberType === 'REGULAR_PT') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Dumbbell className="h-12 w-12 text-purple-500" />
        <p className="text-lg text-muted-foreground">This member already has PT membership</p>
        <Button onClick={() => navigate(`/gym-owner/members/${memberId}/edit-pt`)}>
          <Dumbbell className="mr-2 h-4 w-4" />Edit PT Membership
        </Button>
      </div>
    );
  }

  const memberName = member.firstName && member.lastName
    ? `${member.firstName} ${member.lastName}`
    : member.user?.name || 'Unknown';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/gym-owner/members')} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="p-1.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
            <Dumbbell className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-purple-700">Add PT Membership</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/gym-owner/members')} className="hidden sm:flex">
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSubmit} 
            disabled={addPTMutation.isPending} 
            className="bg-gradient-to-r from-purple-600 to-violet-600"
          >
            {addPTMutation.isPending ? <Spinner className="h-4 w-4" /> : <><Save className="h-4 w-4 mr-1" />Save</>}
          </Button>
        </div>
      </div>

      {/* Main Content - Full Page */}
      <div className="flex-1 overflow-auto p-3 md:p-4 lg:p-6">
        <div className="h-full max-w-7xl mx-auto flex flex-col">
          
          {/* Member Info Card */}
          <div className="shrink-0 bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-4 mb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-purple-200 shadow">
                {member.memberPhoto ? <AvatarImage src={`${BACKEND_BASE_URL}${member.memberPhoto}`} /> : null}
                <AvatarFallback className="text-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                  {getInitials(memberName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate">{memberName}</h2>
                <p className="text-sm text-muted-foreground">Member ID: {member.memberId || 'N/A'}</p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-sm px-3 py-1">
                  REGULAR
                </Badge>
                <span className="text-xl text-purple-400">→</span>
                <Badge className="bg-purple-600 text-white text-sm px-3 py-1">
                  <Dumbbell className="h-3.5 w-3.5 mr-1" />REGULAR + PT
                </Badge>
              </div>
            </div>
            {/* Mobile badge */}
            <div className="flex sm:hidden items-center gap-2 mt-3 pt-3 border-t">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">REGULAR</Badge>
              <span className="text-purple-400">→</span>
              <Badge className="bg-purple-600 text-white"><Dumbbell className="h-3 w-3 mr-1" />+ PT</Badge>
            </div>
          </div>

          {/* Form Grid - Fills remaining space */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              
              {/* PT Package */}
              <div className="sm:col-span-2 lg:col-span-1">
                <Label className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" /> PT Package <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={selectedPackageId} 
                  onValueChange={handlePackageSelect}
                  onOpenChange={(open) => !open && handleBlur('package')}
                >
                  <SelectTrigger className={`h-11 ${touched.package && errors.package ? 'border-red-500 ring-1 ring-red-500' : ''}`}>
                    <SelectValue placeholder="Select PT package..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ptPackages.length === 0 ? (
                      <SelectItem value="no-packages" disabled>No PT packages available</SelectItem>
                    ) : (
                      ptPackages.map((pkg: CoursePackage) => {
                        const months = pkg.Months || pkg.months || 0;
                        return (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.packageName} - ₹{pkg.fees.toLocaleString()} - {months} {months === 1 ? 'Month' : 'Months'}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                {touched.package && errors.package && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />{errors.package}
                  </p>
                )}
              </div>

              {/* Trainer */}
              <div className="sm:col-span-2 lg:col-span-1">
                <Label className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" /> Trainer <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={selectedTrainerId} 
                  onValueChange={(val) => {
                    setSelectedTrainerId(val);
                    setTouched(prev => ({ ...prev, trainer: true }));
                    setErrors(prev => ({ ...prev, trainer: undefined }));
                  }}
                  onOpenChange={(open) => !open && handleBlur('trainer')}
                >
                  <SelectTrigger className={`h-11 ${touched.trainer && errors.trainer ? 'border-red-500 ring-1 ring-red-500' : ''}`}>
                    <SelectValue placeholder="Select trainer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map((trainer: Trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.firstName} {trainer.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.trainer && errors.trainer && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />{errors.trainer}
                  </p>
                )}
              </div>

              {/* BMI Calculator Link */}
              <div className="sm:col-span-2 lg:col-span-1">
                <Label className="text-sm font-semibold mb-2 block">Health Tools</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBMICalculator(true)}
                  className="h-11 w-full bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-300 text-purple-700"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate BMI
                </Button>
              </div>

              {/* Start Date */}
              <div>
                <Label className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-blue-600" /> Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value) {
                      setErrors(prev => ({ ...prev, startDate: undefined }));
                    }
                  }}
                  onBlur={() => handleBlur('startDate')}
                  className={`h-11 ${touched.startDate && errors.startDate ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                />
                {touched.startDate && errors.startDate && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />{errors.startDate}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div>
                <Label className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-blue-600" /> End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (e.target.value && (!startDate || new Date(e.target.value) >= new Date(startDate))) {
                      setErrors(prev => ({ ...prev, endDate: undefined }));
                    }
                  }}
                  onBlur={() => handleBlur('endDate')}
                  className={`h-11 ${touched.endDate && errors.endDate ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                />
                {touched.endDate && errors.endDate && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />{errors.endDate}
                  </p>
                )}
              </div>

              {/* Package Fees */}
              <div>
                <Label className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" /> Package Fees <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={ptPackageFees || ''}
                    onChange={(e) => {
                      setPtPackageFees(parseFloat(e.target.value) || 0);
                      if (parseFloat(e.target.value) > 0) {
                        setErrors(prev => ({ ...prev, fees: undefined }));
                      }
                    }}
                    onBlur={() => handleBlur('fees')}
                    className={`h-11 pl-9 ${touched.fees && errors.fees ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  />
                </div>
                {touched.fees && errors.fees && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />{errors.fees}
                  </p>
                )}
              </div>

              {/* Max Discount */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Max Discount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={ptMaxDiscount || ''}
                    onChange={(e) => setPtMaxDiscount(parseFloat(e.target.value) || 0)}
                    className="h-11 pl-9"
                  />
                </div>
              </div>

              {/* Extra Discount */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Extra Discount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={ptExtraDiscount || ''}
                    onChange={(e) => setPtExtraDiscount(parseFloat(e.target.value) || 0)}
                    className="h-11 pl-9"
                  />
                </div>
              </div>

              {/* Final Fees Box */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border-2 border-green-200 dark:border-green-800">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Final Fees</p>
                <p className="text-2xl font-bold text-green-700 flex items-center">
                  <IndianRupee className="h-5 w-5" />{ptFinalFees.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Payment Mode */}
              <div>
                <Label className="text-sm font-semibold text-orange-700 mb-2 block">Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAY_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Paid Amount */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Paid Amount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={initialPayment || ''}
                    onChange={(e) => setInitialPayment(Math.min(parseFloat(e.target.value) || 0, ptFinalFees))}
                    className="h-11 pl-9"
                  />
                </div>
              </div>

              {/* Pending Amount Box */}
              <div className={`p-4 rounded-xl border-2 ${pendingAmount > 0 ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${pendingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  Pending Amount
                </p>
                <p className={`text-2xl font-bold flex items-center ${pendingAmount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                  <IndianRupee className="h-5 w-5" />{pendingAmount.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Payment Status */}
              <div className="flex items-end pb-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Status</p>
                  <Badge className={`text-sm px-4 py-1.5 ${
                    paymentStatus === 'PAID' ? 'bg-green-500 hover:bg-green-600' : 
                    paymentStatus === 'PARTIAL' ? 'bg-yellow-500 hover:bg-yellow-600' : 
                    'bg-red-500 hover:bg-red-600'
                  } text-white`}>
                    {paymentStatus}
                  </Badge>
                </div>
              </div>

              {/* Goals */}
              <div className="sm:col-span-2">
                <Label className="text-sm font-semibold mb-2 block">PT Goals (Optional)</Label>
                <Textarea
                  placeholder="e.g., Weight loss, Muscle building, Fitness improvement..."
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <Label className="text-sm font-semibold mb-2 block">Notes (Optional)</Label>
                <Textarea
                  placeholder="Any additional notes about this PT membership..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Mobile Bottom Action */}
          <div className="shrink-0 sm:hidden mt-4 pb-2">
            <Button
              onClick={handleSubmit}
              disabled={addPTMutation.isPending}
              className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-violet-600"
            >
              {addPTMutation.isPending ? <Spinner className="h-5 w-5" /> : <><Save className="h-5 w-5 mr-2" />Add PT Membership</>}
            </Button>
          </div>
        </div>
      </div>

      {/* BMI Calculator Modal */}
      <BMICalculator open={showBMICalculator} onOpenChange={setShowBMICalculator} />
    </div>
  );
}
