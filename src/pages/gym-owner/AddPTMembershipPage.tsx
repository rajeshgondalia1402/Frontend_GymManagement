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
import { getImageUrl } from '@/utils/imageUrl';
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
    setTouched({ package: true, trainer: true, fees: true, startDate: true, endDate: true });

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
        startDate: true,
        endDate: true,
      });
      toast({ title: 'Please fix the validation errors', description: 'All required fields must be filled correctly', variant: 'destructive' });
      return;
    }

    const data: CreatePTAddon = {
      ptPackageName,
      trainerId: selectedTrainerId,
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-background border-b px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/gym-owner/members')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Dumbbell className="h-7 w-7 text-purple-600" />
                Add PT Membership
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Add personal training membership for member
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/gym-owner/members')} className="hidden sm:flex">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={addPTMutation.isPending} 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {addPTMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {addPTMutation.isPending ? 'Saving...' : 'Save PT Membership'}
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Member Info Card */}
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
              {member.memberPhoto ? <AvatarImage src={getImageUrl(member.memberPhoto)} /> : null}
              <AvatarFallback className="text-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                {getInitials(memberName)}
              </AvatarFallback>
            </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold">{memberName}</h2>
            <p className="text-sm text-muted-foreground">Member ID: {member.memberId || 'N/A'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              REGULAR
            </Badge>
            <span className="text-purple-400">→</span>
            <Badge className="bg-purple-600 text-white">
              <Dumbbell className="h-3 w-3 mr-1" />REGULAR + PT
            </Badge>
          </div>
        </div>
        </div>

        {/* PT Package & Trainer Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-purple-500" />
            PT Package Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
            {/* PT Package */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-purple-500" /> PT Package <span className="text-red-500">*</span>
              </Label>
              <Select 
                  value={selectedPackageId} 
                  onValueChange={handlePackageSelect}
                  onOpenChange={(open) => !open && handleBlur('package')}
                >
                  <SelectTrigger className={touched.package && errors.package ? 'border-red-500 ring-1 ring-red-500' : ''}>
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
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />{errors.package}
                  </p>
                )}
              </div>

              {/* Trainer */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-500" /> Trainer <span className="text-red-500">*</span>
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
                  <SelectTrigger className={touched.trainer && errors.trainer ? 'border-red-500 ring-1 ring-red-500' : ''}>
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
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />{errors.trainer}
                  </p>
                )}
              </div>

              {/* BMI Calculator Link */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Health Tools</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBMICalculator(true)}
                  className="w-full bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-300 text-purple-700"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate BMI
                </Button>
              </div>
        </div>
      </div>

      {/* Dates Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          PT Duration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
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
                  className={touched.startDate && errors.startDate ? 'border-red-500 ring-1 ring-red-500' : ''}
                />
                {touched.startDate && errors.startDate && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />{errors.startDate}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
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
                  className={touched.endDate && errors.endDate ? 'border-red-500 ring-1 ring-red-500' : ''}
                />
                {touched.endDate && errors.endDate && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />{errors.endDate}
                  </p>
                )}
              </div>
        </div>
      </div>

      {/* Fee Details Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-green-500" />
          Fee Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Package Fees */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <IndianRupee className="h-4 w-4 text-green-600" /> Package Fees <span className="text-red-500">*</span>
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
                    className={`pl-9 ${touched.fees && errors.fees ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  />
                </div>
                {touched.fees && errors.fees && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />{errors.fees}
                  </p>
                )}
              </div>

              {/* Max Discount */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Discount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={ptMaxDiscount || ''}
                    onChange={(e) => setPtMaxDiscount(parseFloat(e.target.value) || 0)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Extra Discount */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Extra Discount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={ptExtraDiscount || ''}
                    onChange={(e) => setPtExtraDiscount(parseFloat(e.target.value) || 0)}
                    className="pl-9"
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
        </div>
      </div>

      {/* Payment Details Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-orange-500" />
          Payment Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Payment Mode */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label className="text-sm font-medium">Paid Amount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={initialPayment || ''}
                    onChange={(e) => setInitialPayment(Math.min(parseFloat(e.target.value) || 0, ptFinalFees))}
                    className="pl-9"
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
              <div className="flex items-end">
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
        </div>
      </div>

      {/* Additional Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Goals */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">PT Goals (Optional)</Label>
                <Textarea
                  placeholder="e.g., Weight loss, Muscle building, Fitness improvement..."
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes (Optional)</Label>
                <Textarea
                  placeholder="Any additional notes about this PT membership..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
          </div>
        </div>

        {/* Mobile Bottom Action */}
        <div className="sm:hidden pb-4">
          <Button
            onClick={handleSubmit}
            disabled={addPTMutation.isPending}
            className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {addPTMutation.isPending ? <Spinner className="h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
            {addPTMutation.isPending ? 'Saving...' : 'Add PT Membership'}
          </Button>
        </div>
      </div>

      {/* BMI Calculator Modal */}
      <BMICalculator open={showBMICalculator} onOpenChange={setShowBMICalculator} />
    </div>
  );
}
