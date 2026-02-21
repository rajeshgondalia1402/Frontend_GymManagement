import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addMonths } from 'date-fns';
import {
  ArrowLeft, Dumbbell, Calendar, IndianRupee, User, CheckCircle,
  Save, Pencil, Calculator, AlertTriangle,
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

export function EditPTMembershipPage() {
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [goals, setGoals] = useState('');
  const [notes, setNotes] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showBMICalculator, setShowBMICalculator] = useState(false);

  // Wait for auth to be ready before making API calls
  const isReady = isAuthenticated && !authLoading && !!memberId;

  // Fetch member
  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => gymOwnerService.getMember(memberId!),
    enabled: isReady,
    retry: 1,
  });

  // Fetch trainers
  const { data: trainers = [], isLoading: trainersLoading } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => gymOwnerService.getTrainers(),
    enabled: isReady,
    retry: 1,
  });

  // Fetch PT course packages
  const { data: allActivePackages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['coursePackages', 'active'],
    queryFn: () => gymOwnerService.getActiveCoursePackages(),
    enabled: isReady,
    retry: 1,
  });

  // Filter only PT packages
  const ptPackages = useMemo(() =>
    allActivePackages.filter((pkg: CoursePackage) => pkg.coursePackageType === 'PT'),
    [allActivePackages]
  );

  // Calculated values
  const ptFinalFees = useMemo(() => Math.max(0, ptPackageFees - ptMaxDiscount - ptExtraDiscount), [ptPackageFees, ptMaxDiscount, ptExtraDiscount]);

  // Auto-calculate end date when start date changes and package with months is selected
  useEffect(() => {
    if (selectedPackage && startDate && isInitialized) {
      const months = selectedPackage.Months || selectedPackage.months || 0;
      if (months > 0) {
        const calculatedEndDate = addMonths(new Date(startDate), months);
        setEndDate(format(calculatedEndDate, 'yyyy-MM-dd'));
      }
    }
  }, [startDate, selectedPackage, isInitialized]);

  // Load existing PT data when member is loaded
  useEffect(() => {
    // Debug: Log member data to understand the structure
    if (member) {
      console.log('=== Edit PT Member Debug ===');
      console.log('Full Member Object:', JSON.stringify(member, null, 2));
      console.log('Member ptInfo:', member.ptInfo);
      console.log('Member ptPackageName:', member.ptPackageName);
      console.log('Member ptPackageFees:', member.ptPackageFees);
      console.log('Member ptMaxDiscount:', member.ptMaxDiscount);
      console.log('Member ptExtraDiscount:', member.ptExtraDiscount);
      console.log('Member hasPTAddon:', member.hasPTAddon);
      console.log('Trainers loaded:', trainers.length);
      console.log('PT Packages loaded:', ptPackages.length);
      console.log('isInitialized:', isInitialized);
    }

    // Check if member has PT data - either through ptInfo or hasPTAddon flag
    const hasPTData = member && (member.ptInfo || member.hasPTAddon);

    if (hasPTData && !isInitialized) {
      console.log('=== Initializing PT Form ===');

      // Set basic PT info from member object directly
      setPtPackageName(member.ptPackageName || '');
      setPtPackageFees(member.ptPackageFees || 0);
      setPtMaxDiscount(member.ptMaxDiscount || 0);
      setPtExtraDiscount(member.ptExtraDiscount || 0);

      // Set PT info from ptInfo if available
      if (member.ptInfo) {
        setStartDate(member.ptInfo.startDate ? format(new Date(member.ptInfo.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
        setEndDate(member.ptInfo.endDate ? format(new Date(member.ptInfo.endDate), 'yyyy-MM-dd') : format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
        setGoals(member.ptInfo.goals || '');

        // Set trainer ID
        const trainerId = member.ptInfo.trainerId || '';
        console.log('Setting trainerId:', trainerId);
        setSelectedTrainerId(trainerId);
      }

      setNotes('');

      // Try to find matching package if packages are loaded
      if (ptPackages.length > 0) {
        const matchingPkg = ptPackages.find((pkg: CoursePackage) =>
          pkg.packageName === member.ptPackageName ||
          pkg.fees === member.ptPackageFees
        );
        console.log('Matching package found:', matchingPkg);
        if (matchingPkg) {
          setSelectedPackageId(matchingPkg.id);
          setSelectedPackage(matchingPkg);
        }
      }

      setIsInitialized(true);
    }
  }, [member, isInitialized]);

  // Set package when packages load after initialization
  useEffect(() => {
    if (isInitialized && member && ptPackages.length > 0 && !selectedPackageId) {
      const matchingPkg = ptPackages.find((pkg: CoursePackage) =>
        pkg.packageName === member.ptPackageName ||
        pkg.fees === member.ptPackageFees
      );
      if (matchingPkg) {
        setSelectedPackageId(matchingPkg.id);
        setSelectedPackage(matchingPkg);
      }
    }
  }, [ptPackages, isInitialized, member, selectedPackageId]);

  // Set trainer when trainers load after initialization
  useEffect(() => {
    if (isInitialized && member && trainers.length > 0 && !selectedTrainerId) {
      const trainerId = member.ptInfo?.trainerId || '';
      if (trainerId) {
        // Check if the trainer exists in the list
        const matchingTrainer = trainers.find((t: Trainer) => t.id === trainerId);
        if (matchingTrainer) {
          setSelectedTrainerId(trainerId);
        }
      }
    }
  }, [trainers, isInitialized, member, selectedTrainerId]);

  // Handle PT package selection
  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
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
    }
  };

  // Update PT Mutation
  const updatePTMutation = useMutation({
    mutationFn: (data: Partial<CreatePTAddon>) => gymOwnerService.updatePTAddon(memberId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      toast({ title: 'PT Membership updated successfully!' });
      navigate('/gym-owner/members');
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to update PT membership',
        description: err?.response?.data?.message || 'An error occurred',
        variant: 'destructive'
      });
    },
  });

  const handleSubmit = () => {
    if (!ptPackageName) {
      toast({ title: 'Please enter PT package name', variant: 'destructive' });
      return;
    }
    if (!selectedTrainerId) {
      toast({ title: 'Please select a trainer', variant: 'destructive' });
      return;
    }
    if (ptPackageFees <= 0) {
      toast({ title: 'Please enter valid PT fees', variant: 'destructive' });
      return;
    }

    const data: Partial<CreatePTAddon> = {
      ptPackageName,
      trainerId: selectedTrainerId,
      ptPackageFees,
      ptMaxDiscount,
      ptExtraDiscount,
      ptFinalFees,
      startDate,
      endDate,
      goals: goals || undefined,
      notes: notes || undefined,
    };

    updatePTMutation.mutate(data);
  };

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  const isLoading = authLoading || memberLoading || trainersLoading || packagesLoading;

  if (isLoading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <p className="text-lg text-muted-foreground">Member not found</p>
        <Button onClick={() => navigate('/gym-owner/members')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back to Members
        </Button>
      </div>
    );
  }

  // Check if member has PT
  if (member.memberType !== 'PT' && member.memberType !== 'REGULAR_PT') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <p className="text-lg text-muted-foreground">This member doesn't have PT membership</p>
        <Button onClick={() => navigate(`/gym-owner/members/${memberId}/add-pt`)}>
          <Dumbbell className="mr-2 h-4 w-4" />Add PT Membership
        </Button>
      </div>
    );
  }

  const memberName = member.firstName && member.lastName
    ? `${member.firstName} ${member.lastName}`
    : member.user?.name || 'Unknown';

  const isPaused = member.ptInfo?.isPaused || false;

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
                <Pencil className="h-7 w-7 text-blue-600" />
                Edit PT Membership
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Update personal training membership details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPaused && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-300">PT Paused</Badge>
            )}
            <Button variant="outline" onClick={() => navigate('/gym-owner/members')} className="hidden sm:flex">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={updatePTMutation.isPending} 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {updatePTMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {updatePTMutation.isPending ? 'Updating...' : 'Update PT Membership'}
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Member Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
              {member.memberPhoto ? <AvatarImage src={getImageUrl(member.memberPhoto)} /> : null}
              <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {getInitials(memberName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold">{memberName}</h2>
              <p className="text-sm text-muted-foreground">Member ID: {member.memberId || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500 text-white">REGULAR</Badge>
              <Badge className={isPaused ? 'bg-gray-500 text-white' : 'bg-purple-600 text-white'}>
                <Dumbbell className="h-3 w-3 mr-1" />PT {isPaused && '(Paused)'}
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
              <Select value={selectedPackageId} onValueChange={handlePackageSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select PT package..." />
                </SelectTrigger>
                <SelectContent>
                  {ptPackages.length === 0 ? (
                    <SelectItem value="no-packages" disabled>
                      No PT packages available
                    </SelectItem>
                  ) : (
                    ptPackages.map((pkg: CoursePackage) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        <div className="flex items-center justify-between gap-2">
                          <span>{pkg.packageName}</span>
                          <span className="text-xs text-muted-foreground">₹{pkg.fees.toLocaleString()}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Trainer */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-purple-500" /> Trainer <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedTrainerId} onValueChange={setSelectedTrainerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose trainer..." />
                </SelectTrigger>
                <SelectContent>
                  {trainers.map((trainer: Trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {trainer.firstName} {trainer.lastName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* BMI Calculator */}
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
                <Calendar className="h-4 w-4 text-blue-600" /> Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4 text-blue-600" /> End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
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
              <Label className="text-sm font-medium">Package Fees <span className="text-red-500">*</span></Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0"
                  value={ptPackageFees || ''}
                  onChange={(e) => setPtPackageFees(parseFloat(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
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
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Final PT Fees</p>
              <p className="text-2xl font-bold text-green-700 flex items-center">
                <IndianRupee className="h-5 w-5" />{ptFinalFees.toLocaleString('en-IN')}
              </p>
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
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Update Notes (Optional)</Label>
              <Textarea
                placeholder="Reason for update..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 p-4 sm:p-6">
          <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" /> Changes Summary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">PT Package</p>
              <p className="font-bold">{ptPackageName || 'N/A'}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Final Fees</p>
              <p className="font-bold">₹{ptFinalFees.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Trainer</p>
              <p className="font-bold">{trainers.find((t: Trainer) => t.id === selectedTrainerId)?.firstName || member.ptInfo?.trainerName || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Action */}
        <div className="sm:hidden pb-4">
          <Button
            onClick={handleSubmit}
            disabled={updatePTMutation.isPending}
            className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {updatePTMutation.isPending ? <Spinner className="h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
            {updatePTMutation.isPending ? 'Updating...' : 'Update PT Membership'}
          </Button>
        </div>
      </div>

      {/* BMI Calculator Modal */}
      <BMICalculator open={showBMICalculator} onOpenChange={setShowBMICalculator} />
    </div>
  );
}
