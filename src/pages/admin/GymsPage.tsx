import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  Building2,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Eye,
  FileText,
  History,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  Receipt,
  IndianRupee,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { adminService } from '@/services/admin.service';
import { toast } from '@/hooks/use-toast';
import { openWhatsApp, replaceTemplatePlaceholders, getTemplateById } from '@/utils/whatsapp';
import { WhatsAppFilledIcon } from '@/components/ui/icons';
import type { Gym, GymSubscriptionPlan, User, GymSubscriptionStatus, GymSubscriptionType, GymSubscriptionHistory, GymRenewalType, GymPaymentStatus } from '@/types';
import { getGymSubscriptionStatus, getGymDaysRemaining, getGymSubscriptionType } from '@/types';

const gymSchema = z.object({
  name: z.string().min(2, 'Gym name is required'),
  address1: z.string().min(1, 'Address 1 is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipcode: z.string().min(1, 'Zipcode is required').regex(/^\d+$/, 'Only numbers allowed'),
  mobileNo: z.string().min(1, 'Mobile No is required').regex(/^\d+$/, 'Only numbers allowed'),
  phoneNo: z.string().optional().refine((val) => !val || /^\d+$/.test(val), 'Only numbers allowed'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  gstRegNo: z.string().optional(),
  website: z.string().optional(),
  memberSize: z.string().optional().refine((val) => !val || /^\d+$/.test(val), 'Only numbers allowed'),
  note: z.string().optional(),
  subscriptionPlanId: z.string().min(1, 'Subscription Plan is required'),
});

type GymFormData = z.infer<typeof gymSchema>;

// Subscription action schema
const subscriptionActionSchema = z.object({
  subscriptionPlanId: z.string().min(1, 'Subscription plan is required'),
  subscriptionStart: z.string().optional(),
  paymentMode: z.string().optional(),
  paidAmount: z.coerce.number().min(0, 'Paid amount must be 0 or greater').optional(),
  extraDiscount: z.coerce.number().min(0, 'Discount must be 0 or greater').optional(),
  notes: z.string().optional(),
});

type SubscriptionActionFormData = z.infer<typeof subscriptionActionSchema>;

// Payment modes
const PAYMENT_MODES = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];

// Helper to format currency (handles string or number)
const formatCurrency = (amount: number | string, currency = 'INR') => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

// Helper to format date
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Subscription status badge component
// Shows expiry status (NEW/ACTIVE/EXPIRING_SOON/EXPIRED)
const SubscriptionStatusBadge = ({ status, daysRemaining }: { status: GymSubscriptionStatus; daysRemaining?: number | null }) => {
  const config = {
    NEW: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'No Subscription', icon: Plus },
    ACTIVE: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Active', icon: null },
    EXPIRING_SOON: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      label: daysRemaining !== null && daysRemaining !== undefined 
        ? (daysRemaining === 0 ? 'Expires Today' : `Expiring (${daysRemaining}d)`) 
        : 'Expiring Soon', 
      icon: AlertTriangle 
    },
    EXPIRED: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Expired', icon: null },
  };
  const { color, label, icon: Icon } = config[status];
  return (
    <Badge variant="outline" className={`${color} gap-1 font-medium`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
};

// Subscription type badge component  
// Shows if it's first subscription (NEW) or renewed (RENEWED)
const SubscriptionTypeBadge = ({ type }: { type: GymSubscriptionType }) => {
  if (type === 'NEW') {
    return (
      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
        1st Subscription
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
      Renewed
    </Badge>
  );
};

// Helper to extract error message from API response
const getApiErrorMessage = (error: any): string => {
  const responseData = error?.response?.data;

  // Check for validation errors array
  if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
    // Join all validation error messages
    return responseData.errors.map((err: { field?: string; message: string }) =>
      err.field ? `${err.field}: ${err.message}` : err.message
    ).join(', ');
  }

  // Fallback to message field or generic error
  return responseData?.message || error?.message || 'An error occurred';
};

// Helper to format date for WhatsApp message
const formatDateForWhatsApp = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Helper to send WhatsApp message for gym subscription expiring/expired
const handleGymSubscriptionWhatsApp = (gym: Gym, status: GymSubscriptionStatus) => {
  const templateId = status === 'EXPIRED' ? 'GYM_SUBSCRIPTION_EXPIRED' : 'GYM_SUBSCRIPTION_EXPIRING';
  const template = getTemplateById(templateId);
  if (!template) return;

  const messageData = {
    memberName: gym.name,
    memberPhone: gym.mobileNo || '',
    gymName: gym.name,
    planName: gym.subscriptionPlan?.name || 'N/A',
    planPrice: gym.subscriptionPlan?.price?.toLocaleString('en-IN') || 'N/A',
    amountPaid: gym.subscriptionPlan?.price?.toLocaleString('en-IN') || 'N/A',
    expiryDate: formatDateForWhatsApp(gym.subscriptionEnd),
  };

  const message = replaceTemplatePlaceholders(template.message, messageData);
  const result = openWhatsApp(gym.mobileNo, message);

  if (!result.success) {
    toast({
      title: 'Error',
      description: result.error || 'Failed to open WhatsApp',
      variant: 'destructive',
    });
  }
};

export function GymsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<GymSubscriptionStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignOwnerDialogOpen, setAssignOwnerDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [editPlanId, setEditPlanId] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string>('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const editLogoInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Extra discount states for create/edit gym dialogs
  const [createExtraDiscount, setCreateExtraDiscount] = useState<number>(0);
  const [editExtraDiscount, setEditExtraDiscount] = useState<number>(0);

  // Subscription action dialog states
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [subscriptionActionType, setSubscriptionActionType] = useState<'purchase' | 'renew' | 'change'>('purchase');

  // Subscription history dialog states
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState<string>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<GymSubscriptionHistory | null>(null);
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [planFilter, statusFilter]);

  // Convert statusFilter to API format (only pass valid server-side statuses)
  const apiStatusFilter = (statusFilter !== 'all')
    ? statusFilter as 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON'
    : undefined;

  // Main query for filtered gym list
  const { data, isLoading } = useQuery({
    queryKey: ['gyms', debouncedSearch, statusFilter, sortBy, sortOrder],
    queryFn: () => adminService.getGyms(1, 100, debouncedSearch, apiStatusFilter, sortBy, sortOrder),
  });

  // Separate query for all gyms (used for stats calculation)
  const { data: allGymsData } = useQuery({
    queryKey: ['gyms-all', debouncedSearch, sortBy, sortOrder],
    queryFn: () => adminService.getGyms(1, 100, debouncedSearch, undefined, sortBy, sortOrder),
  });

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: adminService.getSubscriptionPlans,
  });

  const { data: owners } = useQuery({
    queryKey: ['gym-owners'],
    queryFn: adminService.getGymOwners,
  });

  const { register, handleSubmit, reset, setValue, watch, clearErrors, formState: { errors } } = useForm<GymFormData>({
    resolver: zodResolver(gymSchema),
  });

  // Track create form selected plan
  const createSelectedPlanId = watch('subscriptionPlanId');
  const createSelectedPlan = useMemo(() => {
    return plans?.find((p: GymSubscriptionPlan) => p.id === createSelectedPlanId);
  }, [plans, createSelectedPlanId]);

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, clearErrors: clearErrorsEdit, formState: { errors: errorsEdit } } = useForm<GymFormData>({
    resolver: zodResolver(gymSchema),
  });

  // Track edit form selected plan
  const editSelectedPlan = useMemo(() => {
    return plans?.find((p: GymSubscriptionPlan) => p.id === editPlanId);
  }, [plans, editPlanId]);

  // Subscription action form
  const { 
    register: registerSubscription, 
    handleSubmit: handleSubmitSubscription, 
    reset: resetSubscription, 
    watch: watchSubscription,
    setValue: setValueSubscription,
    formState: { errors: errorsSubscription } 
  } = useForm<SubscriptionActionFormData>({
    resolver: zodResolver(subscriptionActionSchema),
    defaultValues: {
      paidAmount: 0,
    },
  });

  // Watch selected plan for price display
  const selectedSubscriptionPlanId = watchSubscription('subscriptionPlanId');
  const selectedSubscriptionPlan = useMemo(() => {
    return plans?.find((p: GymSubscriptionPlan) => p.id === selectedSubscriptionPlanId);
  }, [plans, selectedSubscriptionPlanId]);

  // Calculate prorated amount for upgrade/downgrade
  const proratedAmount = useMemo(() => {
    if (subscriptionActionType !== 'change' || !selectedGym || !selectedSubscriptionPlan) return null;
    
    const daysRemaining = getGymDaysRemaining(selectedGym);
    if (daysRemaining <= 0) return null;
    
    const currentPlan = selectedGym.subscriptionPlan;
    if (!currentPlan) return null;
    
    // Calculate daily rates
    const currentDailyRate = currentPlan.price / currentPlan.durationDays;
    const newDailyRate = selectedSubscriptionPlan.price / selectedSubscriptionPlan.durationDays;
    
    // Prorated difference for remaining days
    const difference = (newDailyRate - currentDailyRate) * daysRemaining;
    
    return {
      daysRemaining,
      currentPlanPrice: currentPlan.price,
      newPlanPrice: selectedSubscriptionPlan.price,
      difference: Math.round(difference),
      isUpgrade: newDailyRate > currentDailyRate,
    };
  }, [subscriptionActionType, selectedGym, selectedSubscriptionPlan]);

  // Subscription history query - only fetches when dialog is open and gym is selected
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['gym-subscription-history', selectedGym?.id, historyPage, historySearch, historyPaymentFilter, historyTypeFilter],
    queryFn: () => adminService.getGymSubscriptionHistory(selectedGym!.id, {
      page: historyPage,
      limit: 10,
      search: historySearch || undefined,
      sortBy: 'renewalDate',
      sortOrder: 'desc',
      paymentStatus: historyPaymentFilter !== 'all' ? historyPaymentFilter as GymPaymentStatus : undefined,
      renewalType: historyTypeFilter !== 'all' ? historyTypeFilter as GymRenewalType : undefined,
    }),
    enabled: historyDialogOpen && !!selectedGym?.id,
  });

  // Subscription action mutation
  const subscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionActionFormData) => {
      if (!selectedGym) throw new Error('No gym selected');
      
      return adminService.renewGymSubscription(selectedGym.id, {
        subscriptionPlanId: data.subscriptionPlanId,
        subscriptionStart: data.subscriptionStart || undefined,
        paymentMode: data.paymentMode || undefined,
        paidAmount: data.paidAmount || 0,
        extraDiscount: data.extraDiscount || 0,
        notes: data.notes || undefined,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['gym-subscription-history', selectedGym?.id] });
      setSubscriptionDialogOpen(false);
      setSelectedGym(null);
      resetSubscription();
      
      const actionLabel = {
        purchase: 'Subscription purchased',
        renew: 'Subscription renewed',
        change: result.renewalType === 'UPGRADE' ? 'Plan upgraded' : 'Plan downgraded',
      }[subscriptionActionType];
      
      toast({
        title: actionLabel,
        description: `${result.subscriptionPlan.name} - ${formatCurrency(result.amount)}`,
      });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error);
      toast({ title: 'Subscription action failed', description: message, variant: 'destructive' });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: GymFormData & { logo?: string }) => {
      // Prepare clean data - remove any undefined/null values
      const dataToSend: Record<string, any> = {};
      
      // Copy all form fields, filtering out empty values
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'logo') {
          dataToSend[key] = value;
        }
      });

      // Convert memberSize to number
      if (dataToSend.memberSize) {
        dataToSend.memberSize = parseInt(dataToSend.memberSize, 10);
      }

      // Include extra discount if provided
      if (createExtraDiscount > 0) {
        dataToSend.extraDiscount = createExtraDiscount;
      }

      // First create the gym without logo
      const createdGym = await adminService.createGym(dataToSend);
      
      // Then upload logo if file is selected (requires gym ID)
      if (logoFile && createdGym.id) {
        setIsUploadingLogo(true);
        try {
          await adminService.uploadGymLogo(createdGym.id, logoFile);
        } catch (error) {
          console.error('Failed to upload logo:', error);
          // Gym was created but logo upload failed - don't throw, just warn
          toast({ title: 'Gym created but logo upload failed', variant: 'destructive' });
        } finally {
          setIsUploadingLogo(false);
        }
      }
      
      return createdGym;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setDialogOpen(false);
      reset();
      setLogoFile(null);
      setLogoPreview('');
      setCreateExtraDiscount(0);
      toast({ title: 'Gym created successfully' });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error);
      toast({ title: 'Failed to create gym', description: message, variant: 'destructive' });
      console.error('Create gym error:', error?.response?.data || error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: GymFormData & { logo?: string } }) => {
      // Prepare clean data - remove any undefined/null values
      const dataToSend: Record<string, any> = {};
      
      // Copy all fields, filtering out empty values and logo
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'logo') {
          dataToSend[key] = value;
        }
      });

      // Convert memberSize to number
      if (dataToSend.memberSize) {
        dataToSend.memberSize = parseInt(dataToSend.memberSize, 10);
      }

      // Include extra discount if provided
      if (editExtraDiscount > 0) {
        dataToSend.extraDiscount = editExtraDiscount;
      }

      // Update the gym first
      const updatedGym = await adminService.updateGym(id, dataToSend);
      
      // Upload new logo if file is selected
      if (editLogoFile) {
        setIsUploadingLogo(true);
        try {
          await adminService.uploadGymLogo(id, editLogoFile);
        } catch (error) {
          console.error('Failed to upload logo:', error);
          toast({ title: 'Gym updated but logo upload failed', variant: 'destructive' });
        } finally {
          setIsUploadingLogo(false);
        }
      }
      
      return updatedGym;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setEditDialogOpen(false);
      setSelectedGym(null);
      setEditPlanId('');
      setEditLogoFile(null);
      setEditLogoPreview('');
      setEditExtraDiscount(0);
      resetEdit();
      toast({ title: 'Gym updated successfully' });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error);
      toast({ title: 'Failed to update gym', description: message, variant: 'destructive' });
      console.error('Update gym error:', error?.response?.data || error);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: adminService.toggleGymStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      toast({ title: 'Gym status updated successfully' });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error);
      toast({ title: 'Failed to update status', description: message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteGym,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      toast({ title: 'Gym deleted successfully' });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error);
      toast({ title: 'Failed to delete gym', description: message, variant: 'destructive' });
    },
  });

  const assignOwnerMutation = useMutation({
    mutationFn: ({ gymId, ownerId }: { gymId: string; ownerId: string }) =>
      adminService.assignGymOwner(gymId, ownerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setAssignOwnerDialogOpen(false);
      setSelectedGym(null);
      setSelectedOwnerId('');
      toast({ title: 'Owner assigned successfully' });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error);
      toast({ title: 'Failed to assign owner', description: message, variant: 'destructive' });
    },
  });

  const onSubmit = (formData: GymFormData) => {
    createMutation.mutate(formData);
  };

  const onEditSubmit = (formData: GymFormData) => {
    if (selectedGym) {
      // Only include logo if there's a valid logo value (filename)
      // If editLogoFile is set, mutation will handle upload and get new filename
      // Otherwise use existing logo filename from selectedGym
      const dataToSubmit = { ...formData };
      if (!editLogoFile && (selectedGym.gymLogo || selectedGym.logo)) {
        // Keep existing logo filename (not the full URL)
        (dataToSubmit as any).logo = selectedGym.gymLogo || selectedGym.logo;
      }
      updateMutation.mutate({ id: selectedGym.id, data: dataToSubmit });
    }
  };

  const handleEditClick = (gym: Gym) => {
    setSelectedGym(gym);
    setEditPlanId(gym.subscriptionPlanId || '');
    setEditLogoPreview(adminService.getGymLogoUrl(gym.gymLogo || gym.logo) || '');
    setEditLogoFile(null);
    resetEdit({
      name: gym.name,
      address1: gym.address1 || '',
      address2: gym.address2 || '',
      city: gym.city || '',
      state: gym.state || '',
      zipcode: gym.zipcode || '',
      mobileNo: gym.mobileNo || '',
      phoneNo: gym.phoneNo || '',
      email: gym.email || '',
      gstRegNo: gym.gstRegNo || '',
      website: gym.website || '',
      memberSize: gym.memberSize?.toString() || '',
      note: gym.note || '',
      subscriptionPlanId: gym.subscriptionPlanId || '',
    });
    setEditDialogOpen(true);
  };

  const handleViewClick = (gym: Gym) => {
    setSelectedGym(gym);
    setViewDialogOpen(true);
  };

  // Open subscription action dialog
  const openSubscriptionDialog = (gym: Gym, actionType: 'purchase' | 'renew' | 'change') => {
    setSelectedGym(gym);
    setSubscriptionActionType(actionType);
    
    // Pre-fill form
    resetSubscription({
      subscriptionPlanId: actionType === 'change' ? '' : (gym.subscriptionPlanId || ''),
      subscriptionStart: '',
      paymentMode: '',
      paidAmount: 0,
      extraDiscount: 0,
      notes: '',
    });
    
    setSubscriptionDialogOpen(true);
  };

  // Handle subscription form submit
  const onSubscriptionSubmit = (data: SubscriptionActionFormData) => {
    subscriptionMutation.mutate(data);
  };

  // Open subscription history dialog
  const openHistoryDialog = (gym: Gym) => {
    setSelectedGym(gym);
    setHistoryPage(1);
    setHistorySearch('');
    setHistoryPaymentFilter('all');
    setHistoryTypeFilter('all');
    setHistoryDialogOpen(true);
  };

  // View history record detail
  const viewHistoryDetail = (record: GymSubscriptionHistory) => {
    setSelectedHistoryRecord(record);
    setHistoryDetailOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Please select an image file', variant: 'destructive' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Image size should be less than 5MB', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditLogoFile(file);
          setEditLogoPreview(reader.result as string);
        } else {
          setLogoFile(file);
          setLogoPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (isEdit = false) => {
    if (isEdit) {
      setEditLogoFile(null);
      setEditLogoPreview('');
      if (editLogoInputRef.current) editLogoInputRef.current.value = '';
    } else {
      setLogoFile(null);
      setLogoPreview('');
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const availableOwners = Array.isArray(owners) ? owners.filter((o: User) => !o.ownedGym) : [];

  // Get gyms data from response
  // Note: subscriptionStatus filter is now applied server-side
  const serverFilteredGyms = data?.items || [];

  // All gyms (unfiltered by status) for stats calculation
  const allGymsForStats = allGymsData?.items || [];

  // Apply plan filter (client-side) to server-filtered results
  const filteredGyms = planFilter === 'all'
    ? serverFilteredGyms
    : serverFilteredGyms.filter((gym: Gym) => gym.subscriptionPlanId === planFilter);

  // Client-side pagination
  const totalPages = Math.ceil(filteredGyms.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const gyms = filteredGyms.slice(startIndex, startIndex + itemsPerPage);

  // Subscription stats - calculated from ALL gyms (not filtered by status)
  const subscriptionStats = useMemo(() => {
    const stats = {
      NEW: 0,
      ACTIVE: 0,
      EXPIRING_SOON: 0,
      EXPIRED: 0,
      totalSubscriptionAmount: 0,
      totalPaidAmount: 0,
      totalPendingAmount: 0
    };
    allGymsForStats.forEach((gym: Gym) => {
      const status = getGymSubscriptionStatus(gym);
      stats[status]++;
      // Sum up payment totals
      stats.totalSubscriptionAmount += gym.totalSubscriptionAmount || 0;
      stats.totalPaidAmount += gym.totalPaidAmount || 0;
      stats.totalPendingAmount += gym.totalPendingAmount || 0;
    });
    return stats;
  }, [allGymsForStats]);

  // Sort toggle handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1); // Reset to first page on sort change
  };

  // Sort icon component
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="ml-1 h-4 w-4" />
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!filteredGyms || filteredGyms.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8">';
    html += '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
    html += '<x:Name>Gyms Report</x:Name>';
    html += '<x:WorksheetOptions><x:FreezePanes/><x:FrozenNoSplit/><x:SplitHorizontal>1</x:SplitHorizontal><x:TopRowBottomPane>1</x:TopRowBottomPane><x:ActivePane>2</x:ActivePane></x:WorksheetOptions>';
    html += '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
    html += '<style>';
    html += 'table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }';
    html += 'th { background-color: #4F46E5; color: white; font-weight: bold; padding: 12px 8px; border: 1px solid #3730A3; text-align: left; }';
    html += 'td { border: 1px solid #E5E7EB; padding: 8px; }';
    html += 'tr:nth-child(even) { background-color: #F9FAFB; }';
    html += 'tr:hover { background-color: #F3F4F6; }';
    html += '.amount { color: #059669; font-weight: bold; }';
    html += '.due { color: #DC2626; font-weight: bold; }';
    html += '.active { color: #059669; font-weight: bold; }';
    html += '.inactive { color: #6B7280; font-weight: bold; }';
    html += '.expired { color: #DC2626; font-weight: bold; }';
    html += '</style></head><body>';

    html += '<table><thead><tr>';
    html += '<th>S.No</th>';
    html += '<th>Gym Name</th>';
    html += '<th>Address</th>';
    html += '<th>City</th>';
    html += '<th>State</th>';
    html += '<th>Zipcode</th>';
    html += '<th>Email</th>';
    html += '<th>Mobile No</th>';
    html += '<th>Phone No</th>';
    html += '<th>Website</th>';
    html += '<th>GST Reg No</th>';
    html += '<th>Member Size</th>';
    html += '<th>Owner Name</th>';
    html += '<th>Owner Email</th>';
    html += '<th>Subscription Plan</th>';
    html += '<th>Plan Price</th>';
    html += '<th>Total Amount</th>';
    html += '<th>Paid Amount</th>';
    html += '<th>Pending Amount</th>';
    html += '<th>Subscription Start</th>';
    html += '<th>Subscription End</th>';
    html += '<th>Days Remaining</th>';
    html += '<th>Subscription Status</th>';
    html += '<th>Gym Status</th>';
    html += '<th>Note</th>';
    html += '<th>Created At</th>';
    html += '</tr></thead><tbody>';

    filteredGyms.forEach((gym: Gym, index: number) => {
      const subscriptionStatus = getGymSubscriptionStatus(gym);
      const daysRemaining = getGymDaysRemaining(gym);
      const statusLabel = subscriptionStatus === 'EXPIRING_SOON' ? 'Expiring Soon' : subscriptionStatus === 'NEW' ? 'No Subscription' : subscriptionStatus;
      const statusClass = subscriptionStatus === 'ACTIVE' ? 'active' : subscriptionStatus === 'EXPIRED' ? 'expired' : '';

      html += '<tr>';
      html += `<td>${index + 1}</td>`;
      html += `<td>${gym.name || '-'}</td>`;
      html += `<td>${[gym.address1 || gym.address, gym.address2].filter(Boolean).join(', ') || '-'}</td>`;
      html += `<td>${gym.city || '-'}</td>`;
      html += `<td>${gym.state || '-'}</td>`;
      html += `<td>${gym.zipcode || '-'}</td>`;
      html += `<td>${gym.email || '-'}</td>`;
      html += `<td>${gym.mobileNo || '-'}</td>`;
      html += `<td>${gym.phoneNo || gym.phone || '-'}</td>`;
      html += `<td>${gym.website || '-'}</td>`;
      html += `<td>${gym.gstRegNo || '-'}</td>`;
      html += `<td>${gym.memberSize || '-'}</td>`;
      html += `<td>${gym.owner?.name || '-'}</td>`;
      html += `<td>${gym.owner?.email || '-'}</td>`;
      html += `<td>${gym.subscriptionPlan?.name || '-'}</td>`;
      html += `<td class="amount">${gym.subscriptionPlan?.price ? formatCurrency(gym.subscriptionPlan.price) : '-'}</td>`;
      html += `<td class="amount">${(gym.totalSubscriptionAmount || 0) > 0 ? formatCurrency(gym.totalSubscriptionAmount || 0) : '-'}</td>`;
      html += `<td class="amount">${(gym.totalPaidAmount || 0) > 0 ? formatCurrency(gym.totalPaidAmount || 0) : '-'}</td>`;
      html += `<td class="${(gym.totalPendingAmount || 0) > 0 ? 'due' : ''}">${(gym.totalPendingAmount || 0) > 0 ? formatCurrency(gym.totalPendingAmount || 0) : '-'}</td>`;
      html += `<td>${formatDate(gym.subscriptionStart)}</td>`;
      html += `<td>${formatDate(gym.subscriptionEnd)}</td>`;
      html += `<td>${daysRemaining !== null && daysRemaining !== undefined && daysRemaining >= 0 ? `${daysRemaining} days` : '-'}</td>`;
      html += `<td class="${statusClass}">${statusLabel}</td>`;
      html += `<td class="${gym.isActive ? 'active' : 'inactive'}">${gym.isActive ? 'Active' : 'Inactive'}</td>`;
      html += `<td>${gym.note || '-'}</td>`;
      html += `<td>${formatDate(gym.createdAt)}</td>`;
      html += '</tr>';
    });

    html += '</tbody></table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    a.download = `gyms_report_${timestamp}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Gyms report exported successfully' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gyms</h1>
          <p className="text-muted-foreground">Manage all gyms in the system</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToExcel}
            disabled={!filteredGyms || filteredGyms.length === 0}
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            reset();
            setLogoFile(null);
            setLogoPreview('');
            setCreateExtraDiscount(0);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Gym
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Gym</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                {/* Logo - takes 1 column */}
                <div className="row-span-3">
                  <Label className="text-xs">Gym Logo</Label>
                  <div className="mt-1">
                    {logoPreview ? (
                      <div className="relative inline-block">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeLogo(false)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Upload Logo</span>
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoChange(e, false)}
                    />
                  </div>
                </div>
                
                {/* Gym Name - takes 3 columns */}
                <div className="col-span-3">
                  <Label htmlFor="name" className="text-xs">Gym Name *</Label>
                  <Input id="name" {...register('name')} placeholder="Enter gym name" className="h-8" />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                
                {/* Address 1 */}
                <div className="col-span-3">
                  <Label htmlFor="address1" className="text-xs">Address 1 *</Label>
                  <Input id="address1" {...register('address1')} placeholder="Enter street address" className="h-8" />
                  {errors.address1 && <p className="text-xs text-red-500">{errors.address1.message}</p>}
                </div>
                
                {/* Address 2 */}
                <div className="col-span-2">
                  <Label htmlFor="address2" className="text-xs">Address 2</Label>
                  <Input id="address2" {...register('address2')} placeholder="Enter area/locality" className="h-8" />
                  {errors.address2 && <p className="text-xs text-red-500">{errors.address2.message}</p>}
                </div>
                
                {/* City */}
                <div>
                  <Label htmlFor="city" className="text-xs">City *</Label>
                  <Input id="city" {...register('city')} placeholder="Enter city" className="h-8" />
                  {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
                </div>
                
                {/* State */}
                <div>
                  <Label htmlFor="state" className="text-xs">State *</Label>
                  <Input id="state" {...register('state')} placeholder="Enter state" className="h-8" />
                  {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
                </div>
                
                {/* Zipcode */}
                <div>
                  <Label htmlFor="zipcode" className="text-xs">Zipcode *</Label>
                  <Input id="zipcode" {...register('zipcode')} placeholder="Enter zipcode" className="h-8" />
                  {errors.zipcode && <p className="text-xs text-red-500">{errors.zipcode.message}</p>}
                </div>
                
                {/* Mobile No */}
                <div>
                  <Label htmlFor="mobileNo" className="text-xs">Mobile No *</Label>
                  <Input
                    id="mobileNo"
                    {...register('mobileNo')}
                    placeholder="Enter mobile no"
                    className="h-8"
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.mobileNo && <p className="text-xs text-red-500">{errors.mobileNo.message}</p>}
                </div>

                {/* Phone No */}
                <div>
                  <Label htmlFor="phoneNo" className="text-xs">Phone No</Label>
                  <Input
                    id="phoneNo"
                    {...register('phoneNo')}
                    placeholder="Enter phone no"
                    className="h-8"
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.phoneNo && <p className="text-xs text-red-500">{errors.phoneNo.message}</p>}
                </div>
                
                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-xs">Email Id *</Label>
                  <Input id="email" type="email" {...register('email')} placeholder="Enter email" className="h-8" />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
                
                {/* GST Reg No */}
                <div>
                  <Label htmlFor="gstRegNo" className="text-xs">GST Reg. No</Label>
                  <Input id="gstRegNo" {...register('gstRegNo')} placeholder="Enter GST number" className="h-8" />
                  {errors.gstRegNo && <p className="text-xs text-red-500">{errors.gstRegNo.message}</p>}
                </div>

                {/* Website */}
                <div>
                  <Label htmlFor="website" className="text-xs">Website</Label>
                  <Input id="website" {...register('website')} placeholder="https://example.com" className="h-8" />
                  {errors.website && <p className="text-xs text-red-500">{errors.website.message}</p>}
                </div>

                {/* Member Size */}
                <div>
                  <Label htmlFor="memberSize" className="text-xs">Member Size</Label>
                  <Input
                    id="memberSize"
                    {...register('memberSize')}
                    placeholder="Enter expected members"
                    className="h-8"
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.memberSize && <p className="text-xs text-red-500">{errors.memberSize.message}</p>}
                </div>

                {/* Subscription Plan */}
                <div>
                  <Label className="text-xs">Subscription Plan *</Label>
                  <Select onValueChange={(value) => { setValue('subscriptionPlanId', value); clearErrors('subscriptionPlanId'); setCreateExtraDiscount(0); }}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(plans) && plans.map((plan: GymSubscriptionPlan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ₹{plan.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subscriptionPlanId && <p className="text-xs text-red-500">{errors.subscriptionPlanId.message}</p>}
                </div>

                {/* Plan Amount (readonly) */}
                <div>
                  <Label className="text-xs">Plan Amount</Label>
                  <Input className="h-8 bg-muted" value={createSelectedPlan ? `₹${createSelectedPlan.price}` : ''} readOnly />
                </div>

                {/* Extra Discount */}
                <div>
                  <Label className="text-xs">Extra Discount</Label>
                  <Input
                    className="h-8"
                    type="number"
                    min="0"
                    max={createSelectedPlan?.price || 0}
                    value={createExtraDiscount || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      const maxVal = createSelectedPlan?.price || 0;
                      setCreateExtraDiscount(Math.min(Math.max(0, val), maxVal));
                    }}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="0"
                  />
                  {createExtraDiscount > (createSelectedPlan?.price || 0) && (
                    <p className="text-xs text-red-500">Cannot exceed plan amount</p>
                  )}
                </div>

                {/* Final Amount (readonly) */}
                <div>
                  <Label className="text-xs">Final Amount</Label>
                  <Input className="h-8 bg-muted font-semibold" value={createSelectedPlan ? `₹${(createSelectedPlan.price - createExtraDiscount)}` : ''} readOnly />
                </div>

                {/* Note - full width */}
                <div className="col-span-4">
                  <Label htmlFor="note" className="text-xs">Note (Terms & Conditions on Receipts)</Label>
                  <Textarea id="note" {...register('note')} rows={2} placeholder="Enter terms and conditions for receipts..." className="resize-none" />
                  {errors.note && <p className="text-xs text-red-500">{errors.note.message}</p>}
                </div>
              </div>
              
              <Button type="submit" className="w-full h-9 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={createMutation.isPending || isUploadingLogo}>
                {isUploadingLogo ? 'Uploading Logo...' : createMutation.isPending ? 'Creating...' : 'Create Gym'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Subscription Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Subscription Amount Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-purple-700">{formatCurrency(subscriptionStats.totalSubscriptionAmount)}</p>
                <p className="text-xs text-purple-600">Total Subscription</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-green-600">Paid: {formatCurrency(subscriptionStats.totalPaidAmount)}</span>
              <span className="text-red-600">Due: {formatCurrency(subscriptionStats.totalPendingAmount)}</span>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'ACTIVE' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'all' : 'ACTIVE')}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{subscriptionStats.ACTIVE}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'EXPIRING_SOON' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'EXPIRING_SOON' ? 'all' : 'EXPIRING_SOON')}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{subscriptionStats.EXPIRING_SOON}</p>
                <p className="text-xs text-muted-foreground">Expiring Soon</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'EXPIRED' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'EXPIRED' ? 'all' : 'EXPIRED')}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{subscriptionStats.EXPIRED}</p>
                <p className="text-xs text-muted-foreground">Expired</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gyms by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Plan Filter Dropdown */}
            <div className="w-full sm:w-[180px]">
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {Array.isArray(plans) && plans.map((plan: GymSubscriptionPlan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Status Filter Dropdown */}
            <div className="w-full sm:w-[180px]">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as GymSubscriptionStatus | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRING_SOON">Expiring (incl. Today)</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                      <TableHead className="py-3">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center text-white hover:text-gray-200 font-semibold"
                        >
                          Gym
                          <SortIcon column="name" />
                        </button>
                      </TableHead>
                      <TableHead className="py-3">
                        <button
                          onClick={() => handleSort('email')}
                          className="flex items-center text-white hover:text-gray-200 font-semibold"
                        >
                          Contact
                          <SortIcon column="email" />
                        </button>
                      </TableHead>
                      <TableHead className="py-3 text-white font-semibold">Owner</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Plan</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Amount</TableHead>
                      <TableHead className="py-3">
                        <button
                          onClick={() => handleSort('subscriptionEnd')}
                          className="flex items-center text-white hover:text-gray-200 font-semibold"
                        >
                          Subscription
                          <SortIcon column="subscriptionEnd" />
                        </button>
                      </TableHead>
                      <TableHead className="py-3 text-white font-semibold">Status</TableHead>
                      <TableHead className="w-[80px] py-3 text-white font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gyms.length > 0 ? gyms.map((gym: Gym) => {
                      const subscriptionStatus = getGymSubscriptionStatus(gym);
                      const daysRemaining = getGymDaysRemaining(gym);
                      return (
                      <TableRow key={gym.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {gym.logo ? (
                              <img 
                                src={adminService.getGymLogoUrl(gym.logo)} 
                                alt={gym.name} 
                                className="h-10 w-10 rounded-lg object-cover border"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{gym.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {gym.address1 || gym.address || 'No address'}
                                {gym.city && `, ${gym.city}`}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{gym.email || '-'}</p>
                            <p className="text-sm text-muted-foreground">{gym.mobileNo || gym.phoneNo || gym.phone || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {gym.owner ? (
                            <div>
                              <p className="font-medium">{gym.owner.name}</p>
                              <p className="text-sm text-muted-foreground">{gym.owner.email}</p>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedGym(gym);
                                setAssignOwnerDialogOpen(true);
                              }}
                            >
                              Assign Owner
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          {gym.subscriptionPlan ? (
                            <Badge variant="secondary">{gym.subscriptionPlan.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">No plan</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {(gym.totalSubscriptionAmount || 0) > 0 ? (
                            <div className="space-y-0.5">
                              <p className="font-medium text-sm">{formatCurrency(gym.totalSubscriptionAmount || 0)}</p>
                              <div className="flex gap-2 text-xs">
                                <span className="text-green-600">Paid: {formatCurrency(gym.totalPaidAmount || 0)}</span>
                              </div>
                              {(gym.totalPendingAmount || 0) > 0 && (
                                <span className="text-xs text-red-600 font-medium">Due: {formatCurrency(gym.totalPendingAmount || 0)}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <SubscriptionStatusBadge status={subscriptionStatus} daysRemaining={daysRemaining} />
                              {/* Show subscription type (1st or Renewed) only if gym has/had a subscription */}
                              {subscriptionStatus !== 'NEW' && (
                                <SubscriptionTypeBadge type={getGymSubscriptionType(gym)} />
                              )}
                            </div>
                            {subscriptionStatus !== 'NEW' && gym.subscriptionEnd && (
                              <span className="text-xs text-muted-foreground">
                                {subscriptionStatus === 'EXPIRED' 
                                  ? `Expired ${formatDate(gym.subscriptionEnd)}`
                                  : `Expires ${formatDate(gym.subscriptionEnd)}`
                                }
                                {(subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'EXPIRING_SOON') && daysRemaining !== null && (
                                  <span className={daysRemaining <= 7 ? 'text-red-600 font-medium ml-1' : 'ml-1'}>
                                    ({daysRemaining === 0 ? 'Today!' : `${daysRemaining} days`})
                                  </span>
                                )}
                              </span>
                            )}
                            {/* Action Button based on status */}
                            <div className="mt-1">
                              {subscriptionStatus === 'NEW' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-7 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                  onClick={() => openSubscriptionDialog(gym, 'purchase')}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Purchase
                                </Button>
                              )}
                              {subscriptionStatus === 'EXPIRED' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-7 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                  onClick={() => openSubscriptionDialog(gym, 'renew')}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Renew
                                </Button>
                              )}
                              {(subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'EXPIRING_SOON') && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-7 text-xs"
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Manage
                                      <ChevronRight className="h-3 w-3 ml-1" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => openSubscriptionDialog(gym, 'renew')}>
                                      <RefreshCw className="mr-2 h-4 w-4 text-green-600" />
                                      Renew Subscription
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openSubscriptionDialog(gym, 'change')}>
                                      <TrendingUp className="mr-2 h-4 w-4 text-blue-600" />
                                      Change Plan
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={gym.isActive ? 'default' : 'secondary'}
                            className={gym.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800'}
                          >
                            {gym.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {/* WhatsApp button for Expiring and Expired gyms */}
                            {(subscriptionStatus === 'EXPIRING_SOON' || subscriptionStatus === 'EXPIRED') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-green-50"
                                onClick={() => handleGymSubscriptionWhatsApp(gym, subscriptionStatus)}
                                title={`Send WhatsApp to ${gym.name}`}
                              >
                                <WhatsAppFilledIcon size={16} className="text-green-600" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewClick(gym)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openHistoryDialog(gym)}>
                                  <History className="mr-2 h-4 w-4" />
                                  Subscription History
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditClick(gym)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleStatusMutation.mutate(gym.id)}>
                                  <Power className="mr-2 h-4 w-4" />
                                  {gym.isActive ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this gym?')) {
                                      deleteMutation.mutate(gym.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );}) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No gyms found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredGyms.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredGyms.length)} of {filteredGyms.length} gyms
                      {(planFilter !== 'all' || statusFilter !== 'all') && ` (filtered from ${allGymsForStats.length} total)`}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rows per page:</span>
                      <Select
                        value={String(itemsPerPage)}
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value));
                          setPage(1); // Reset to first page when changing items per page
                        }}
                      >
                        <SelectTrigger className="w-[70px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="40">40</SelectItem>
                          <SelectItem value="60">60</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === page ? 'default' : 'outline'}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Gym Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          resetEdit();
          setEditLogoFile(null);
          setEditLogoPreview('');
          setEditExtraDiscount(0);
          setSelectedGym(null);
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Gym</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              {/* Logo - takes 1 column */}
              <div className="row-span-3">
                <Label className="text-xs">Gym Logo</Label>
                <div className="mt-1">
                  {editLogoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={editLogoPreview}
                        alt="Logo preview"
                        className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeLogo(true)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => editLogoInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Upload Logo</span>
                    </div>
                  )}
                  <input
                    ref={editLogoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleLogoChange(e, true)}
                  />
                </div>
              </div>
              
              {/* Gym Name - takes 3 columns */}
              <div className="col-span-3">
                <Label htmlFor="edit-name" className="text-xs">Gym Name *</Label>
                <Input id="edit-name" {...registerEdit('name')} placeholder="Enter gym name" className="h-8" />
                {errorsEdit.name && <p className="text-xs text-red-500">{errorsEdit.name.message}</p>}
              </div>
              
              {/* Address 1 */}
              <div className="col-span-3">
                <Label htmlFor="edit-address1" className="text-xs">Address 1 *</Label>
                <Input id="edit-address1" {...registerEdit('address1')} placeholder="Enter street address" className="h-8" />
                {errorsEdit.address1 && <p className="text-xs text-red-500">{errorsEdit.address1.message}</p>}
              </div>
              
              {/* Address 2 */}
              <div className="col-span-2">
                <Label htmlFor="edit-address2" className="text-xs">Address 2</Label>
                <Input id="edit-address2" {...registerEdit('address2')} placeholder="Enter area/locality" className="h-8" />
                {errorsEdit.address2 && <p className="text-xs text-red-500">{errorsEdit.address2.message}</p>}
              </div>

              {/* City */}
              <div>
                <Label htmlFor="edit-city" className="text-xs">City *</Label>
                <Input id="edit-city" {...registerEdit('city')} placeholder="Enter city" className="h-8" />
                {errorsEdit.city && <p className="text-xs text-red-500">{errorsEdit.city.message}</p>}
              </div>

              {/* State */}
              <div>
                <Label htmlFor="edit-state" className="text-xs">State *</Label>
                <Input id="edit-state" {...registerEdit('state')} placeholder="Enter state" className="h-8" />
                {errorsEdit.state && <p className="text-xs text-red-500">{errorsEdit.state.message}</p>}
              </div>

              {/* Zipcode */}
              <div>
                <Label htmlFor="edit-zipcode" className="text-xs">Zipcode *</Label>
                <Input id="edit-zipcode" {...registerEdit('zipcode')} placeholder="Enter zipcode" className="h-8" />
                {errorsEdit.zipcode && <p className="text-xs text-red-500">{errorsEdit.zipcode.message}</p>}
              </div>

              {/* Mobile No */}
              <div>
                <Label htmlFor="edit-mobileNo" className="text-xs">Mobile No *</Label>
                <Input
                  id="edit-mobileNo"
                  {...registerEdit('mobileNo')}
                  placeholder="Enter mobile no"
                  className="h-8"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                {errorsEdit.mobileNo && <p className="text-xs text-red-500">{errorsEdit.mobileNo.message}</p>}
              </div>

              {/* Phone No */}
              <div>
                <Label htmlFor="edit-phoneNo" className="text-xs">Phone No</Label>
                <Input
                  id="edit-phoneNo"
                  {...registerEdit('phoneNo')}
                  placeholder="Enter phone no"
                  className="h-8"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                {errorsEdit.phoneNo && <p className="text-xs text-red-500">{errorsEdit.phoneNo.message}</p>}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="edit-email" className="text-xs">Email Id *</Label>
                <Input id="edit-email" type="email" {...registerEdit('email')} placeholder="Enter email" className="h-8" />
                {errorsEdit.email && <p className="text-xs text-red-500">{errorsEdit.email.message}</p>}
              </div>

              {/* GST Reg No */}
              <div>
                <Label htmlFor="edit-gstRegNo" className="text-xs">GST Reg. No</Label>
                <Input id="edit-gstRegNo" {...registerEdit('gstRegNo')} placeholder="Enter GST number" className="h-8" />
                {errorsEdit.gstRegNo && <p className="text-xs text-red-500">{errorsEdit.gstRegNo.message}</p>}
              </div>

              {/* Website */}
              <div>
                <Label htmlFor="edit-website" className="text-xs">Website</Label>
                <Input id="edit-website" {...registerEdit('website')} placeholder="https://example.com" className="h-8" />
                {errorsEdit.website && <p className="text-xs text-red-500">{errorsEdit.website.message}</p>}
              </div>

              {/* Member Size */}
              <div>
                <Label htmlFor="edit-memberSize" className="text-xs">Member Size</Label>
                <Input
                  id="edit-memberSize"
                  {...registerEdit('memberSize')}
                  placeholder="Enter expected members"
                  className="h-8"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                {errorsEdit.memberSize && <p className="text-xs text-red-500">{errorsEdit.memberSize.message}</p>}
              </div>

              {/* Subscription Plan */}
              <div>
                <Label className="text-xs">Subscription Plan *</Label>
                <Select
                  value={editPlanId}
                  onValueChange={(value) => {
                    setEditPlanId(value);
                    setValueEdit('subscriptionPlanId', value);
                    clearErrorsEdit('subscriptionPlanId');
                    setEditExtraDiscount(0);
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(plans) && plans.map((plan: GymSubscriptionPlan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ₹{plan.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errorsEdit.subscriptionPlanId && <p className="text-xs text-red-500">{errorsEdit.subscriptionPlanId.message}</p>}
              </div>

              {/* Plan Amount (readonly) */}
              <div>
                <Label className="text-xs">Plan Amount</Label>
                <Input className="h-8 bg-muted" value={editSelectedPlan ? `₹${editSelectedPlan.price}` : ''} readOnly />
              </div>

              {/* Extra Discount */}
              <div>
                <Label className="text-xs">Extra Discount</Label>
                <Input
                  className="h-8"
                  type="number"
                  min="0"
                  max={editSelectedPlan?.price || 0}
                  value={editExtraDiscount || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    const maxVal = editSelectedPlan?.price || 0;
                    setEditExtraDiscount(Math.min(Math.max(0, val), maxVal));
                  }}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0"
                />
                {editExtraDiscount > (editSelectedPlan?.price || 0) && (
                  <p className="text-xs text-red-500">Cannot exceed plan amount</p>
                )}
              </div>

              {/* Final Amount (readonly) */}
              <div>
                <Label className="text-xs">Final Amount</Label>
                <Input className="h-8 bg-muted font-semibold" value={editSelectedPlan ? `₹${(editSelectedPlan.price - editExtraDiscount)}` : ''} readOnly />
              </div>

              {/* Note - full width */}
              <div className="col-span-4">
                <Label htmlFor="edit-note" className="text-xs">Note (Terms & Conditions on Receipts)</Label>
                <Textarea id="edit-note" {...registerEdit('note')} rows={2} placeholder="Enter terms and conditions for receipts..." className="resize-none" />
                {errorsEdit.note && <p className="text-xs text-red-500">{errorsEdit.note.message}</p>}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 h-9" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-9 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={updateMutation.isPending || isUploadingLogo}>
                {isUploadingLogo ? 'Uploading Logo...' : updateMutation.isPending ? 'Updating...' : 'Update Gym'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Owner Dialog */}
      <Dialog open={assignOwnerDialogOpen} onOpenChange={setAssignOwnerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Owner to {selectedGym?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Owner</Label>
              <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an owner" />
                </SelectTrigger>
                <SelectContent>
                  {availableOwners.map((owner: User) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableOwners.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No available owners. Create a new gym owner first.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setAssignOwnerDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedOwnerId || assignOwnerMutation.isPending}
                onClick={() => {
                  if (selectedGym && selectedOwnerId) {
                    assignOwnerMutation.mutate({ gymId: selectedGym.id, ownerId: selectedOwnerId });
                  }
                }}
              >
                {assignOwnerMutation.isPending ? 'Assigning...' : 'Assign Owner'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Gym Details Dialog (Report View) */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gym Details Report
            </DialogTitle>
          </DialogHeader>
          {selectedGym && (
            <div className="space-y-4">
              {/* Logo and Header */}
              <div className="flex items-start gap-4 pb-3 border-b">
                {(selectedGym.gymLogo || selectedGym.logo) ? (
                  <img
                    src={adminService.getGymLogoUrl(selectedGym.gymLogo || selectedGym.logo)}
                    alt={selectedGym.name}
                    className="w-28 h-28 object-cover rounded-lg border shadow-sm"
                    onError={(e) => {
                      // Hide image on error and show fallback
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-28 h-28 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedGym.name}</h2>
                  <div className="flex gap-2 mt-1">
                    <Badge 
                      variant={selectedGym.isActive ? 'default' : 'secondary'}
                      className={selectedGym.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {selectedGym.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {selectedGym.subscriptionPlan && (
                      <Badge variant="outline">
                        {selectedGym.subscriptionPlan.name}
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Statistics in header */}
                {selectedGym._count && (
                  <div className="flex gap-3">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg text-center">
                      <p className="text-xl font-bold text-blue-600">{selectedGym._count.members || 0}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                    <div className="bg-green-50 px-4 py-2 rounded-lg text-center">
                      <p className="text-xl font-bold text-green-600">{selectedGym._count.trainers || 0}</p>
                      <p className="text-xs text-muted-foreground">Trainers</p>
                    </div>
                  </div>
                )}
              </div>

              {/* All Details in Grid */}
              <div className="grid grid-cols-4 gap-x-6 gap-y-2 text-sm">
                {/* Address Section */}
                <div className="col-span-4 font-semibold text-base border-b pb-1 mb-1">Address</div>
                <div>
                  <span className="text-muted-foreground text-xs">Address 1</span>
                  <p className="font-medium">{selectedGym.address1 || selectedGym.address || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Address 2</span>
                  <p className="font-medium">{selectedGym.address2 || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">City</span>
                  <p className="font-medium">{selectedGym.city || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">State / Zipcode</span>
                  <p className="font-medium">{selectedGym.state || '-'} {selectedGym.zipcode && `- ${selectedGym.zipcode}`}</p>
                </div>

                {/* Contact Section */}
                <div className="col-span-4 font-semibold text-base border-b pb-1 mb-1 mt-2">Contact</div>
                <div>
                  <span className="text-muted-foreground text-xs">Mobile No</span>
                  <p className="font-medium">{selectedGym.mobileNo || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Phone No</span>
                  <p className="font-medium">{selectedGym.phoneNo || selectedGym.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Email</span>
                  <p className="font-medium">{selectedGym.email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Website</span>
                  <p className="font-medium">
                    {selectedGym.website ? (
                      <a href={selectedGym.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                        {selectedGym.website}
                      </a>
                    ) : '-'}
                  </p>
                </div>

                {/* Business Details */}
                <div className="col-span-4 font-semibold text-base border-b pb-1 mb-1 mt-2">Business</div>
                <div>
                  <span className="text-muted-foreground text-xs">GST Reg. No</span>
                  <p className="font-medium">{selectedGym.gstRegNo || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Member Size</span>
                  <p className="font-medium">{selectedGym.memberSize || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Owner</span>
                  <p className="font-medium">{selectedGym.owner?.name || 'Not Assigned'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">Owner Email</span>
                  <p className="font-medium">{selectedGym.owner?.email || '-'}</p>
                </div>

                {/* Terms & Conditions */}
                {selectedGym.note && (
                  <>
                    <div className="col-span-4 font-semibold text-base border-b pb-1 mb-1 mt-2">Terms & Conditions (Receipt Note)</div>
                    <div className="col-span-4 bg-muted/50 p-2 rounded text-sm whitespace-pre-wrap max-h-20 overflow-y-auto">
                      {selectedGym.note}
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEditClick(selectedGym);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Gym
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Subscription Action Dialog */}
      <Dialog open={subscriptionDialogOpen} onOpenChange={(open) => {
        setSubscriptionDialogOpen(open);
        if (!open) {
          resetSubscription();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {subscriptionActionType === 'purchase' && 'Purchase Subscription'}
              {subscriptionActionType === 'renew' && 'Renew Subscription'}
              {subscriptionActionType === 'change' && 'Change Subscription Plan'}
            </DialogTitle>
          </DialogHeader>
          {selectedGym && (
            <form onSubmit={handleSubmitSubscription(onSubscriptionSubmit)} className="space-y-4">
              {/* Gym Info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedGym.name}</p>
                {selectedGym.subscriptionPlan && (
                  <p className="text-sm text-muted-foreground">
                    Current Plan: <span className="font-medium">{selectedGym.subscriptionPlan.name}</span>
                    {selectedGym.subscriptionEnd && (
                      <> (Expires: {formatDate(selectedGym.subscriptionEnd)})</>
                    )}
                  </p>
                )}
              </div>

              {/* Plan Selection */}
              <div className="space-y-2">
                <Label>Select Plan *</Label>
                <Select
                  value={selectedSubscriptionPlanId || ''}
                  onValueChange={(value) => setValueSubscription('subscriptionPlanId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subscription plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(plans) && plans.map((plan: GymSubscriptionPlan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{plan.name}</span>
                          <span className="text-muted-foreground ml-2">
                            {formatCurrency(plan.price)} / {plan.durationDays} days
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errorsSubscription.subscriptionPlanId && (
                  <p className="text-sm text-red-500">{errorsSubscription.subscriptionPlanId.message}</p>
                )}
              </div>

              {/* Selected Plan Details */}
              {selectedSubscriptionPlan && (
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Plan Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedSubscriptionPlan.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration:</span>
                    <span className="font-medium">{selectedSubscriptionPlan.durationDays} days</span>
                  </div>
                  {proratedAmount && subscriptionActionType === 'change' && (
                    <>
                      <div className="border-t my-2" />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Remaining Days:</span>
                        <span className="font-medium">{proratedAmount.daysRemaining} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          {proratedAmount.isUpgrade ? 'Additional Amount:' : 'Credit Amount:'}
                        </span>
                        <span className={`font-medium ${proratedAmount.isUpgrade ? 'text-red-600' : 'text-green-600'}`}>
                          {proratedAmount.isUpgrade ? '+' : '-'}{formatCurrency(Math.abs(proratedAmount.difference))}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Extra Discount */}
              {selectedSubscriptionPlan && (
                <div className="space-y-2">
                  <Label>Extra Discount</Label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedSubscriptionPlan.price}
                    {...registerSubscription('extraDiscount')}
                    placeholder="0"
                  />
                  {errorsSubscription.extraDiscount && (
                    <p className="text-sm text-red-500">{errorsSubscription.extraDiscount.message}</p>
                  )}
                  {(() => {
                    const discount = watchSubscription('extraDiscount') || 0;
                    const finalAmount = selectedSubscriptionPlan.price - discount;
                    return (
                      <div className="p-2 bg-green-50 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-green-800">Final Amount:</span>
                          <span className="font-bold text-green-800">{formatCurrency(Math.max(0, finalAmount))}</span>
                        </div>
                      </div>
                    );
                  })()}
                  {(watchSubscription('extraDiscount') || 0) > selectedSubscriptionPlan.price && (
                    <p className="text-sm text-red-500">Discount cannot exceed plan amount</p>
                  )}
                </div>
              )}

              {/* Start Date (optional) */}
              <div className="space-y-2">
                <Label>Start Date (Optional)</Label>
                <Input
                  type="date"
                  {...registerSubscription('subscriptionStart')}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">Leave blank to start immediately</p>
              </div>

              {/* Payment Mode */}
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={watchSubscription('paymentMode') || ''}
                  onValueChange={(value) => setValueSubscription('paymentMode', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>{mode.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Paid Amount */}
              <div className="space-y-2">
                <Label>Paid Amount</Label>
                <Input
                  type="number"
                  {...registerSubscription('paidAmount')}
                  placeholder="0"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  {...registerSubscription('notes')}
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSubscriptionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={subscriptionMutation.isPending}
                >
                  {subscriptionMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {subscriptionActionType === 'purchase' && 'Purchase'}
                      {subscriptionActionType === 'renew' && 'Renew'}
                      {subscriptionActionType === 'change' && 'Change Plan'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Subscription History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={(open) => {
        setHistoryDialogOpen(open);
        if (!open) {
          setSelectedGym(null);
          setHistoryPage(1);
          setHistorySearch('');
          setHistoryPaymentFilter('all');
          setHistoryTypeFilter('all');
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              Subscription History
              {selectedGym && (
                <Badge variant="outline" className="ml-2 font-normal">
                  {selectedGym.name}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 py-4 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by number or plan..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={historyPaymentFilter} onValueChange={(v) => { setHistoryPaymentFilter(v); setHistoryPage(1); }}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={historyTypeFilter} onValueChange={(v) => { setHistoryTypeFilter(v); setHistoryPage(1); }}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="RENEWAL">Renewal</SelectItem>
                  <SelectItem value="UPGRADE">Upgrade</SelectItem>
                  <SelectItem value="DOWNGRADE">Downgrade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-auto py-2">
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : !historyData?.items?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium">No subscription history found</p>
                <p className="text-sm">This gym has no subscription records yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyData.items.map((record: GymSubscriptionHistory) => {
                  const renewalTypeConfig: Record<GymRenewalType, { color: string; icon: any; label: string }> = {
                    NEW: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Plus, label: 'New' },
                    RENEWAL: { color: 'bg-green-100 text-green-800 border-green-200', icon: RotateCcw, label: 'Renewal' },
                    UPGRADE: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: TrendingUp, label: 'Upgrade' },
                    DOWNGRADE: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: TrendingDown, label: 'Downgrade' },
                  };
                  const paymentConfig: Record<GymPaymentStatus, { color: string; icon: any; label: string }> = {
                    PAID: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Paid' },
                    PARTIAL: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle, label: 'Partial' },
                    PENDING: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Pending' },
                  };
                  
                  const typeConf = renewalTypeConfig[record.renewalType] || renewalTypeConfig.NEW;
                  const payConf = paymentConfig[record.paymentStatus] || paymentConfig.PENDING;
                  const TypeIcon = typeConf.icon;
                  const PayIcon = payConf.icon;
                  
                  return (
                    <div 
                      key={record.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => viewHistoryDetail(record)}
                    >
                      {/* Mobile-first responsive layout */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Left: Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-medium text-primary">
                              {record.subscriptionNumber}
                            </span>
                            <Badge variant="outline" className={`${typeConf.color} gap-1 text-xs`}>
                              <TypeIcon className="h-3 w-3" />
                              {typeConf.label}
                            </Badge>
                          </div>
                          <p className="font-medium truncate">{record.subscriptionPlan?.name || 'Unknown Plan'}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {formatDate(record.subscriptionStart)} - {formatDate(record.subscriptionEnd)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Right: Payment Info */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                          <p className="font-bold text-lg">{formatCurrency(record.amount)}</p>
                          <Badge variant="outline" className={`${payConf.color} gap-1 text-xs`}>
                            <PayIcon className="h-3 w-3" />
                            {payConf.label}
                          </Badge>
                          {record.pendingAmount && Number(record.pendingAmount) > 0 && (
                            <p className="text-xs text-red-600">
                              Due: {formatCurrency(record.pendingAmount)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Previous Plan Info for Upgrade/Downgrade */}
                      {(record.renewalType === 'UPGRADE' || record.renewalType === 'DOWNGRADE') && record.previousPlanName && (
                        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                          <span>From: <span className="font-medium">{record.previousPlanName}</span></span>
                          {record.previousSubscriptionEnd && (
                            <span className="ml-2">(ended {formatDate(record.previousSubscriptionEnd)})</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {historyData && historyData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {historyData.pagination.page} of {historyData.pagination.totalPages}
                <span className="hidden sm:inline"> ({historyData.pagination.total} records)</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyPage >= historyData.pagination.totalPages}
                  onClick={() => setHistoryPage(p => p + 1)}
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Detail Dialog */}
      <Dialog open={historyDetailOpen} onOpenChange={setHistoryDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Subscription Details
            </DialogTitle>
          </DialogHeader>
          {selectedHistoryRecord && (() => {
            const record = selectedHistoryRecord;
            const renewalTypeConfig: Record<GymRenewalType, { color: string; icon: any; label: string }> = {
              NEW: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Plus, label: 'New Subscription' },
              RENEWAL: { color: 'bg-green-100 text-green-800 border-green-200', icon: RotateCcw, label: 'Renewal' },
              UPGRADE: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: TrendingUp, label: 'Plan Upgrade' },
              DOWNGRADE: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: TrendingDown, label: 'Plan Downgrade' },
            };
            const paymentConfig: Record<GymPaymentStatus, { color: string; icon: any; label: string }> = {
              PAID: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Paid' },
              PARTIAL: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle, label: 'Partial Payment' },
              PENDING: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Payment Pending' },
            };
            const typeConf = renewalTypeConfig[record.renewalType] || renewalTypeConfig.NEW;
            const payConf = paymentConfig[record.paymentStatus] || paymentConfig.PENDING;
            const TypeIcon = typeConf.icon;
            const PayIcon = payConf.icon;
            
            return (
              <div className="space-y-4">
                {/* Header with badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={`${typeConf.color} gap-1`}>
                    <TypeIcon className="h-3 w-3" />
                    {typeConf.label}
                  </Badge>
                  <Badge variant="outline" className={`${payConf.color} gap-1`}>
                    <PayIcon className="h-3 w-3" />
                    {payConf.label}
                  </Badge>
                  {record.isActive && (
                    <Badge className="bg-green-600">Current Active</Badge>
                  )}
                </div>

                {/* Subscription Number */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Subscription Number</p>
                  <p className="font-mono text-lg font-bold text-primary">{record.subscriptionNumber}</p>
                </div>

                {/* Plan Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Plan Name</p>
                    <p className="font-semibold">{record.subscriptionPlan?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Duration</p>
                    <p className="font-semibold">{record.subscriptionPlan?.durationDays || 0} days</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Start Date</p>
                    <p className="font-medium">{formatDate(record.subscriptionStart)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">End Date</p>
                    <p className="font-medium">{formatDate(record.subscriptionEnd)}</p>
                  </div>
                </div>

                {/* Previous Plan (for upgrade/downgrade) */}
                {(record.renewalType === 'UPGRADE' || record.renewalType === 'DOWNGRADE') && record.previousPlanName && (
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Previous Plan</p>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{record.previousPlanName}</p>
                      {record.previousSubscriptionEnd && (
                        <p className="text-sm text-muted-foreground">Ended: {formatDate(record.previousSubscriptionEnd)}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Details */}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Payment Details</p>
                  {(record.planAmount !== null && record.planAmount !== undefined) && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Plan Amount</p>
                        <p className="font-semibold">{formatCurrency(record.planAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Extra Discount</p>
                        <p className="font-semibold text-orange-600">{formatCurrency(record.extraDiscount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Final Amount</p>
                        <p className="text-xl font-bold">{formatCurrency(record.amount)}</p>
                      </div>
                    </div>
                  )}
                  {(record.planAmount === null || record.planAmount === undefined) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="text-xl font-bold">{formatCurrency(record.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Payment Mode</p>
                        <p className="font-medium">{record.paymentMode?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {(record.planAmount !== null && record.planAmount !== undefined) && (
                      <div>
                        <p className="text-xs text-muted-foreground">Payment Mode</p>
                        <p className="font-medium">{record.paymentMode?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Paid Amount</p>
                      <p className="font-semibold text-green-600">{formatCurrency(record.paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pending Amount</p>
                      <p className={`font-semibold ${Number(record.pendingAmount) > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {formatCurrency(record.pendingAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {record.notes && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{record.notes}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Renewal: {formatDate(record.renewalDate)}</span>
                  </div>
                  <span>Created: {formatDate(record.createdAt)}</span>
                </div>

                {/* Close Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setHistoryDetailOpen(false)}
                >
                  Close
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
