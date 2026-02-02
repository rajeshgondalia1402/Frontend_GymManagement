import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addYears, addMonths } from 'date-fns';
import {
    ArrowLeft, Save, Camera, Upload, X, CheckCircle, IndianRupee, User, Phone, Mail, Calendar, MapPin, Heart, AlertTriangle, FileText, Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { gymOwnerService } from '@/services/gymOwner.service';
import { BACKEND_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { BMICalculator } from '@/components/BMICalculator';
import type { CoursePackage } from '@/types';

const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');
const getOneYearLater = () => format(addYears(new Date(), 1), 'yyyy-MM-dd');

const memberSchema = z.object({
    firstName: z.string().min(2, 'Required'),
    lastName: z.string().min(2, 'Required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Min 6 chars').optional(),
    phone: z.string().min(10, 'Min 10 digits'),
    altContactNo: z.string().optional(),
    dateOfBirth: z.string().min(1, 'Required'),
    gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Required' }),
    address: z.string().optional(),
    occupation: z.string().optional(),
    maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed']).optional(),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    anniversaryDate: z.string().optional(),
    emergencyContact: z.string().optional(),
    healthNotes: z.string().optional(),
    idProofType: z.string().optional(),
    smsFacility: z.boolean().default(true),
    membershipStartDate: z.string().min(1, 'Required'),
    membershipEndDate: z.string().min(1, 'Required'),
    coursePackageId: z.string().optional(),
    extraDiscount: z.number().min(0, 'Min 0').default(0),
});

type MemberFormData = z.infer<typeof memberSchema>;

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed'];
const ID_PROOF_TYPES = ['Aadhar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID'];

export function MemberFormPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const isEditMode = !!id;

    const photoInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [docFile, setDocFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const [docPreview, setDocPreview] = useState<string>('');
    const [selectedPackage, setSelectedPackage] = useState<CoursePackage | null>(null);
    const [showBMICalculator, setShowBMICalculator] = useState(false);

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<MemberFormData>({
        resolver: zodResolver(memberSchema),
        defaultValues: {
            smsFacility: true,
            membershipStartDate: getTodayDate(),
            membershipEndDate: getOneYearLater(),
            extraDiscount: 0,
        },
    });

    const extraDiscount = watch('extraDiscount') || 0;
    const membershipStartDate = watch('membershipStartDate');

    // Fetch active course packages
    const { data: coursePackages = [] } = useQuery({
        queryKey: ['activeCoursePackages'],
        queryFn: () => gymOwnerService.getActiveCoursePackages(),
    });

    // Auto-calculate end date when start date changes and package with months is selected
    useEffect(() => {
        if (selectedPackage && membershipStartDate) {
            const months = selectedPackage.Months || selectedPackage.months || 0;
            if (months > 0) {
                const endDate = addMonths(new Date(membershipStartDate), months);
                setValue('membershipEndDate', format(endDate, 'yyyy-MM-dd'));
            }
        }
    }, [membershipStartDate, selectedPackage, setValue]);

    // Invalidate member query when id changes to ensure fresh data
    useEffect(() => {
        if (id) {
            queryClient.invalidateQueries({ queryKey: ['member', id] });
        }
    }, [id, queryClient]);

    // Fetch member if editing - always refetch fresh data
    const { data: member, isLoading: memberLoading, isFetching, dataUpdatedAt } = useQuery({
        queryKey: ['member', id],
        queryFn: () => gymOwnerService.getMember(id!),
        enabled: isEditMode,
        staleTime: 0, // Always consider data stale
        gcTime: 0, // Don't cache (previously called cacheTime)
        refetchOnMount: 'always', // Always refetch when component mounts
    });

    // Calculate fees
    const feeDetails = useMemo(() => {
        if (!selectedPackage) return null;
        const packageFees = selectedPackage.fees;
        let maxDiscountAmount = 0;
        if (selectedPackage.discountType === 'PERCENTAGE') {
            maxDiscountAmount = (packageFees * selectedPackage.maxDiscount) / 100;
        } else {
            maxDiscountAmount = selectedPackage.maxDiscount;
        }
        const afterDiscount = packageFees - maxDiscountAmount;
        const finalFees = Math.max(0, afterDiscount - extraDiscount);
        return { packageFees, maxDiscountAmount, afterDiscount, finalFees };
    }, [selectedPackage, extraDiscount]);

    // Bind member data to form when editing - use reset for reliable form population
    useEffect(() => {
        if (member && dataUpdatedAt) {
            // Reset file states
            setPhotoFile(null);
            setDocFile(null);

            // Handle name - try to split if backend returns full name
            const fullName = member.user?.name || '';
            const nameParts = fullName.split(' ');
            
            // Use reset to reliably populate all form fields
            reset({
                firstName: member.firstName || nameParts[0] || '',
                lastName: member.lastName || nameParts.slice(1).join(' ') || '',
                email: member.user?.email || member.email || '',
                phone: member.phone || '',
                altContactNo: member.altContactNo || '',
                dateOfBirth: member.dateOfBirth ? format(new Date(member.dateOfBirth), 'yyyy-MM-dd') : '',
                gender: member.gender as any,
                address: member.address || '',
                occupation: member.occupation || '',
                maritalStatus: member.maritalStatus as any,
                bloodGroup: member.bloodGroup as any,
                anniversaryDate: member.anniversaryDate ? format(new Date(member.anniversaryDate), 'yyyy-MM-dd') : '',
                emergencyContact: member.emergencyContact || '',
                healthNotes: member.healthNotes || '',
                idProofType: member.idProofType || '',
                smsFacility: member.smsFacility ?? true,
                membershipStartDate: member.membershipStartDate ? format(new Date(member.membershipStartDate), 'yyyy-MM-dd') : (member.membershipStart ? format(new Date(member.membershipStart), 'yyyy-MM-dd') : ''),
                membershipEndDate: member.membershipEndDate ? format(new Date(member.membershipEndDate), 'yyyy-MM-dd') : (member.membershipEnd ? format(new Date(member.membershipEnd), 'yyyy-MM-dd') : ''),
                coursePackageId: member.coursePackageId || '',
                extraDiscount: member.extraDiscount || 0,
            });

            // Set photo and document previews
            setPhotoPreview(member.memberPhoto ? `${BACKEND_BASE_URL}${member.memberPhoto}` : '');
            setDocPreview(member.idProofDocument ? `${BACKEND_BASE_URL}${member.idProofDocument}` : '');

            // Set selected package if member has one
            if (member.coursePackageId && coursePackages.length > 0) {
                const pkg = coursePackages.find((p: CoursePackage) => p.id === member.coursePackageId);
                setSelectedPackage(pkg || null);
            } else {
                setSelectedPackage(null);
            }
        }
    }, [member, dataUpdatedAt, reset, coursePackages]);

    const createMutation = useMutation({
        mutationFn: gymOwnerService.createMember,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); toast({ title: 'Member created successfully' }); navigate('/gym-owner/members'); },
        onError: (err: any) => toast({ title: 'Failed to create member', description: err?.response?.data?.message, variant: 'destructive' }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: FormData }) => gymOwnerService.updateMember(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); toast({ title: 'Member updated successfully' }); navigate('/gym-owner/members'); },
        onError: (err: any) => toast({ title: 'Failed to update member', description: err?.response?.data?.message, variant: 'destructive' }),
    });

    const onSubmit = (formData: MemberFormData) => {
        const fd = new FormData();

        // Add all form fields
        fd.append('firstName', formData.firstName);
        fd.append('lastName', formData.lastName);
        fd.append('email', formData.email);
        if (formData.password) fd.append('password', formData.password);
        fd.append('phone', formData.phone);
        if (formData.altContactNo) fd.append('altContactNo', formData.altContactNo);
        if (formData.address) fd.append('address', formData.address);
        if (formData.gender) fd.append('gender', formData.gender);
        if (formData.occupation) fd.append('occupation', formData.occupation);
        if (formData.maritalStatus) fd.append('maritalStatus', formData.maritalStatus);
        if (formData.bloodGroup) fd.append('bloodGroup', formData.bloodGroup);
        if (formData.dateOfBirth) fd.append('dateOfBirth', formData.dateOfBirth);
        if (formData.anniversaryDate) fd.append('anniversaryDate', formData.anniversaryDate);
        if (formData.emergencyContact) fd.append('emergencyContact', formData.emergencyContact);
        if (formData.healthNotes) fd.append('healthNotes', formData.healthNotes);
        if (formData.idProofType) fd.append('idProofType', formData.idProofType);
        fd.append('smsFacility', String(formData.smsFacility));
        fd.append('membershipStartDate', formData.membershipStartDate);
        fd.append('membershipEndDate', formData.membershipEndDate);

        // Course package and fee details
        if (formData.coursePackageId) fd.append('coursePackageId', formData.coursePackageId);
        if (feeDetails) {
            fd.append('packageFees', String(feeDetails.packageFees));
            fd.append('maxDiscount', String(feeDetails.maxDiscountAmount));
            fd.append('afterDiscount', String(feeDetails.afterDiscount));
            fd.append('extraDiscount', String(formData.extraDiscount));
            fd.append('finalFees', String(feeDetails.finalFees));
        } else {
            fd.append('extraDiscount', String(formData.extraDiscount));
        }

        // File uploads
        if (photoFile) fd.append('memberPhoto', photoFile);
        if (docFile) fd.append('idProofDocument', docFile);

        if (isEditMode) updateMutation.mutate({ id: id!, data: fd });
        else createMutation.mutate(fd);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'doc') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const maxSize = type === 'photo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) { toast({ title: 'File too large', variant: 'destructive' }); return; }
        if (type === 'photo') {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setDocFile(file);
            // For image files, create a preview; for other files (PDF), just show filename
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setDocPreview(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                setDocPreview(file.name);
            }
        }
    };

    const handlePackageChange = (packageId: string) => {
        setValue('coursePackageId', packageId);
        const pkg = coursePackages.find((p: CoursePackage) => p.id === packageId);
        setSelectedPackage(pkg || null);

        // Auto-calculate end date based on package months
        if (pkg) {
            const months = pkg.Months || pkg.months || 0;
            if (months > 0) {
                const startDate = watch('membershipStartDate');
                if (startDate) {
                    const endDate = addMonths(new Date(startDate), months);
                    setValue('membershipEndDate', format(endDate, 'yyyy-MM-dd'));
                }
            }
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    if (isEditMode && (memberLoading || isFetching)) {
        return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>;
    }



    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Fixed Header - Consistent with other pages */}
            <div className="flex-shrink-0 bg-background border-b px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/gym-owner/members')} className="shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                                <User className="h-7 w-7 text-purple-600" />
                                {isEditMode ? 'Edit Member' : 'Add New Member'}
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-base">
                                {isEditMode ? 'Update member information' : 'Register a new gym member'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => navigate('/gym-owner/members')} className="hidden sm:flex">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit(onSubmit)} 
                            disabled={isPending} 
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                            {isPending ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {isPending ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Member' : 'Create Member')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-4 md:p-6">
                        
                        {/* Top Section: Photo/Document + Membership & Fees side by side */}
                        <div className="flex flex-col lg:flex-row gap-4 mb-6 pb-6 border-b">
                            {/* Left: Photo & Document */}
                            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                                {/* Photo Upload */}
                                <div className="flex flex-col items-center">
                                    <Label className="text-sm font-semibold mb-2 flex items-center gap-1">
                                        <Camera className="h-4 w-4 text-purple-600" /> Photo
                                    </Label>
                                    <div className="relative w-24 h-32 border-2 border-dashed border-purple-300 rounded-xl overflow-hidden bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                                        {photoPreview ? (
                                            <>
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <Camera className="h-6 w-6 mx-auto text-purple-400" />
                                                <span className="text-[10px] text-purple-400 mt-1 block">Photo</span>
                                            </div>
                                        )}
                                    </div>
                                    <input ref={photoInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} className="hidden" />
                                    <Button type="button" variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} className="mt-2 h-8 text-xs">
                                        <Upload className="h-3 w-3 mr-1" />{photoPreview ? 'Change' : 'Upload'}
                                    </Button>
                                </div>

                                {/* ID Document Upload */}
                                <div className="flex flex-col items-center">
                                    <Label className="text-sm font-semibold mb-2 flex items-center gap-1">
                                        <FileText className="h-4 w-4 text-blue-600" /> ID Doc
                                    </Label>
                                    <div className="relative w-32 h-24 border-2 border-dashed border-blue-300 rounded-xl overflow-hidden bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                        {docPreview ? (
                                            docPreview.startsWith('data:image') || docPreview.startsWith('http') ? (
                                                <>
                                                    <img src={docPreview} alt="ID Preview" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => { setDocFile(null); setDocPreview(''); }}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="text-center p-1">
                                                        <CheckCircle className="h-6 w-6 mx-auto text-green-500" />
                                                        <span className="text-[10px] text-blue-600 break-all">{docPreview.length > 12 ? docPreview.substring(0, 12) + '...' : docPreview}</span>
                                                    </div>
                                                    <button type="button" onClick={() => { setDocFile(null); setDocPreview(''); }}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </>
                                            )
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="h-6 w-6 mx-auto text-blue-400" />
                                                <span className="text-[10px] text-blue-400 mt-1 block">ID Doc</span>
                                            </div>
                                        )}
                                    </div>
                                    <input ref={docInputRef} type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'doc')} className="hidden" />
                                    <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()} className="mt-2 h-8 text-xs">
                                        <Upload className="h-3 w-3 mr-1" />{docPreview ? 'Change' : 'Upload'}
                                    </Button>
                                    {/* ID Proof Type */}
                                    <Select onValueChange={(v) => setValue('idProofType', v)} value={watch('idProofType')}>
                                        <SelectTrigger className="h-8 text-xs mt-2 w-full"><SelectValue placeholder="ID Type" /></SelectTrigger>
                                        <SelectContent>{ID_PROOF_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Right: Membership & Fees Section */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-green-700 mb-3 flex items-center gap-2 pb-2 border-b border-green-200">
                                    <IndianRupee className="h-4 w-4" /> Membership & Fees
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {/* Course Package */}
                                    <div>
                                        <Label className="text-xs font-semibold text-green-700 mb-1 block">Course Package</Label>
                                        <Select onValueChange={handlePackageChange} value={watch('coursePackageId')}>
                                            <SelectTrigger className="h-10"><SelectValue placeholder="Select Package" /></SelectTrigger>
                                            <SelectContent>
                                                {coursePackages.map((pkg: CoursePackage) => {
                                                    const months = pkg.Months || pkg.months || 0;
                                                    return (
                                                        <SelectItem key={pkg.id} value={pkg.id}>
                                                            {pkg.packageName} - ₹{pkg.fees.toLocaleString()} - {months} {months === 1 ? 'Month' : 'Months'}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Membership Start */}
                                    <div>
                                        <Label className="text-xs font-semibold mb-1 flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-blue-600" /> Start <span className="text-red-500">*</span>
                                        </Label>
                                        <Input 
                                            {...register('membershipStartDate')} 
                                            type="date" 
                                            className={`h-10 ${errors.membershipStartDate ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                                        />
                                        {errors.membershipStartDate && (
                                            <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                                                <AlertTriangle className="h-2.5 w-2.5" />{errors.membershipStartDate.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Membership End */}
                                    <div>
                                        <Label className="text-xs font-semibold mb-1 flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-blue-600" /> End <span className="text-red-500">*</span>
                                        </Label>
                                        <Input 
                                            {...register('membershipEndDate')} 
                                            type="date" 
                                            className={`h-10 ${errors.membershipEndDate ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                                        />
                                        {errors.membershipEndDate && (
                                            <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                                                <AlertTriangle className="h-2.5 w-2.5" />{errors.membershipEndDate.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Extra Discount */}
                                    <div>
                                        <Label className="text-xs font-semibold mb-1 block">Extra Discount</Label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                min="0"
                                                {...register('extraDiscount', { valueAsNumber: true })}
                                                placeholder="0"
                                                className="h-10 pl-7"
                                            />
                                        </div>
                                    </div>

                                    {/* Fee Details Cards - Inline */}
                                    {selectedPackage && feeDetails && (
                                        <>
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 p-2 rounded-lg border border-blue-200">
                                                <p className="text-[10px] text-blue-600 font-medium">Package Fees</p>
                                                <p className="text-sm font-bold text-blue-700 flex items-center">
                                                    <IndianRupee className="h-3 w-3" />{feeDetails.packageFees.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 p-2 rounded-lg border border-orange-200">
                                                <p className="text-[10px] text-orange-600 font-medium">Max Discount</p>
                                                <p className="text-sm font-bold text-orange-700 flex items-center">
                                                    <IndianRupee className="h-3 w-3" />{feeDetails.maxDiscountAmount.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 p-2 rounded-lg border border-purple-200">
                                                <p className="text-[10px] text-purple-600 font-medium">After Discount</p>
                                                <p className="text-sm font-bold text-purple-700 flex items-center">
                                                    <IndianRupee className="h-3 w-3" />{feeDetails.afterDiscount.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 p-2 rounded-lg border-2 border-green-300">
                                                <p className="text-[10px] text-green-600 font-semibold">Final Fees</p>
                                                <p className="text-base font-bold text-green-700 flex items-center">
                                                    <IndianRupee className="h-4 w-4" />{feeDetails.finalFees.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* SMS Facility Toggle - Desktop */}
                            <div className="hidden lg:flex flex-col items-center justify-start shrink-0">
                                <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 p-3 rounded-xl border">
                                    <Label className="text-xs font-semibold mb-2 block text-center">SMS</Label>
                                    <div className="flex flex-col items-center gap-1">
                                        <Switch checked={watch('smsFacility')} onCheckedChange={(c) => setValue('smsFacility', c)} />
                                        <span className="text-xs font-medium">{watch('smsFacility') ? 'ON' : 'OFF'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Grid - Personal Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                            
                            {/* Personal Information Section */}
                            <div className="col-span-full">
                                <div className="flex items-center justify-between pb-2 border-b border-purple-200 mb-3">
                                    <h3 className="text-sm font-bold text-purple-700 flex items-center gap-2">
                                        <User className="h-4 w-4" /> Personal Information
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowBMICalculator(true)}
                                        className="h-8 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-300 text-purple-700"
                                    >
                                        <Calculator className="h-3.5 w-3.5 mr-1.5" />
                                        Calculate BMI
                                    </Button>
                                </div>
                            </div>

                            {/* First Name */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">First Name <span className="text-red-500">*</span></Label>
                                <Input 
                                    {...register('firstName')} 
                                    placeholder="First Name" 
                                    className={`h-11 ${errors.firstName ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                                />
                                {errors.firstName && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />{errors.firstName.message}
                                    </p>
                                )}
                            </div>

                            {/* Last Name */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">Last Name <span className="text-red-500">*</span></Label>
                                <Input 
                                    {...register('lastName')} 
                                    placeholder="Last Name" 
                                    className={`h-11 ${errors.lastName ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                                />
                                {errors.lastName && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />{errors.lastName.message}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 flex items-center gap-1">
                                    <Mail className="h-4 w-4 text-blue-600" /> Email <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    {...register('email')} 
                                    type="email" 
                                    placeholder="email@example.com" 
                                    className={`h-11 ${errors.email ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />{errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Password - Only for new member */}
                            {!isEditMode && (
                                <div>
                                    <Label className="text-sm font-semibold mb-2 block">Password <span className="text-red-500">*</span></Label>
                                    <Input 
                                        {...register('password')} 
                                        type="password" 
                                        placeholder="Min 6 characters" 
                                        className={`h-11 ${errors.password ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                                    />
                                    {errors.password && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" />{errors.password.message}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Contact No */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 flex items-center gap-1">
                                    <Phone className="h-4 w-4 text-green-600" /> Contact No. <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    {...register('phone')} 
                                    placeholder="Phone Number" 
                                    className={`h-11 ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                                />
                                {errors.phone && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />{errors.phone.message}
                                    </p>
                                )}
                            </div>

                            {/* Alt Contact */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">Alt Contact</Label>
                                <Input {...register('altContactNo')} placeholder="Alternative Phone" className="h-11" />
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-orange-600" /> Date of Birth <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    {...register('dateOfBirth')} 
                                    type="date" 
                                    className={`h-11 ${errors.dateOfBirth ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                                />
                                {errors.dateOfBirth && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />{errors.dateOfBirth.message}
                                    </p>
                                )}
                            </div>

                            {/* Gender */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">Gender <span className="text-red-500">*</span></Label>
                                <Select onValueChange={(v) => setValue('gender', v as any)} value={watch('gender')}>
                                    <SelectTrigger className={`h-11 ${errors.gender ? 'border-red-500 ring-1 ring-red-500' : ''}`}>
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.gender && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />{errors.gender.message}
                                    </p>
                                )}
                            </div>

                            {/* Marital Status */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">Marital Status</Label>
                                <Select onValueChange={(v) => setValue('maritalStatus', v as any)} value={watch('maritalStatus')}>
                                    <SelectTrigger className="h-11"><SelectValue placeholder="Select Status" /></SelectTrigger>
                                    <SelectContent>{MARITAL_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>

                            {/* Blood Group */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 flex items-center gap-1">
                                    <Heart className="h-4 w-4 text-red-600" /> Blood Group
                                </Label>
                                <Select onValueChange={(v) => setValue('bloodGroup', v as any)} value={watch('bloodGroup')}>
                                    <SelectTrigger className="h-11"><SelectValue placeholder="Select Group" /></SelectTrigger>
                                    <SelectContent>{BLOOD_GROUPS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>

                            {/* Anniversary */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">Anniversary</Label>
                                <Input {...register('anniversaryDate')} type="date" className="h-11" />
                            </div>

                            {/* Occupation */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">Occupation</Label>
                                <Input {...register('occupation')} placeholder="Occupation" className="h-11" />
                            </div>

                            {/* Address */}
                            <div className="sm:col-span-2">
                                <Label className="text-sm font-semibold mb-2 flex items-center gap-1">
                                    <MapPin className="h-4 w-4 text-teal-600" /> Address
                                </Label>
                                <Input {...register('address')} placeholder="Full Address" className="h-11" />
                            </div>

                            {/* Emergency Contact */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">Emergency Contact</Label>
                                <Input {...register('emergencyContact')} placeholder="Emergency Phone" className="h-11" />
                            </div>

                            {/* SMS Facility - Mobile/Tablet */}
                            <div className="lg:hidden">
                                <Label className="text-sm font-semibold mb-2 block">SMS Facility</Label>
                                <div className="flex items-center gap-3 h-11 px-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border">
                                    <Switch checked={watch('smsFacility')} onCheckedChange={(c) => setValue('smsFacility', c)} />
                                    <span className="text-sm font-medium">{watch('smsFacility') ? 'Enabled' : 'Disabled'}</span>
                                </div>
                            </div>

                            {/* Health Notes - Full Width */}
                            <div className="col-span-full">
                                <Label className="text-sm font-semibold mb-2 block">Health Notes</Label>
                                <Textarea 
                                    {...register('healthNotes')} 
                                    placeholder="Health conditions, allergies, medical history..." 
                                    className="resize-none h-16" 
                                    rows={2} 
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Mobile Save Button */}
            <div className="sm:hidden shrink-0 p-3 border-t bg-white dark:bg-gray-800">
                <Button
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 text-base font-semibold"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isPending}
                >
                    {isPending ? <Spinner className="h-5 w-5" /> : <><Save className="h-5 w-5 mr-2" />{isEditMode ? 'Update Member' : 'Create Member'}</>}
                </Button>
            </div>

            {/* BMI Calculator Modal */}
            <BMICalculator open={showBMICalculator} onOpenChange={setShowBMICalculator} />
        </div>
    );
}
