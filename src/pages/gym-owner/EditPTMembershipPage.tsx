import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addMonths } from 'date-fns';
import {
  ArrowLeft, Dumbbell, Calendar, IndianRupee, User, CheckCircle,
  Save, AlertTriangle, Pencil, Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const [sessionsTotal, setSessionsTotal] = useState(12);
  const [sessionDuration, setSessionDuration] = useState(60);
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

  // Sessions info
  const sessionsUsed = member?.ptInfo?.sessionsUsed || 0;
  const sessionsRemaining = sessionsTotal - sessionsUsed;

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
    if (member && member.ptInfo && !isInitialized && ptPackages.length > 0) {
      setPtPackageName(member.ptPackageName || '');
      setSelectedTrainerId(member.ptInfo.trainerId || '');
      setSessionsTotal(member.ptInfo.sessionsTotal || 12);
      setSessionDuration(member.ptInfo.sessionDuration || 60);
      setPtPackageFees(member.ptPackageFees || 0);
      setPtMaxDiscount(member.ptMaxDiscount || 0);
      setPtExtraDiscount(member.ptExtraDiscount || 0);
      setStartDate(member.ptInfo.startDate ? format(new Date(member.ptInfo.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
      setEndDate(member.ptInfo.endDate ? format(new Date(member.ptInfo.endDate), 'yyyy-MM-dd') : format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
      setGoals(member.ptInfo.goals || '');
      setNotes('');

      // Try to find matching package
      const matchingPkg = ptPackages.find((pkg: CoursePackage) =>
        pkg.packageName === member.ptPackageName || pkg.fees === member.ptPackageFees
      );
      if (matchingPkg) {
        setSelectedPackageId(matchingPkg.id);
      }
      setIsInitialized(true);
    }
  }, [member, ptPackages, isInitialized]);

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
      sessionsTotal,
      sessionDuration,
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/gym-owner/members')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Pencil className="h-4 w-4 text-white" />
                </div>
                Edit PT Membership
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Update PT training details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPaused && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-300">PT Paused</Badge>
            )}
            <Badge className="bg-blue-100 text-blue-700 border-blue-300">Edit PT</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Member Info Card */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-blue-100 shadow-lg">
                {member.memberPhoto ? <AvatarImage src={`${BACKEND_BASE_URL}${member.memberPhoto}`} /> : null}
                <AvatarFallback className="text-lg sm:text-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {getInitials(memberName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl font-bold">{memberName}</h2>
                <p className="text-sm text-muted-foreground">ID: {member.memberId || 'N/A'}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge className="bg-blue-500 text-white">REGULAR</Badge>
                  <Badge className={isPaused ? 'bg-gray-500 text-white' : 'bg-purple-600 text-white'}>
                    <Dumbbell className="h-3 w-3 mr-1" />PT {isPaused && '(Paused)'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Info Alert */}
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Session Usage Information
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  This member has used <strong>{sessionsUsed}</strong> out of <strong>{member.ptInfo?.sessionsTotal || 0}</strong> sessions.
                  You can increase total sessions but cannot reduce below used count.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current PT Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Current PT Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Sessions Used</p>
                <p className="text-lg font-bold text-blue-600">{sessionsUsed}</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">New Total</p>
                <p className="text-lg font-bold text-purple-600">{sessionsTotal}</p>
              </div>
              <div className={`p-3 rounded-lg text-center ${sessionsRemaining > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <p className={`text-xs ${sessionsRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>Remaining</p>
                <p className={`text-lg font-bold ${sessionsRemaining > 0 ? 'text-green-700' : 'text-red-700'}`}>{sessionsRemaining}</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Trainer</p>
                <p className="text-sm font-semibold truncate">{member.ptInfo?.trainerName || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PT Package Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-purple-500" />
              PT Package Details
            </CardTitle>
            <CardDescription>Update package and trainer details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>PT Package *</Label>
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
              <div className="space-y-2">
                <Label>Select Trainer *</Label>
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
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Start Date
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> End Date
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Health Tools</Label>
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
          </CardContent>
        </Card>

        {/* Fee Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-green-500" />
              Fee Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Package Fees *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={ptPackageFees || ''}
                    onChange={(e) => setPtPackageFees(parseFloat(e.target.value) || 0)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Max Discount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={ptMaxDiscount || ''}
                    onChange={(e) => setPtMaxDiscount(parseFloat(e.target.value) || 0)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Extra Discount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={ptExtraDiscount || ''}
                    onChange={(e) => setPtExtraDiscount(parseFloat(e.target.value) || 0)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 font-medium mb-1">Final PT Fees</p>
                <p className="text-lg sm:text-xl font-bold text-green-700 flex items-center justify-center">
                  <IndianRupee className="h-4 w-4" />{ptFinalFees.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals & Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>PT Goals (Optional)</Label>
                <Textarea
                  placeholder="e.g., Weight loss, Muscle building, Fitness improvement..."
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Update Notes (Optional)</Label>
                <Textarea
                  placeholder="Reason for update..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <CardContent className="p-4 sm:p-6">
            <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" /> Changes Summary
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                <p className="text-xs text-muted-foreground">New Total Sessions</p>
                <p className="font-bold">{sessionsTotal}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                <p className="text-xs text-muted-foreground">Remaining Sessions</p>
                <p className="font-bold">{sessionsRemaining}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                <p className="text-xs text-muted-foreground">Final Fees</p>
                <p className="font-bold">₹{ptFinalFees.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-bold">{sessionDuration} min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/gym-owner/members')}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updatePTMutation.isPending}
            className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {updatePTMutation.isPending ? (
              <><Spinner className="h-4 w-4 mr-2" />Updating PT...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Update PT Membership</>
            )}
          </Button>
        </div>
      </div>

      {/* BMI Calculator Modal */}
      <BMICalculator open={showBMICalculator} onOpenChange={setShowBMICalculator} />
    </div>
  );
}
