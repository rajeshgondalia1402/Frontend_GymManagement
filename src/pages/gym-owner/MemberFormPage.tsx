import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addYears } from 'date-fns';
import {
    ArrowLeft, Save, Camera, Upload, X, CheckCircle, IndianRupee,
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

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<MemberFormData>({
        resolver: zodResolver(memberSchema),
        defaultValues: {
            smsFacility: true,
            membershipStartDate: getTodayDate(),
            membershipEndDate: getOneYearLater(),
            extraDiscount: 0,
        },
    });

    const extraDiscount = watch('extraDiscount') || 0;

    // Fetch active course packages
    const { data: coursePackages = [] } = useQuery({
        queryKey: ['activeCoursePackages'],
        queryFn: () => gymOwnerService.getActiveCoursePackages(),
    });

    // Fetch member if editing
    const { data: member, isLoading: memberLoading } = useQuery({
        queryKey: ['member', id],
        queryFn: () => gymOwnerService.getMember(id!),
        enabled: isEditMode,
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

    useEffect(() => {
        if (member) {
            // Handle name - try to split if backend returns full name
            const fullName = member.user?.name || '';
            const nameParts = fullName.split(' ');
            setValue('firstName', member.firstName || nameParts[0] || '');
            setValue('lastName', member.lastName || nameParts.slice(1).join(' ') || '');
            setValue('email', member.user?.email || member.email || '');
            setValue('phone', member.phone || '');
            setValue('altContactNo', member.altContactNo || '');
            setValue('dateOfBirth', member.dateOfBirth ? format(new Date(member.dateOfBirth), 'yyyy-MM-dd') : '');
            setValue('gender', member.gender as any);
            setValue('address', member.address || '');
            setValue('occupation', member.occupation || '');
            setValue('maritalStatus', member.maritalStatus as any);
            setValue('bloodGroup', member.bloodGroup as any);
            setValue('anniversaryDate', member.anniversaryDate ? format(new Date(member.anniversaryDate), 'yyyy-MM-dd') : '');
            setValue('emergencyContact', member.emergencyContact || '');
            setValue('healthNotes', member.healthNotes || '');
            setValue('idProofType', member.idProofType || '');
            setValue('smsFacility', member.smsFacility ?? true);
            setValue('membershipStartDate', member.membershipStartDate ? format(new Date(member.membershipStartDate), 'yyyy-MM-dd') : (member.membershipStart ? format(new Date(member.membershipStart), 'yyyy-MM-dd') : ''));
            setValue('membershipEndDate', member.membershipEndDate ? format(new Date(member.membershipEndDate), 'yyyy-MM-dd') : (member.membershipEnd ? format(new Date(member.membershipEnd), 'yyyy-MM-dd') : ''));
            setValue('coursePackageId', member.coursePackageId || '');
            setValue('extraDiscount', member.extraDiscount || 0);
            if (member.memberPhoto) setPhotoPreview(`${BACKEND_BASE_URL}${member.memberPhoto}`);
            if (member.idProofDocument) setDocPreview(`${BACKEND_BASE_URL}${member.idProofDocument}`);
            // Set selected package if member has one
            if (member.coursePackageId && coursePackages.length > 0) {
                const pkg = coursePackages.find((p: CoursePackage) => p.id === member.coursePackageId);
                setSelectedPackage(pkg || null);
            }
        }
    }, [member, setValue, coursePackages]);

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
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    if (isEditMode && memberLoading) {
        return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>;
    }



    return (
        <div className="h-full flex flex-col">
            {/* Compact Header */}
            <div className="flex items-center justify-between py-2 px-1 border-b bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/gym-owner/members')} className="h-7 w-7 p-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        {isEditMode ? 'Edit Member' : 'Add New Member'}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/gym-owner/members')} className="h-7 text-xs">Cancel</Button>
                    <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isPending} className="h-7 text-xs bg-gradient-to-r from-purple-600 to-blue-600">
                        {isPending ? <Spinner className="h-3 w-3" /> : <><Save className="h-3 w-3 mr-1" />{isEditMode ? 'Update' : 'Create'}</>}
                    </Button>
                </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-3 grid grid-cols-12 gap-3">
                {/* Left Column - Photo & ID Document */}
                <div className="col-span-2 flex flex-col items-center gap-3">
                    {/* Photo Upload */}
                    <div className="w-full flex flex-col items-center">
                        <Label className="text-[10px] mb-1">Photo</Label>
                        <div className="relative w-full aspect-[3/4] max-w-[100px] border-2 border-dashed border-purple-300 rounded-lg overflow-hidden bg-purple-50 flex items-center justify-center">
                            {photoPreview ? (
                                <>
                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}
                                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full"><X className="h-2.5 w-2.5" /></button>
                                </>
                            ) : (
                                <div className="text-center"><Camera className="h-6 w-6 mx-auto text-purple-400" /><span className="text-[10px] text-purple-400">Photo</span></div>
                            )}
                        </div>
                        <input ref={photoInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} className="hidden" />
                        <Button type="button" variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} className="mt-1 text-[10px] h-6 w-full max-w-[100px]">
                            <Upload className="h-2.5 w-2.5 mr-1" />{photoPreview ? 'Change' : 'Upload'}
                        </Button>
                    </div>

                    {/* ID Document Upload */}
                    <div className="w-full flex flex-col items-center">
                        <Label className="text-[10px] mb-1">ID Document</Label>
                        <div className="relative w-full aspect-[4/3] max-w-[130px] border-2 border-dashed border-blue-300 rounded-lg overflow-hidden bg-blue-50 flex items-center justify-center">
                            {docPreview ? (
                                docPreview.startsWith('data:image') || docPreview.startsWith('http') ? (
                                    <>
                                        <img src={docPreview} alt="ID Preview" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => { setDocFile(null); setDocPreview(''); }}
                                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full"><X className="h-2.5 w-2.5" /></button>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-center p-1">
                                            <CheckCircle className="h-6 w-6 mx-auto text-green-500" />
                                            <span className="text-[8px] text-blue-600 break-all">{docPreview.length > 15 ? docPreview.substring(0, 15) + '...' : docPreview}</span>
                                        </div>
                                        <button type="button" onClick={() => { setDocFile(null); setDocPreview(''); }}
                                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full"><X className="h-2.5 w-2.5" /></button>
                                    </>
                                )
                            ) : (
                                <div className="text-center"><Upload className="h-6 w-6 mx-auto text-blue-400" /><span className="text-[10px] text-blue-400">ID Doc</span></div>
                            )}
                        </div>
                        <input ref={docInputRef} type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'doc')} className="hidden" />
                        <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()} className="mt-1 text-[10px] h-6 w-full max-w-[130px]">
                            <Upload className="h-2.5 w-2.5 mr-1" />{docPreview ? 'Change' : 'Upload'}
                        </Button>
                        {/* ID Proof Type Dropdown */}
                        <div className="w-full max-w-[130px] mt-2">
                            <Label className="text-[10px]">ID Proof Type</Label>
                            <Select onValueChange={(v) => setValue('idProofType', v)} value={watch('idProofType')}>
                                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>{ID_PROOF_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Right Content - All Fields */}
                <div className="col-span-10 grid grid-cols-6 gap-x-3 gap-y-2">
                    {/* Row 1: Basic Info */}
                    <div>
                        <Label className="text-[10px]">First Name <span className="text-red-500">*</span></Label>
                        <Input {...register('firstName')} placeholder="First Name" className={`h-7 text-xs ${errors.firstName ? 'border-red-500' : ''}`} />
                    </div>
                    <div>
                        <Label className="text-[10px]">Last Name <span className="text-red-500">*</span></Label>
                        <Input {...register('lastName')} placeholder="Last Name" className={`h-7 text-xs ${errors.lastName ? 'border-red-500' : ''}`} />
                    </div>
                    <div>
                        <Label className="text-[10px]">Email <span className="text-red-500">*</span></Label>
                        <Input {...register('email')} type="email" placeholder="Email" className={`h-7 text-xs ${errors.email ? 'border-red-500' : ''}`} />
                    </div>
                    {!isEditMode && (
                        <div>
                            <Label className="text-[10px]">Password <span className="text-red-500">*</span></Label>
                            <Input {...register('password')} type="password" placeholder="Password" className={`h-7 text-xs ${errors.password ? 'border-red-500' : ''}`} />
                        </div>
                    )}
                    <div>
                        <Label className="text-[10px]">Contact No. <span className="text-red-500">*</span></Label>
                        <Input {...register('phone')} placeholder="Phone" className={`h-7 text-xs ${errors.phone ? 'border-red-500' : ''}`} />
                    </div>
                    <div>
                        <Label className="text-[10px]">Alt Contact</Label>
                        <Input {...register('altContactNo')} placeholder="Alt Phone" className="h-7 text-xs" />
                    </div>
                    {isEditMode && <div />}

                    {/* Row 2: Personal Info */}
                    <div>
                        <Label className="text-[10px]">Date of Birth <span className="text-red-500">*</span></Label>
                        <Input {...register('dateOfBirth')} type="date" className={`h-7 text-xs ${errors.dateOfBirth ? 'border-red-500' : ''}`} />
                    </div>
                    <div>
                        <Label className="text-[10px]">Gender <span className="text-red-500">*</span></Label>
                        <Select onValueChange={(v) => setValue('gender', v as any)} value={watch('gender')}>
                            <SelectTrigger className={`h-7 text-xs ${errors.gender ? 'border-red-500' : ''}`}><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-[10px]">Marital Status</Label>
                        <Select onValueChange={(v) => setValue('maritalStatus', v as any)} value={watch('maritalStatus')}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{MARITAL_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-[10px]">Blood Group</Label>
                        <Select onValueChange={(v) => setValue('bloodGroup', v as any)} value={watch('bloodGroup')}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{BLOOD_GROUPS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-[10px]">Anniversary</Label>
                        <Input {...register('anniversaryDate')} type="date" className="h-7 text-xs" />
                    </div>
                    <div>
                        <Label className="text-[10px]">Occupation</Label>
                        <Input {...register('occupation')} placeholder="Occupation" className="h-7 text-xs" />
                    </div>

                    {/* Row 3: Address + Emergency Contact + SMS */}
                    <div className="col-span-3">
                        <Label className="text-[10px]">Address</Label>
                        <Input {...register('address')} placeholder="Full Address" className="h-7 text-xs" />
                    </div>
                    <div>
                        <Label className="text-[10px]">Emergency Contact</Label>
                        <Input {...register('emergencyContact')} placeholder="Emergency Phone" className="h-7 text-xs" />
                    </div>
                    <div className="flex items-end">
                        <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded h-7">
                            <Label className="text-[10px]">SMS</Label>
                            <Switch checked={watch('smsFacility')} onCheckedChange={(c) => setValue('smsFacility', c)} className="scale-75" />
                        </div>
                    </div>
                    <div />

                    {/* Row 4: Course Package & Membership */}
                    <div>
                        <Label className="text-[10px]">Course Package</Label>
                        <Select onValueChange={handlePackageChange} value={watch('coursePackageId')}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select Package" /></SelectTrigger>
                            <SelectContent>
                                {coursePackages.map((pkg: CoursePackage) => (
                                    <SelectItem key={pkg.id} value={pkg.id}>{pkg.packageName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-[10px]">Membership Start <span className="text-red-500">*</span></Label>
                        <Input {...register('membershipStartDate')} type="date" className={`h-7 text-xs ${errors.membershipStartDate ? 'border-red-500' : ''}`} />
                    </div>
                    <div>
                        <Label className="text-[10px]">Membership End <span className="text-red-500">*</span></Label>
                        <Input {...register('membershipEndDate')} type="date" className={`h-7 text-xs ${errors.membershipEndDate ? 'border-red-500' : ''}`} />
                    </div>
                    <div>
                        <Label className="text-[10px]">Extra Discount</Label>
                        <Input
                            type="number"
                            min="0"
                            {...register('extraDiscount', { valueAsNumber: true })}
                            placeholder="0"
                            className="h-7 text-xs"
                        />
                    </div>
                    <div className="col-span-2" />

                    {/* Row 5: Fee Details - Attractive Readonly Display */}
                    {selectedPackage && feeDetails && (
                        <div className="col-span-6 mt-1">
                            <div className="grid grid-cols-4 gap-2">
                                <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-[9px] text-blue-600 dark:text-blue-400 font-medium">Package Fees</p>
                                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center">
                                        <IndianRupee className="h-3 w-3" />{feeDetails.packageFees.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20 p-2 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <p className="text-[9px] text-orange-600 dark:text-orange-400 font-medium">Max Discount</p>
                                    <p className="text-sm font-bold text-orange-700 dark:text-orange-300 flex items-center">
                                        <IndianRupee className="h-3 w-3" />{feeDetails.maxDiscountAmount.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 p-2 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <p className="text-[9px] text-purple-600 dark:text-purple-400 font-medium">After Discount</p>
                                    <p className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center">
                                        <IndianRupee className="h-3 w-3" />{feeDetails.afterDiscount.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 p-2 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-[9px] text-green-600 dark:text-green-400 font-medium">Final Fees</p>
                                    <p className="text-lg font-bold text-green-700 dark:text-green-300 flex items-center">
                                        <IndianRupee className="h-4 w-4" />{feeDetails.finalFees.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Row 6: Health Notes */}
                    <div className="col-span-6">
                        <Label className="text-[10px]">Health Notes</Label>
                        <Textarea {...register('healthNotes')} placeholder="Health conditions, allergies, medical history..." className="text-xs resize-none h-12" rows={2} />
                    </div>
                </div>
            </form>
        </div>
    );
}
