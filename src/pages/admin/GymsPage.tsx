import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Building2, MoreVertical, Edit, Trash2, Power, ChevronLeft, ChevronRight, Upload, X, Eye, FileText } from 'lucide-react';
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
import type { Gym, GymSubscriptionPlan, User } from '@/types';

const gymSchema = z.object({
  name: z.string().min(2, 'Gym name is required'),
  address1: z.string().min(1, 'Address 1 is required'),
  address2: z.string().min(1, 'Address 2 is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipcode: z.string().min(1, 'Zipcode is required').regex(/^\d+$/, 'Only numbers allowed'),
  mobileNo: z.string().min(1, 'Mobile No is required').regex(/^\d+$/, 'Only numbers allowed'),
  phoneNo: z.string().min(1, 'Phone No is required').regex(/^\d+$/, 'Only numbers allowed'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  gstRegNo: z.string().min(1, 'GST Reg. No is required'),
  website: z.string().min(1, 'Website is required'),
  note: z.string().min(1, 'Note is required'),
  subscriptionPlanId: z.string().min(1, 'Subscription Plan is required'),
});

type GymFormData = z.infer<typeof gymSchema>;

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

export function GymsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
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
  }, [planFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['gyms', debouncedSearch],
    queryFn: () => adminService.getGyms(1, 100, debouncedSearch),
  });

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: adminService.getSubscriptionPlans,
  });

  const { data: owners } = useQuery({
    queryKey: ['gym-owners'],
    queryFn: adminService.getGymOwners,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<GymFormData>({
    resolver: zodResolver(gymSchema),
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, formState: { errors: errorsEdit } } = useForm<GymFormData>({
    resolver: zodResolver(gymSchema),
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
      toast({ title: 'Gym created successfully' });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error);
      toast({ title: 'Failed to create gym', description: message, variant: 'destructive' });
      console.error('Create gym error:', error?.response?.data || error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Gym> }) => {
      // Prepare clean data - remove any undefined/null values
      const dataToSend: Record<string, any> = {};
      
      // Copy all fields, filtering out empty values and logo
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'logo') {
          dataToSend[key] = value;
        }
      });
      
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
      note: gym.note || '',
      subscriptionPlanId: gym.subscriptionPlanId || '',
    });
    setEditDialogOpen(true);
  };

  const handleViewClick = (gym: Gym) => {
    setSelectedGym(gym);
    setViewDialogOpen(true);
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

  // Get gyms data from response and apply client-side plan filter
  const allGyms = data?.items || [];
  const filteredGyms = planFilter === 'all' 
    ? allGyms 
    : allGyms.filter((gym: Gym) => gym.subscriptionPlanId === planFilter);
  
  // Client-side pagination
  const totalPages = Math.ceil(filteredGyms.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const gyms = filteredGyms.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gyms</h1>
          <p className="text-muted-foreground">Manage all gyms in the system</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            reset();
            setLogoFile(null);
            setLogoPreview('');
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
                <div className="row-span-2">
                  <Label className="text-xs">Gym Logo</Label>
                  <div className="mt-1">
                    {logoPreview ? (
                      <div className="relative inline-block">
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeLogo(false)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload</span>
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
                  <Label htmlFor="address2" className="text-xs">Address 2 *</Label>
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
                  <Input id="mobileNo" {...register('mobileNo')} placeholder="Enter mobile no" className="h-8" />
                  {errors.mobileNo && <p className="text-xs text-red-500">{errors.mobileNo.message}</p>}
                </div>
                
                {/* Phone No */}
                <div>
                  <Label htmlFor="phoneNo" className="text-xs">Phone No *</Label>
                  <Input id="phoneNo" {...register('phoneNo')} placeholder="Enter phone no" className="h-8" />
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
                  <Label htmlFor="gstRegNo" className="text-xs">GST Reg. No *</Label>
                  <Input id="gstRegNo" {...register('gstRegNo')} placeholder="Enter GST number" className="h-8" />
                  {errors.gstRegNo && <p className="text-xs text-red-500">{errors.gstRegNo.message}</p>}
                </div>
                
                {/* Website */}
                <div>
                  <Label htmlFor="website" className="text-xs">Website *</Label>
                  <Input id="website" {...register('website')} placeholder="https://example.com" className="h-8" />
                  {errors.website && <p className="text-xs text-red-500">{errors.website.message}</p>}
                </div>
                
                {/* Subscription Plan */}
                <div>
                  <Label className="text-xs">Subscription Plan *</Label>
                  <Select onValueChange={(value) => setValue('subscriptionPlanId', value)}>
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
                
                {/* Note - full width */}
                <div className="col-span-4">
                  <Label htmlFor="note" className="text-xs">Note (Terms & Conditions on Receipts) *</Label>
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
            <div className="w-full sm:w-[250px]">
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gym</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gyms.length > 0 ? gyms.map((gym: Gym) => (
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
                          <Badge 
                            variant={gym.isActive ? 'default' : 'secondary'}
                            className={gym.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800'}
                          >
                            {gym.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
                      {planFilter !== 'all' && ` (filtered from ${allGyms.length} total)`}
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
              <div className="row-span-2">
                <Label className="text-xs">Gym Logo</Label>
                <div className="mt-1">
                  {editLogoPreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={editLogoPreview} 
                        alt="Logo preview" 
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeLogo(true)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary"
                      onClick={() => editLogoInputRef.current?.click()}
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload</span>
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
                <Label htmlFor="edit-address2" className="text-xs">Address 2 *</Label>
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
                <Input id="edit-mobileNo" {...registerEdit('mobileNo')} placeholder="Enter mobile no" className="h-8" />
                {errorsEdit.mobileNo && <p className="text-xs text-red-500">{errorsEdit.mobileNo.message}</p>}
              </div>
              
              {/* Phone No */}
              <div>
                <Label htmlFor="edit-phoneNo" className="text-xs">Phone No *</Label>
                <Input id="edit-phoneNo" {...registerEdit('phoneNo')} placeholder="Enter phone no" className="h-8" />
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
                <Label htmlFor="edit-gstRegNo" className="text-xs">GST Reg. No *</Label>
                <Input id="edit-gstRegNo" {...registerEdit('gstRegNo')} placeholder="Enter GST number" className="h-8" />
                {errorsEdit.gstRegNo && <p className="text-xs text-red-500">{errorsEdit.gstRegNo.message}</p>}
              </div>
              
              {/* Website */}
              <div>
                <Label htmlFor="edit-website" className="text-xs">Website *</Label>
                <Input id="edit-website" {...registerEdit('website')} placeholder="https://example.com" className="h-8" />
                {errorsEdit.website && <p className="text-xs text-red-500">{errorsEdit.website.message}</p>}
              </div>
              
              {/* Subscription Plan */}
              <div>
                <Label className="text-xs">Subscription Plan *</Label>
                <Select 
                  value={editPlanId} 
                  onValueChange={(value) => {
                    setEditPlanId(value);
                    setValueEdit('subscriptionPlanId', value);
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
              
              {/* Note - full width */}
              <div className="col-span-4">
                <Label htmlFor="edit-note" className="text-xs">Note (Terms & Conditions on Receipts) *</Label>
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
                    className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                    onError={(e) => {
                      // Hide image on error and show fallback
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-primary" />
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
    </div>
  );
}
