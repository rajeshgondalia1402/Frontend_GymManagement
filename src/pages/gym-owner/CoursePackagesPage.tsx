import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Search,
    Package,
    ChevronLeft,
    ChevronRight,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    IndianRupee,
    Percent,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { gymOwnerService } from '@/services/gymOwner.service';
import { toast } from '@/hooks/use-toast';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import type { CoursePackage } from '@/types';

const ITEMS_PER_PAGE = 10;

const coursePackageSchema = z.object({
    packageName: z.string().min(1, 'Package name is required'),
    description: z.string().optional(),
    fees: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
        z.number({ required_error: 'Fees is required', invalid_type_error: 'Fees is required' }).min(0, 'Fees must be a positive number')
    ),
    maxDiscount: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
        z.number({ required_error: 'Max discount is required', invalid_type_error: 'Max discount is required' }).min(0, 'Max discount must be a positive number')
    ),
    discountType: z.enum(['PERCENTAGE', 'AMOUNT'], { required_error: 'Discount type is required' }),
    coursePackageType: z.enum(['REGULAR', 'PT'], { required_error: 'Package type is required' }),
    months: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
        z.number({ required_error: 'Months is required', invalid_type_error: 'Months is required' }).min(1, 'Months must be greater than 0')
    ),
});

type CoursePackageFormData = z.infer<typeof coursePackageSchema>;

const editCoursePackageSchema = coursePackageSchema.extend({
    isActive: z.boolean().optional(),
});

type EditCoursePackageFormData = z.infer<typeof editCoursePackageSchema>;

export function CoursePackagesPage() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [packageTypeFilter, setPackageTypeFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<CoursePackage | null>(null);
    const queryClient = useQueryClient();

    // Subscription features for conditional UI
    const { hasPTPackagesAccess } = useSubscriptionFeatures();

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: packagesData, isLoading, error } = useQuery({
        queryKey: ['coursePackages', page, debouncedSearch, statusFilter, packageTypeFilter, sortBy, sortOrder],
        queryFn: () => gymOwnerService.getCoursePackages(
            page,
            ITEMS_PER_PAGE,
            debouncedSearch || undefined,
            statusFilter === 'all' ? undefined : statusFilter === 'active',
            sortBy,
            sortOrder,
            packageTypeFilter === 'all' ? undefined : packageTypeFilter as 'REGULAR' | 'PT'
        ),
    });

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CoursePackageFormData>({
        resolver: zodResolver(coursePackageSchema),
        defaultValues: {
            discountType: 'PERCENTAGE',
            coursePackageType: 'REGULAR',
        },
    });

    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        reset: resetEdit,
        setValue: setValueEdit,
        control: controlEdit,
        formState: { errors: errorsEdit }
    } = useForm<EditCoursePackageFormData>({
        resolver: zodResolver(editCoursePackageSchema),
    });

    const createMutation = useMutation({
        mutationFn: gymOwnerService.createCoursePackage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coursePackages'] });
            setDialogOpen(false);
            reset();
            toast({ title: 'Course package created successfully' });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to create course package';
            toast({ title: message, variant: 'destructive' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<EditCoursePackageFormData> }) =>
            gymOwnerService.updateCoursePackage(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coursePackages'] });
            setEditDialogOpen(false);
            setSelectedPackage(null);
            resetEdit();
            toast({ title: 'Course package updated successfully' });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to update course package';
            toast({ title: message, variant: 'destructive' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: gymOwnerService.deleteCoursePackage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coursePackages'] });
            setDeleteDialogOpen(false);
            setSelectedPackage(null);
            toast({ title: 'Course package deleted successfully' });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to delete course package';
            toast({ title: message, variant: 'destructive' });
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: gymOwnerService.toggleCoursePackageStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coursePackages'] });
            toast({ title: 'Status updated successfully' });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to update status';
            toast({ title: message, variant: 'destructive' });
        },
    });

    const onSubmit = (data: CoursePackageFormData) => {
        createMutation.mutate(data);
    };

    const onEditSubmit = (data: EditCoursePackageFormData) => {
        if (selectedPackage) {
            updateMutation.mutate({ id: selectedPackage.id, data });
        }
    };

    const handleEdit = (pkg: CoursePackage) => {
        setSelectedPackage(pkg);
        setValueEdit('packageName', pkg.packageName);
        setValueEdit('description', pkg.description || '');
        setValueEdit('fees', pkg.fees);
        setValueEdit('maxDiscount', pkg.maxDiscount);
        setValueEdit('discountType', pkg.discountType);
        setValueEdit('coursePackageType', pkg.coursePackageType || 'REGULAR');
        setValueEdit('months', pkg.Months || pkg.months || pkg.durationInMonths || 1);
        setValueEdit('isActive', pkg.isActive);
        setEditDialogOpen(true);
    };

    const handleDelete = (pkg: CoursePackage) => {
        setSelectedPackage(pkg);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedPackage) {
            deleteMutation.mutate(selectedPackage.id);
        }
    };

    const handleToggleStatus = (pkg: CoursePackage) => {
        toggleStatusMutation.mutate(pkg.id);
    };

    const packages = packagesData?.data || [];
    // Debug: Log packages to check months field
    console.log('Course packages data:', packages);
    const pagination = packagesData?.pagination;
    const totalPages = pagination?.totalPages || 1;
    const totalItems = pagination?.total || packages.length;

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-500 mb-2">Failed to load course packages</p>
                    <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Course Packages</h1>
                    <p className="text-muted-foreground">Manage course package records</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Course Package
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create New Course Package</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="packageName">Package Name *</Label>
                                    <Input
                                        id="packageName"
                                        placeholder="Enter package name"
                                        {...register('packageName')}
                                    />
                                    {errors.packageName && (
                                        <p className="text-sm text-red-500">{errors.packageName.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fees">Fees *</Label>
                                    <Input
                                        id="fees"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter fees"
                                        {...register('fees')}
                                    />
                                    {errors.fees && (
                                        <p className="text-sm text-red-500">{errors.fees.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="months">Months *</Label>
                                    <Input
                                        id="months"
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="Enter months"
                                        {...register('months')}
                                    />
                                    {errors.months && (
                                        <p className="text-sm text-red-500">{errors.months.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discountType">Discount Type *</Label>
                                    <Controller
                                        name="discountType"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select discount type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                                    <SelectItem value="AMOUNT">Amount</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.discountType && (
                                        <p className="text-sm text-red-500">{errors.discountType.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxDiscount">Max Discount *</Label>
                                    <Input
                                        id="maxDiscount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter max discount"
                                        {...register('maxDiscount')}
                                    />
                                    {errors.maxDiscount && (
                                        <p className="text-sm text-red-500">{errors.maxDiscount.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="coursePackageType">Package Type *</Label>
                                    <Controller
                                        name="coursePackageType"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select package type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="REGULAR">💪 Regular Membership</SelectItem>
                                                    {/* Only show PT option if subscription allows */}
                                                    {hasPTPackagesAccess && (
                                                        <SelectItem value="PT">🏋️ PT (Personal Training)</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.coursePackageType && (
                                        <p className="text-sm text-red-500">{errors.coursePackageType.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter description (optional)"
                                        {...register('description')}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                                    {createMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
                                    Create
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalItems}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
                        <ToggleRight className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {packages.filter((pkg: CoursePackage) => pkg.isActive).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inactive Packages</CardTitle>
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {packages.filter((pkg: CoursePackage) => !pkg.isActive).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search packages..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
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
                        <Select value={packageTypeFilter} onValueChange={(val) => { setPackageTypeFilter(val); setPage(1); }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Package Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="REGULAR">💪 Regular</SelectItem>
                                {/* Only show PT filter if subscription allows */}
                                {hasPTPackagesAccess && (
                                    <SelectItem value="PT">🏋️ PT</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Spinner className="h-8 w-8" />
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <Package className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No course packages found</h3>
                            <p className="text-muted-foreground">
                                {debouncedSearch || statusFilter !== 'all'
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'Create your first course package to get started'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                                            <TableHead className="w-[50px] py-3 text-white font-semibold">#</TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-white/10 py-3"
                                                onClick={() => {
                                                    if (sortBy === 'packageName') {
                                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortBy('packageName');
                                                        setSortOrder('asc');
                                                    }
                                                    setPage(1);
                                                }}
                                            >
                                                <div className="flex items-center gap-1 text-white font-semibold">
                                                    Package Name
                                                    {sortBy === 'packageName' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 text-gray-300" />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-white/10 py-3"
                                                onClick={() => {
                                                    if (sortBy === 'description') {
                                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortBy('description');
                                                        setSortOrder('asc');
                                                    }
                                                    setPage(1);
                                                }}
                                            >
                                                <div className="flex items-center gap-1 text-white font-semibold">
                                                    Description
                                                    {sortBy === 'description' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 text-gray-300" />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-white/10 py-3"
                                                onClick={() => {
                                                    if (sortBy === 'fees') {
                                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortBy('fees');
                                                        setSortOrder('asc');
                                                    }
                                                    setPage(1);
                                                }}
                                            >
                                                <div className="flex items-center gap-1 text-white font-semibold">
                                                    Fees
                                                    {sortBy === 'fees' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 text-gray-300" />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-white/10 py-3"
                                                onClick={() => {
                                                    if (sortBy === 'maxDiscount') {
                                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortBy('maxDiscount');
                                                        setSortOrder('asc');
                                                    }
                                                    setPage(1);
                                                }}
                                            >
                                                <div className="flex items-center gap-1 text-white font-semibold">
                                                    Max Discount
                                                    {sortBy === 'maxDiscount' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 text-gray-300" />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-white/10 py-3"
                                                onClick={() => {
                                                    if (sortBy === 'discountType') {
                                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortBy('discountType');
                                                        setSortOrder('asc');
                                                    }
                                                    setPage(1);
                                                }}
                                            >
                                                <div className="flex items-center gap-1 text-white font-semibold">
                                                    Discount Type
                                                    {sortBy === 'discountType' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 text-gray-300" />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-white/10 py-3"
                                                onClick={() => {
                                                    if (sortBy === 'coursePackageType') {
                                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortBy('coursePackageType');
                                                        setSortOrder('asc');
                                                    }
                                                    setPage(1);
                                                }}
                                            >
                                                <div className="flex items-center gap-1 text-white font-semibold">
                                                    Package Type
                                                    {sortBy === 'coursePackageType' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 text-gray-300" />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-white/10 py-3"
                                                onClick={() => {
                                                    if (sortBy === 'months') {
                                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortBy('months');
                                                        setSortOrder('asc');
                                                    }
                                                    setPage(1);
                                                }}
                                            >
                                                <div className="flex items-center gap-1 text-white font-semibold">
                                                    Months
                                                    {sortBy === 'months' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 text-gray-300" />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-white/10 py-3"
                                                onClick={() => {
                                                    if (sortBy === 'isActive') {
                                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortBy('isActive');
                                                        setSortOrder('asc');
                                                    }
                                                    setPage(1);
                                                }}
                                            >
                                                <div className="flex items-center gap-1 text-white font-semibold">
                                                    Status
                                                    {sortBy === 'isActive' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 text-gray-300" />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-white/10 py-3"
                                                onClick={() => {
                                                    if (sortBy === 'createdAt') {
                                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortBy('createdAt');
                                                        setSortOrder('desc');
                                                    }
                                                    setPage(1);
                                                }}
                                            >
                                                <div className="flex items-center gap-1 text-white font-semibold">
                                                    Created At
                                                    {sortBy === 'createdAt' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 text-gray-300" />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="w-[80px] py-3 text-white font-semibold">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {packages.map((pkg: CoursePackage, index: number) => (
                                            <TableRow key={pkg.id}>
                                                <TableCell className="font-medium">
                                                    {(page - 1) * ITEMS_PER_PAGE + index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{pkg.packageName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {pkg.description || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <IndianRupee className="h-3 w-3" />
                                                        {formatCurrency(pkg.fees).replace('₹', '')}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {pkg.discountType === 'PERCENTAGE' ? (
                                                        <div className="flex items-center gap-1">
                                                            {pkg.maxDiscount}
                                                            <Percent className="h-3 w-3" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <IndianRupee className="h-3 w-3" />
                                                            {pkg.maxDiscount}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {pkg.discountType === 'PERCENTAGE' ? 'Percentage' : 'Amount'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={pkg.coursePackageType === 'PT' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}>
                                                        {pkg.coursePackageType === 'PT' ? '🏋️ PT' : '💪 Regular'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">{pkg.Months || pkg.months || pkg.durationInMonths || '-'}</span>
                                                        <span className="text-xs text-muted-foreground">month{(pkg.Months || pkg.months || pkg.durationInMonths || 0) !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={pkg.isActive ? 'default' : 'secondary'}
                                                        className="cursor-pointer"
                                                        onClick={() => handleToggleStatus(pkg)}
                                                    >
                                                        {pkg.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(pkg.createdAt)}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEdit(pkg)}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleToggleStatus(pkg)}>
                                                                {pkg.isActive ? (
                                                                    <>
                                                                        <ToggleLeft className="h-4 w-4 mr-2" />
                                                                        Deactivate
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ToggleRight className="h-4 w-4 mr-2" />
                                                                        Activate
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(pkg)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
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

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
                                        {Math.min(page * ITEMS_PER_PAGE, totalItems)} of{' '}
                                        {totalItems} results
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <span className="text-sm">
                                            Page {page} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-md sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Course Package</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="editPackageName">Package Name *</Label>
                                <Input
                                    id="editPackageName"
                                    placeholder="Enter package name"
                                    {...registerEdit('packageName')}
                                />
                                {errorsEdit.packageName && (
                                    <p className="text-sm text-red-500">{errorsEdit.packageName.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editFees">Fees *</Label>
                                <Input
                                    id="editFees"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter fees"
                                    {...registerEdit('fees')}
                                />
                                {errorsEdit.fees && (
                                    <p className="text-sm text-red-500">{errorsEdit.fees.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editMonths">Months *</Label>
                                <Input
                                    id="editMonths"
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Enter months"
                                    {...registerEdit('months')}
                                />
                                {errorsEdit.months && (
                                    <p className="text-sm text-red-500">{errorsEdit.months.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editDiscountType">Discount Type *</Label>
                                <Controller
                                    name="discountType"
                                    control={controlEdit}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select discount type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                                <SelectItem value="AMOUNT">Amount</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errorsEdit.discountType && (
                                    <p className="text-sm text-red-500">{errorsEdit.discountType.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editMaxDiscount">Max Discount *</Label>
                                <Input
                                    id="editMaxDiscount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter max discount"
                                    {...registerEdit('maxDiscount')}
                                />
                                {errorsEdit.maxDiscount && (
                                    <p className="text-sm text-red-500">{errorsEdit.maxDiscount.message}</p>
                                )}
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="editCoursePackageType">Package Type *</Label>
                                <Controller
                                    name="coursePackageType"
                                    control={controlEdit}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select package type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="REGULAR">💪 Regular Membership</SelectItem>
                                                {/* Only show PT option if subscription allows */}
                                                {hasPTPackagesAccess && (
                                                    <SelectItem value="PT">🏋️ PT (Personal Training)</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errorsEdit.coursePackageType && (
                                    <p className="text-sm text-red-500">{errorsEdit.coursePackageType.message}</p>
                                )}
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="editDescription">Description</Label>
                                <Textarea
                                    id="editDescription"
                                    placeholder="Enter description (optional)"
                                    {...registerEdit('description')}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="w-full sm:w-auto">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                                {updateMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
                                Update
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Course Package</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            Are you sure you want to delete "{selectedPackage?.packageName}"?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
                                Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default CoursePackagesPage;
