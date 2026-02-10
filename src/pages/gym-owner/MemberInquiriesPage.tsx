import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Phone,
  Calendar,
  UserPlus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Upload,
  X,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { gymOwnerService } from '@/services/gymOwner.service';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/hooks/use-toast';
import type { MemberInquiry, CreateMemberInquiry, UpdateMemberInquiry } from '@/types';

// Helper to get today's date in required format
const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');
const getTodayDateTime = () => format(new Date(), "yyyy-MM-dd'T'HH:mm");

// Validation schema for member inquiry
const inquirySchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  contactNo: z.string()
    .min(10, 'Contact number must be at least 10 digits')
    .regex(/^\d+$/, 'Contact number must contain only numbers'),
  inquiryDate: z.string().min(1, 'Inquiry date is required'),
  dob: z.string().optional(),
  followUp: z.boolean().default(false),
  followUpDate: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender is required' }),
  address: z.string().optional(),
  heardAbout: z.string().optional(),
  comments: z.string().optional(),
  memberPhoto: z.string().optional(),
  height: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  referenceName: z.string().optional(),
  isActive: z.boolean().optional(),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

export function MemberInquiriesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // State management
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<MemberInquiry | null>(null);
  const [viewingInquiry, setViewingInquiry] = useState<MemberInquiry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Photo upload state
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      followUp: false,
      isActive: true,
      inquiryDate: getTodayDateTime(),
      dob: getTodayDate(),
      followUpDate: getTodayDateTime(),
    },
  });

  const followUpValue = watch('followUp');

  // Fetch inquiries
  const { data, isLoading, error } = useQuery({
    queryKey: ['member-inquiries', user?.id, page, limit, search, sortBy, sortOrder],
    queryFn: () => gymOwnerService.getMemberInquiries(
      user?.id || '',
      page,
      limit,
      search || undefined,
      sortBy,
      sortOrder
    ),
    enabled: !!user?.id,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateMemberInquiry) => gymOwnerService.createMemberInquiry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-inquiries'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Inquiry created successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create inquiry',
        description: error?.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberInquiry }) =>
      gymOwnerService.updateMemberInquiry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-inquiries'] });
      setDialogOpen(false);
      setEditingInquiry(null);
      reset();
      toast({ title: 'Inquiry updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update inquiry',
        description: error?.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: gymOwnerService.deleteMemberInquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-inquiries'] });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      toast({ title: 'Inquiry deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete inquiry',
        description: error?.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: gymOwnerService.toggleMemberInquiryStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-inquiries'] });
      toast({ title: 'Status updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update status',
        description: error?.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Form submission
  const onSubmit = (data: InquiryFormData) => {
    const payload = {
      ...data,
      inquiryDate: new Date(data.inquiryDate).toISOString(),
      dob: data.dob ? new Date(data.dob).toISOString() : undefined,
      followUpDate: data.followUp && data.followUpDate 
        ? new Date(data.followUpDate).toISOString() 
        : undefined,
    };

    if (editingInquiry) {
      updateMutation.mutate({ id: editingInquiry.id, data: payload as UpdateMemberInquiry });
    } else {
      createMutation.mutate(payload as CreateMemberInquiry);
    }
  };

  // Open edit dialog
  const handleEdit = (inquiry: MemberInquiry) => {
    setEditingInquiry(inquiry);
    setValue('fullName', inquiry.fullName);
    setValue('contactNo', inquiry.contactNo);
    setValue('inquiryDate', inquiry.inquiryDate ? format(new Date(inquiry.inquiryDate), "yyyy-MM-dd'T'HH:mm") : getTodayDateTime());
    setValue('dob', inquiry.dob ? format(new Date(inquiry.dob), 'yyyy-MM-dd') : getTodayDate());
    setValue('followUp', inquiry.followUp);
    setValue('followUpDate', inquiry.followUpDate ? format(new Date(inquiry.followUpDate), "yyyy-MM-dd'T'HH:mm") : getTodayDateTime());
    setValue('gender', inquiry.gender || 'Male');
    setValue('address', inquiry.address || '');
    setValue('heardAbout', inquiry.heardAbout || '');
    setValue('comments', inquiry.comments || '');
    setValue('height', inquiry.height || undefined);
    setValue('weight', inquiry.weight || undefined);
    setValue('referenceName', inquiry.referenceName || '');
    setValue('isActive', inquiry.isActive);
    setValue('memberPhoto', inquiry.memberPhoto || '');
    // Set photo preview if exists
    if (inquiry.memberPhoto) {
      setPhotoPreview(inquiry.memberPhoto);
    } else {
      setPhotoPreview('');
    }
    setPhotoFile(null);
    setDialogOpen(true);
  };

  // Open view dialog
  const handleView = (inquiry: MemberInquiry) => {
    setViewingInquiry(inquiry);
    setViewDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  // Sort handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Reset form and close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingInquiry(null);
    setPhotoFile(null);
    setPhotoPreview('');
    reset({
      followUp: false,
      isActive: true,
      inquiryDate: getTodayDateTime(),
      dob: getTodayDate(),
      followUpDate: getTodayDateTime(),
    });
  };

  // Open add dialog with default dates
  const handleOpenAddDialog = () => {
    reset({
      followUp: false,
      isActive: true,
      inquiryDate: getTodayDateTime(),
      dob: getTodayDate(),
      followUpDate: getTodayDateTime(),
    });
    setEditingInquiry(null);
    setPhotoFile(null);
    setPhotoPreview('');
    setDialogOpen(true);
  };

  // Handle photo file change
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, GIF, or WebP image.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB for passport size photo)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Photo must be less than 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhotoPreview(base64String);
      setValue('memberPhoto', base64String);
    };
    reader.readAsDataURL(file);
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setValue('memberPhoto', '');
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const inquiries = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Member Inquiries</h1>
          <p className="text-muted-foreground">Manage and track potential member inquiries</p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Inquiry
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, contact..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-red-500 mb-2">Failed to load inquiries</p>
              <p className="text-sm text-muted-foreground">{(error as Error)?.message || 'Unknown error'}</p>
            </div>
          ) : !inquiries.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No inquiries found</p>
              <p className="text-sm text-muted-foreground">Click "Add New Inquiry" to create your first inquiry</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                      <TableHead 
                        className="cursor-pointer hover:bg-white/10 py-3"
                        onClick={() => handleSort('fullName')}
                      >
                        <div className="flex items-center gap-1 text-white font-semibold">
                          Name
                          <ArrowUpDown className="h-4 w-4 text-gray-300" />
                        </div>
                      </TableHead>
                      <TableHead className="py-3 text-white font-semibold">Contact</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-white/10 py-3"
                        onClick={() => handleSort('inquiryDate')}
                      >
                        <div className="flex items-center gap-1 text-white font-semibold">
                          Inquiry Date
                          <ArrowUpDown className="h-4 w-4 text-gray-300" />
                        </div>
                      </TableHead>
                      <TableHead className="py-3 text-white font-semibold">Follow Up</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Gender</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Status</TableHead>
                      <TableHead className="w-[80px] py-3 text-white font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.map((inquiry: MemberInquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{inquiry.fullName}</p>
                            {inquiry.referenceName && (
                              <p className="text-xs text-muted-foreground">Ref: {inquiry.referenceName}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {inquiry.contactNo}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(inquiry.inquiryDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {inquiry.followUp ? (
                            <div>
                              <Badge variant="default" className="bg-blue-500">Follow Up</Badge>
                              {inquiry.followUpDate && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(inquiry.followUpDate), 'MMM dd, yyyy')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="secondary">No Follow Up</Badge>
                          )}
                        </TableCell>
                        <TableCell>{inquiry.gender || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={inquiry.isActive ? 'default' : 'secondary'}
                            className={inquiry.isActive ? 'bg-green-500' : ''}
                          >
                            {inquiry.isActive ? 'Active' : 'Inactive'}
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
                              <DropdownMenuItem onClick={() => handleView(inquiry)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(inquiry)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatusMutation.mutate(inquiry.id)}>
                                {inquiry.isActive ? (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteClick(inquiry.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {inquiries.map((inquiry: MemberInquiry) => (
                  <Card key={inquiry.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium">{inquiry.fullName}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {inquiry.contactNo}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(inquiry.inquiryDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            variant={inquiry.isActive ? 'default' : 'secondary'}
                            className={inquiry.isActive ? 'bg-green-500' : ''}
                          >
                            {inquiry.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {inquiry.followUp && (
                            <Badge variant="default" className="bg-blue-500">Follow Up</Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(inquiry)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(inquiry)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatusMutation.mutate(inquiry.id)}>
                            {inquiry.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteClick(inquiry.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {inquiries.length} of {pagination.total} inquiries
                      {' '}(Page {pagination.page} of {pagination.totalPages})
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rows per page:</span>
                      <Select
                        value={String(limit)}
                        onValueChange={(value) => {
                          setLimit(Number(value));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[70px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
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
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingInquiry ? 'Edit Inquiry' : 'Add New Inquiry'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Top Section: Photo + Basic Info */}
            <div className="flex gap-6">
              {/* Photo Upload - Left Side */}
              <div className="flex-shrink-0">
                <Label className="text-sm mb-2 block">Photo</Label>
                <div className="relative w-20 h-24 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  {photoPreview ? (
                    <>
                      <img
                        src={photoPreview}
                        alt="Member photo preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-1">
                      <User className="h-6 w-6 mx-auto text-gray-400" />
                      <span className="text-[10px] text-gray-400 block">No photo</span>
                    </div>
                  )}
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-20 mt-2 text-xs h-7"
                  title={photoFile ? photoFile.name : 'Upload photo'}
                >
                  <Upload className="mr-1 h-3 w-3" />
                  {photoPreview ? 'Change' : 'Upload'}
                </Button>
              </div>

              {/* Basic Info - Right Side */}
              <div className="flex-1 grid grid-cols-3 gap-3">
                {/* Full Name */}
                <div className="space-y-1">
                  <Label htmlFor="fullName" className="text-sm">Full Name *</Label>
                  <Input id="fullName" {...register('fullName')} placeholder="Full name" className="h-9" />
                  {errors.fullName && (
                    <p className="text-xs text-red-500">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Contact No */}
                <div className="space-y-1">
                  <Label htmlFor="contactNo" className="text-sm">Contact *</Label>
                  <Input 
                    id="contactNo" 
                    {...register('contactNo')} 
                    placeholder="Contact number"
                    className="h-9"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      target.value = target.value.replace(/[^0-9]/g, '');
                    }}
                  />
                  {errors.contactNo && (
                    <p className="text-xs text-red-500">{errors.contactNo.message}</p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <Label htmlFor="gender" className="text-sm">Gender *</Label>
                  <Select
                    onValueChange={(value) => setValue('gender', value as 'Male' | 'Female' | 'Other')}
                    defaultValue={editingInquiry?.gender}
                  >
                    <SelectTrigger className={`h-9 ${errors.gender ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-xs text-red-500">{errors.gender.message}</p>
                  )}
                </div>

                {/* Inquiry Date */}
                <div className="space-y-1">
                  <Label htmlFor="inquiryDate" className="text-sm">Inquiry Date *</Label>
                  <Input
                    id="inquiryDate"
                    type="datetime-local"
                    {...register('inquiryDate')}
                    className="h-9"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <Label htmlFor="dob" className="text-sm">Date of Birth</Label>
                  <Input id="dob" type="date" {...register('dob')} className="h-9" />
                </div>

                {/* Reference Name */}
                <div className="space-y-1">
                  <Label htmlFor="referenceName" className="text-sm">Reference</Label>
                  <Input
                    id="referenceName"
                    {...register('referenceName')}
                    placeholder="Referred by"
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Middle Section: Additional Details */}
            <div className="grid grid-cols-4 gap-3">
              {/* Height */}
              <div className="space-y-1">
                <Label htmlFor="height" className="text-sm">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  {...register('height')}
                  placeholder="Height"
                  className="h-9"
                />
              </div>

              {/* Weight */}
              <div className="space-y-1">
                <Label htmlFor="weight" className="text-sm">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  {...register('weight')}
                  placeholder="Weight"
                  className="h-9"
                />
              </div>

              {/* Heard About */}
              <div className="space-y-1">
                <Label htmlFor="heardAbout" className="text-sm">Heard About</Label>
                <Input
                  id="heardAbout"
                  {...register('heardAbout')}
                  placeholder="Social media, etc."
                  className="h-9"
                />
              </div>

              {/* Follow Up Toggle */}
              <div className="space-y-1">
                <Label className="text-sm">Follow Up</Label>
                <div className="flex items-center h-9 gap-2">
                  <Switch
                    id="followUp"
                    checked={followUpValue}
                    onCheckedChange={(checked) => setValue('followUp', checked)}
                  />
                  <span className="text-sm text-muted-foreground">{followUpValue ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Follow Up Date & Status Row */}
            <div className="grid grid-cols-4 gap-3">
              {/* Follow Up Date */}
              {followUpValue && (
                <div className="space-y-1">
                  <Label htmlFor="followUpDate" className="text-sm">Follow Up Date</Label>
                  <Input
                    id="followUpDate"
                    type="datetime-local"
                    {...register('followUpDate')}
                    className="h-9"
                  />
                </div>
              )}

              {/* Status (only for edit) */}
              {editingInquiry && (
                <div className="space-y-1">
                  <Label className="text-sm">Status</Label>
                  <div className="flex items-center h-9 gap-2">
                    <Switch
                      id="isActive"
                      checked={watch('isActive')}
                      onCheckedChange={(checked) => setValue('isActive', checked)}
                    />
                    <span className="text-sm text-muted-foreground">{watch('isActive') ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Address & Comments Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Address */}
              <div className="space-y-1">
                <Label htmlFor="address" className="text-sm">Address</Label>
                <Textarea
                  id="address"
                  {...register('address')}
                  placeholder="Enter address"
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Comments */}
              <div className="space-y-1">
                <Label htmlFor="comments" className="text-sm">Comments / Notes</Label>
                <Textarea
                  id="comments"
                  {...register('comments')}
                  placeholder="Any additional notes"
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {editingInquiry ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingInquiry ? 'Update Inquiry' : 'Create Inquiry'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          {viewingInquiry && (
            <div className="space-y-4">
              {/* Member Photo */}
              {viewingInquiry.memberPhoto && (
                <div className="flex justify-center">
                  <div className="w-24 h-28 border-2 border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={viewingInquiry.memberPhoto}
                      alt={`${viewingInquiry.fullName}'s photo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{viewingInquiry.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium">{viewingInquiry.contactNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inquiry Date</p>
                  <p className="font-medium">
                    {format(new Date(viewingInquiry.inquiryDate), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {viewingInquiry.dob 
                      ? format(new Date(viewingInquiry.dob), 'PPP') 
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{viewingInquiry.gender || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Height / Weight</p>
                  <p className="font-medium">
                    {viewingInquiry.height ? `${viewingInquiry.height} cm` : '-'} / 
                    {viewingInquiry.weight ? ` ${viewingInquiry.weight} kg` : ' -'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="font-medium">{viewingInquiry.referenceName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Heard About</p>
                  <p className="font-medium">{viewingInquiry.heardAbout || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={viewingInquiry.isActive ? 'default' : 'secondary'}
                    className={viewingInquiry.isActive ? 'bg-green-500' : ''}
                  >
                    {viewingInquiry.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Follow Up</p>
                  {viewingInquiry.followUp ? (
                    <div>
                      <Badge variant="default" className="bg-blue-500">Required</Badge>
                      {viewingInquiry.followUpDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(viewingInquiry.followUpDate), 'PPP')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Badge variant="secondary">Not Required</Badge>
                  )}
                </div>
              </div>
              {viewingInquiry.address && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{viewingInquiry.address}</p>
                </div>
              )}
              {viewingInquiry.comments && (
                <div>
                  <p className="text-sm text-muted-foreground">Comments</p>
                  <p className="font-medium">{viewingInquiry.comments}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => { setViewDialogOpen(false); handleEdit(viewingInquiry); }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Inquiry</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this inquiry? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MemberInquiriesPage;
