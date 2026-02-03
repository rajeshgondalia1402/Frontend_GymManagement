import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
  Plus,
  Dumbbell,
  MoreVertical,
  Edit,
  Users,
  Search,
  X,
  Camera,
  Upload,
  ToggleLeft,
  ToggleRight,
  Phone,
  IndianRupee,
  Award,
  Briefcase,
  Eye,
  EyeOff,
  Calendar,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Lock,
  ChevronDown,
  Mail,
  Target,
  Clock,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { gymOwnerService } from '@/services/gymOwner.service';
import { BACKEND_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import type { Trainer, TrainerPTMember, TrainerPTMembersResponse } from '@/types';

const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');

const trainerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  specialization: z.string().optional(),
  experience: z.coerce.number().int().min(0).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dateOfBirth: z.string().optional(),
  joiningDate: z.string().optional(),
  salary: z.coerce.number().min(0).optional(),
  idProofType: z.string().optional(),
});

type TrainerFormData = z.infer<typeof trainerSchema>;

const GENDERS = ['Male', 'Female', 'Other'];
const ID_PROOF_TYPES = ['Aadhar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID'];
const ITEMS_PER_PAGE = 10;

export function TrainersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState<Trainer | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingTrainer, setViewingTrainer] = useState<Trainer | null>(null);

  // Search, Sort & Pagination
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(ITEMS_PER_PAGE);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  // Expanded trainer row states
  const [expandedTrainerId, setExpandedTrainerId] = useState<string | null>(null);
  const [ptMembersData, setPtMembersData] = useState<Record<string, TrainerPTMembersResponse>>({});
  const [ptMembersLoading, setPtMembersLoading] = useState<Record<string, boolean>>({});
  const [ptMembersPage, setPtMembersPage] = useState<Record<string, number>>({});
  const [ptMembersSearch, setPtMembersSearch] = useState<Record<string, string>>({});

  // File upload states
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [docPreview, setDocPreview] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: trainers, isLoading, error } = useQuery({
    queryKey: ['trainers'],
    queryFn: gymOwnerService.getTrainers,
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TrainerFormData>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      joiningDate: getTodayDate(),
    },
  });

  const isEditMode = !!editingTrainer;

  // Reset form and file states when dialog is closed
  useEffect(() => {
    if (!dialogOpen) {
      setEditingTrainer(null);
      setPhotoFile(null);
      setDocFile(null);
      setPhotoPreview('');
      setDocPreview('');
      reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        specialization: '',
        experience: undefined,
        gender: undefined,
        dateOfBirth: '',
        joiningDate: getTodayDate(),
        salary: undefined,
        idProofType: '',
      });
    }
  }, [dialogOpen, reset]);

  // Populate form when editing
  useEffect(() => {
    if (editingTrainer && dialogOpen) {
      reset({
        firstName: editingTrainer.firstName || '',
        lastName: editingTrainer.lastName || '',
        email: editingTrainer.email || editingTrainer.user?.email || '',
        password: editingTrainer.password || '',
        phone: editingTrainer.phone || '',
        specialization: editingTrainer.specialization || '',
        experience: editingTrainer.experience || undefined,
        gender: editingTrainer.gender as any,
        dateOfBirth: editingTrainer.dateOfBirth ? format(new Date(editingTrainer.dateOfBirth), 'yyyy-MM-dd') : '',
        joiningDate: editingTrainer.joiningDate ? format(new Date(editingTrainer.joiningDate), 'yyyy-MM-dd') : '',
        salary: editingTrainer.salary || undefined,
        idProofType: editingTrainer.idProofType || '',
      });

      setPhotoPreview(editingTrainer.trainerPhoto ? `${BACKEND_BASE_URL}${editingTrainer.trainerPhoto}` : '');
      setDocPreview(editingTrainer.idProofDocument ? `${BACKEND_BASE_URL}${editingTrainer.idProofDocument}` : '');
    }
  }, [editingTrainer, dialogOpen, reset]);

  const createMutation = useMutation({
    mutationFn: gymOwnerService.createTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      setDialogOpen(false);
      toast({ title: 'Trainer created successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create trainer', description: err?.response?.data?.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => gymOwnerService.updateTrainer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      setDialogOpen(false);
      toast({ title: 'Trainer updated successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update trainer', description: err?.response?.data?.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gymOwnerService.deleteTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      setDeleteDialogOpen(false);
      setTrainerToDelete(null);
      toast({ title: 'Trainer deleted successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to delete trainer', description: err?.response?.data?.message, variant: 'destructive' });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: gymOwnerService.toggleTrainerStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      toast({ title: 'Trainer status updated successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to toggle status', description: err?.response?.data?.message, variant: 'destructive' });
    },
  });

  const onSubmit = (formData: TrainerFormData) => {
    const fd = new FormData();

    fd.append('firstName', formData.firstName);
    fd.append('lastName', formData.lastName);
    fd.append('email', formData.email);
    if (formData.password) fd.append('password', formData.password);
    fd.append('phone', formData.phone);
    if (formData.specialization) fd.append('specialization', formData.specialization);
    if (formData.experience !== undefined) fd.append('experience', String(formData.experience));
    if (formData.gender) fd.append('gender', formData.gender);
    if (formData.dateOfBirth) fd.append('dateOfBirth', formData.dateOfBirth);
    if (formData.joiningDate) fd.append('joiningDate', formData.joiningDate);
    if (formData.salary !== undefined) fd.append('salary', String(formData.salary));
    if (formData.idProofType) fd.append('idProofType', formData.idProofType);

    if (photoFile) fd.append('trainerPhoto', photoFile);
    if (docFile) fd.append('idProofDocument', docFile);

    if (isEditMode && editingTrainer) {
      updateMutation.mutate({ id: editingTrainer.id, data: fd });
    } else {
      createMutation.mutate(fd);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'doc') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = type === 'photo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: 'File too large', variant: 'destructive' });
      return;
    }
    if (type === 'photo') {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setDocFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setDocPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setDocPreview(file.name);
      }
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setDialogOpen(true);
  };

  const handleView = (trainer: Trainer) => {
    setViewingTrainer(trainer);
    setViewDialogOpen(true);
  };

  const confirmDelete = () => {
    if (trainerToDelete) {
      deleteMutation.mutate(trainerToDelete.id);
    }
  };

  const handleToggleStatus = (trainer: Trainer) => {
    toggleStatusMutation.mutate(trainer.id);
  };

  // Fetch PT members for a trainer
  const fetchTrainerPTMembers = async (trainerId: string, page: number = 1, search: string = '') => {
    setPtMembersLoading(prev => ({ ...prev, [trainerId]: true }));
    try {
      const response = await gymOwnerService.getTrainerPTMembers(trainerId, { page, limit: 5, search });
      setPtMembersData(prev => ({ ...prev, [trainerId]: response }));
      setPtMembersPage(prev => ({ ...prev, [trainerId]: page }));
    } catch (error) {
      console.error('Failed to fetch PT members:', error);
      toast({ title: 'Failed to load PT members', variant: 'destructive' });
    } finally {
      setPtMembersLoading(prev => ({ ...prev, [trainerId]: false }));
    }
  };

  // Handle trainer row click to expand/collapse
  const handleTrainerRowClick = (trainer: Trainer, e: React.MouseEvent) => {
    // Prevent expansion if clicking on action buttons or status badge
    if ((e.target as HTMLElement).closest('button, [role="menuitem"], .badge-status')) {
      return;
    }

    const trainerId = trainer.id;
    if (expandedTrainerId === trainerId) {
      setExpandedTrainerId(null);
    } else {
      setExpandedTrainerId(trainerId);
      // Fetch PT members if not already loaded
      if (!ptMembersData[trainerId]) {
        fetchTrainerPTMembers(trainerId);
      }
    }
  };

  // Handle PT members pagination
  const handlePtMembersPageChange = (trainerId: string, newPage: number) => {
    fetchTrainerPTMembers(trainerId, newPage, ptMembersSearch[trainerId] || '');
  };

  // Handle PT members search
  const handlePtMembersSearch = (trainerId: string, search: string) => {
    setPtMembersSearch(prev => ({ ...prev, [trainerId]: search }));
    fetchTrainerPTMembers(trainerId, 1, search);
  };

  // Calculate days remaining
  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(parseISO(endDate), new Date());
    return days > 0 ? days : 0;
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  const getTrainerName = (trainer: Trainer) => {
    if (trainer.firstName && trainer.lastName) {
      return `${trainer.firstName} ${trainer.lastName}`;
    }
    return trainer.user?.name || 'Unknown';
  };

  const getTrainerEmail = (trainer: Trainer) => {
    return trainer.email || trainer.user?.email || '';
  };

  // Filter and sort trainers
  const trainersList = Array.isArray(trainers) ? trainers : [];

  const filteredTrainers = trainersList.filter(trainer => {
    const name = getTrainerName(trainer).toLowerCase();
    const email = getTrainerEmail(trainer).toLowerCase();
    const phone = (trainer.phone || '').toLowerCase();
    const specialization = (trainer.specialization || '').toLowerCase();
    const searchLower = debouncedSearch.toLowerCase();

    const matchesSearch = !debouncedSearch ||
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower) ||
      specialization.includes(searchLower);

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && trainer.isActive) ||
      (statusFilter === 'inactive' && !trainer.isActive);

    const matchesGender = genderFilter === 'all' || trainer.gender === genderFilter;

    return matchesSearch && matchesStatus && matchesGender;
  });

  // Sort trainers
  const sortedTrainers = [...filteredTrainers].sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortBy) {
      case 'firstName':
        aVal = getTrainerName(a).toLowerCase();
        bVal = getTrainerName(b).toLowerCase();
        break;
      case 'email':
        aVal = getTrainerEmail(a).toLowerCase();
        bVal = getTrainerEmail(b).toLowerCase();
        break;
      case 'phone':
        aVal = a.phone || '';
        bVal = b.phone || '';
        break;
      case 'specialization':
        aVal = a.specialization || '';
        bVal = b.specialization || '';
        break;
      case 'experience':
        aVal = a.experience || 0;
        bVal = b.experience || 0;
        break;
      case 'salary':
        aVal = a.salary || 0;
        bVal = b.salary || 0;
        break;
      case 'joiningDate':
        aVal = a.joiningDate ? new Date(a.joiningDate).getTime() : 0;
        bVal = b.joiningDate ? new Date(b.joiningDate).getTime() : 0;
        break;
      default:
        aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Pagination
  const totalItems = sortedTrainers.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedTrainers = sortedTrainers.slice((page - 1) * limit, page * limit);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const SortableHeader = ({ column, label }: { column: string; label: string }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === column ? (
          sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Trainers</h1>
          <p className="text-muted-foreground">Manage gym trainers and their profiles</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Trainer
        </Button>
      </div>

      {/* Filters & Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, email, phone, specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {/* Gender Filter */}
            <Select value={genderFilter} onValueChange={(val) => { setGenderFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gender</SelectItem>
                {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8" /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-red-500 mb-2">Failed to load trainers</p>
            </div>
          ) : paginatedTrainers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No trainers found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch || statusFilter !== 'all' || genderFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first trainer to get started'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead className="w-[50px]">#</TableHead>
                      <SortableHeader column="firstName" label="Trainer" />
                      <SortableHeader column="phone" label="Phone" />
                      <SortableHeader column="specialization" label="Specialization" />
                      <SortableHeader column="experience" label="Experience" />
                      <SortableHeader column="salary" label="Salary" />
                      <SortableHeader column="joiningDate" label="Joining Date" />
                      <TableHead>PT Members</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTrainers.map((trainer: Trainer, index: number) => {
                      const trainerName = getTrainerName(trainer);
                      const trainerEmail = getTrainerEmail(trainer);
                      const photoUrl = trainer.trainerPhoto ? `${BACKEND_BASE_URL}${trainer.trainerPhoto}` : '';
                      const isExpanded = expandedTrainerId === trainer.id;
                      const trainerPtData = ptMembersData[trainer.id];
                      const isLoadingPtMembers = ptMembersLoading[trainer.id];
                      const currentPtPage = ptMembersPage[trainer.id] || 1;

                      return (
                        <React.Fragment key={trainer.id}>
                          <TableRow
                            className={`cursor-pointer hover:bg-muted/50 transition-colors ${isExpanded ? 'bg-muted/30 border-l-4 border-l-primary' : ''}`}
                            onClick={(e) => handleTrainerRowClick(trainer, e)}
                          >
                            <TableCell className="w-[40px]">
                              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </TableCell>
                            <TableCell className="font-medium">
                              {(page - 1) * limit + index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  {photoUrl ? <AvatarImage src={photoUrl} /> : null}
                                  <AvatarFallback className="text-xs">{getInitials(trainerName)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{trainerName}</p>
                                  <p className="text-xs text-muted-foreground">{trainerEmail}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{trainer.phone || '-'}</TableCell>
                            <TableCell>
                              {trainer.specialization ? (
                                <Badge variant="outline" className="text-xs">{trainer.specialization}</Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {trainer.experience !== undefined && trainer.experience !== null
                                ? `${trainer.experience} ${trainer.experience === 1 ? 'year' : 'years'}`
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {trainer.salary !== undefined && trainer.salary !== null ? (
                                <span className="flex items-center text-green-600 font-medium text-sm">
                                  <IndianRupee className="h-3 w-3" />{trainer.salary.toLocaleString('en-IN')}
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {trainer.joiningDate
                                ? format(new Date(trainer.joiningDate), 'MMM dd, yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm text-primary">{trainer.ptMemberCount ?? trainer._count?.members ?? 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={trainer.isActive ? 'default' : 'secondary'}
                                className={`badge-status cursor-pointer ${trainer.isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 text-white hover:bg-gray-600'}`}
                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(trainer); }}
                              >
                                {trainer.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleView(trainer)}>
                                    <Eye className="mr-2 h-4 w-4" />View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(trainer)}>
                                    <Edit className="mr-2 h-4 w-4" />Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleStatus(trainer)}>
                                    {trainer.isActive ? (
                                      <><ToggleLeft className="mr-2 h-4 w-4" />Deactivate</>
                                    ) : (
                                      <><ToggleRight className="mr-2 h-4 w-4" />Activate</>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>

                          {/* Expanded PT Members Section */}
                          {isExpanded && (
                            <TableRow key={`${trainer.id}-expanded`}>
                              <TableCell colSpan={11} className="p-0 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50">
                                <div className="p-4 border-l-4 border-l-primary">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                      <Users className="h-4 w-4 text-primary" />
                                      PT Members assigned to {trainerName}
                                      {trainerPtData?.pagination && (
                                        <Badge variant="secondary" className="ml-2">
                                          {trainerPtData.pagination.total} total
                                        </Badge>
                                      )}
                                    </h4>
                                    <div className="relative w-full sm:w-64">
                                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                      <Input
                                        placeholder="Search PT members..."
                                        value={ptMembersSearch[trainer.id] || ''}
                                        onChange={(e) => handlePtMembersSearch(trainer.id, e.target.value)}
                                        className="pl-9 h-8 text-sm"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  </div>

                                  {isLoadingPtMembers ? (
                                    <div className="flex items-center justify-center py-8">
                                      <Spinner className="h-6 w-6" />
                                      <span className="ml-2 text-sm text-muted-foreground">Loading PT members...</span>
                                    </div>
                                  ) : !trainerPtData?.items?.length ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                      <Users className="h-10 w-10 text-muted-foreground mb-2" />
                                      <p className="text-sm text-muted-foreground">No PT members assigned to this trainer</p>
                                    </div>
                                  ) : (
                                    <>
                                      {/* PT Members Grid */}
                                      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                                        {trainerPtData.items.map((ptMember: TrainerPTMember) => {
                                          const daysLeft = getDaysRemaining(ptMember.endDate);
                                          return (
                                            <div
                                              key={ptMember.id}
                                              className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow"
                                            >
                                              <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                  <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm">
                                                      {getInitials(ptMember.memberName)}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                  <div>
                                                    <p className="font-medium text-sm">{ptMember.memberName}</p>
                                                    <p className="text-xs text-muted-foreground">ID: {ptMember.memberMemberId}</p>
                                                  </div>
                                                </div>
                                                <Badge
                                                  variant={ptMember.isActive ? 'default' : 'secondary'}
                                                  className={`text-xs ${ptMember.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : ''}`}
                                                >
                                                  {ptMember.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                              </div>

                                              <div className="space-y-2 text-xs">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                  <Mail className="h-3 w-3 text-blue-500" />
                                                  <span className="truncate">{ptMember.memberEmail}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                  <Phone className="h-3 w-3 text-green-500" />
                                                  <span>{ptMember.memberPhone}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                  <Package className="h-3 w-3 text-purple-500" />
                                                  <span>{ptMember.packageName}</span>
                                                </div>
                                              </div>

                                              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                                                <div className="text-xs">
                                                  <span className="text-muted-foreground">Duration: </span>
                                                  <span className="font-medium">
                                                    {format(parseISO(ptMember.startDate), 'dd MMM')} - {format(parseISO(ptMember.endDate), 'dd MMM yy')}
                                                  </span>
                                                </div>
                                                <div className={`flex items-center gap-1 text-xs font-medium ${daysLeft <= 7 ? 'text-red-600' : 'text-orange-600'}`}>
                                                  <Clock className="h-3 w-3" />
                                                  {daysLeft}d left
                                                </div>
                                              </div>

                                              {ptMember.goals && (
                                                <div className="mt-2 text-xs">
                                                  <span className="text-muted-foreground flex items-center gap-1">
                                                    <Target className="h-3 w-3 text-purple-500" />
                                                    Goals:
                                                  </span>
                                                  <p className="text-muted-foreground mt-1 line-clamp-2">{ptMember.goals}</p>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* PT Members Pagination */}
                                      {trainerPtData.pagination && trainerPtData.pagination.totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                          <p className="text-xs text-muted-foreground">
                                            Page {currentPtPage} of {trainerPtData.pagination.totalPages}
                                          </p>
                                          <div className="flex items-center gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 text-xs"
                                              onClick={(e) => { e.stopPropagation(); handlePtMembersPageChange(trainer.id, currentPtPage - 1); }}
                                              disabled={currentPtPage === 1}
                                            >
                                              <ChevronLeft className="h-3 w-3" /> Prev
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 text-xs"
                                              onClick={(e) => { e.stopPropagation(); handlePtMembersPageChange(trainer.id, currentPtPage + 1); }}
                                              disabled={currentPtPage === trainerPtData.pagination.totalPages}
                                            >
                                              Next <ChevronRight className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} results
                  </p>
                  <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                    <SelectTrigger className="w-[70px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">per page</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="text-xl">Trainer Details</DialogTitle></DialogHeader>
          {viewingTrainer && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Avatar className="h-20 w-20 border-4 border-purple-200">
                  {viewingTrainer.trainerPhoto ? <AvatarImage src={`${BACKEND_BASE_URL}${viewingTrainer.trainerPhoto}`} /> : null}
                  <AvatarFallback className="text-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                    {getInitials(getTrainerName(viewingTrainer))}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{getTrainerName(viewingTrainer)}</h3>
                  <p className="text-muted-foreground">{getTrainerEmail(viewingTrainer)}</p>
                  <Badge variant={viewingTrainer.isActive ? 'default' : 'secondary'} className="mt-1">
                    {viewingTrainer.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-purple-500" /><span>Phone: {viewingTrainer.phone || '-'}</span></div>
                <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-purple-500" /><span>Password: {viewingTrainer.password || '-'}</span></div>
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-purple-500" /><span>Gender: {viewingTrainer.gender || '-'}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-purple-500" /><span>DOB: {viewingTrainer.dateOfBirth ? format(new Date(viewingTrainer.dateOfBirth), 'MMM dd, yyyy') : '-'}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-purple-500" /><span>Joining: {viewingTrainer.joiningDate ? format(new Date(viewingTrainer.joiningDate), 'MMM dd, yyyy') : '-'}</span></div>
                <div className="flex items-center gap-2"><Award className="h-4 w-4 text-purple-500" /><span>Specialization: {viewingTrainer.specialization || '-'}</span></div>
                <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-purple-500" /><span>Experience: {viewingTrainer.experience !== undefined ? `${viewingTrainer.experience} years` : '-'}</span></div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-purple-500" />
                  <span>Salary: {viewingTrainer.salary !== undefined ? `₹${viewingTrainer.salary.toLocaleString('en-IN')}` : '-'}</span>
                </div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-purple-500" /><span>Members: {viewingTrainer._count?.members || 0}</span></div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <span>ID Proof: {viewingTrainer.idProofType || '-'}</span>
                  {viewingTrainer.idProofDocument && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => window.open(`${BACKEND_BASE_URL}${viewingTrainer.idProofDocument}`, '_blank')}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                <Button onClick={() => { setViewDialogOpen(false); handleEdit(viewingTrainer); }}>
                  <Edit className="mr-2 h-4 w-4" />Edit Trainer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Trainer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isEditMode ? 'Edit Trainer' : 'Add New Trainer'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update trainer information and profile' : 'Fill in the details to add a new trainer'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Photo and Document Uploads */}
            <div className="flex gap-6 justify-center">
              {/* Photo Upload */}
              <div className="flex flex-col items-center">
                <Label className="text-sm mb-2">Trainer Photo</Label>
                <div className="relative w-24 h-28 border-2 border-dashed border-purple-300 rounded-lg overflow-hidden bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  {photoPreview ? (
                    <>
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto text-purple-400" />
                      <span className="text-xs text-purple-400">Photo</span>
                    </div>
                  )}
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'photo')}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  className="mt-2 text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {photoPreview ? 'Change' : 'Upload'}
                </Button>
              </div>

              {/* ID Document Upload */}
              <div className="flex flex-col items-center">
                <Label className="text-sm mb-2">ID Document</Label>
                <div className="relative w-32 h-28 border-2 border-dashed border-blue-300 rounded-lg overflow-hidden bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  {docPreview ? (
                    docPreview.startsWith('data:image') || docPreview.startsWith('http') ? (
                      <>
                        <img src={docPreview} alt="ID Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setDocFile(null); setDocPreview(''); }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="text-center p-2">
                          <Upload className="h-6 w-6 mx-auto text-green-500" />
                          <span className="text-[10px] text-blue-600 break-all">
                            {docPreview.length > 20 ? docPreview.substring(0, 20) + '...' : docPreview}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setDocFile(null); setDocPreview(''); }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    )
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-blue-400" />
                      <span className="text-xs text-blue-400">ID Doc</span>
                    </div>
                  )}
                </div>
                <input
                  ref={docInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'doc')}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => docInputRef.current?.click()}
                  className="mt-2 text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {docPreview ? 'Change' : 'Upload'}
                </Button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  className={errors.firstName ? 'border-red-500' : ''}
                  placeholder="First Name"
                />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  className={errors.lastName ? 'border-red-500' : ''}
                  placeholder="Last Name"
                />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                  placeholder="email@example.com"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="password">
                  Password {!isEditMode && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                    placeholder={isEditMode ? 'Leave blank to keep current' : 'Min 6 characters'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className={errors.phone ? 'border-red-500' : ''}
                  placeholder="Phone Number"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    const pastedData = e.clipboardData.getData('text');
                    if (!/^\d+$/.test(pastedData)) {
                      e.preventDefault();
                    }
                  }}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={(v) => setValue('gender', v as any)} value={watch('gender')}>
                  <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                />
              </div>

              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  {...register('specialization')}
                  placeholder="e.g., Strength Training, Yoga"
                />
              </div>

              <div>
                <Label htmlFor="experience">Experience (Years)</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  {...register('experience')}
                  placeholder="Years of experience"
                />
              </div>

              <div>
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input
                  id="joiningDate"
                  type="date"
                  {...register('joiningDate')}
                />
              </div>

              <div>
                <Label htmlFor="salary">Monthly Salary (₹)</Label>
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  {...register('salary')}
                  placeholder="Monthly salary"
                />
              </div>

              <div>
                <Label htmlFor="idProofType">ID Proof Type</Label>
                <Select onValueChange={(v) => setValue('idProofType', v)} value={watch('idProofType')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ID_PROOF_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditMode ? 'Update Trainer' : 'Create Trainer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Trainer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{trainerToDelete ? getTrainerName(trainerToDelete) : ''}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
