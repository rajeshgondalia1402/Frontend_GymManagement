import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  User, Briefcase, MapPin, Upload, X, FileText, Image as ImageIcon, Loader2,
  ChevronsUpDown, Check, Heart, Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  INDIAN_STATES,
  CITIES_BY_STATE,
  HIRE_TRAINER_ROLES,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PT_EXPERIENCE_YEARS,
  PT_EXPERIENCE_MONTHS,
  HOW_SOON_OPTIONS,
} from '@/data/indianStates';
import { hireTrainerService } from '@/services/hireTrainer.service';
import { useToast } from '@/hooks/use-toast';
import type { HireTrainerDocument } from '@/types';

interface TrainerDetailsStepProps {
  formData: Record<string, any>;
  onChange: (field: string, value: any) => void;
  documents: HireTrainerDocument[];
  onDocumentsChange: (docs: HireTrainerDocument[]) => void;
  hireTrainerId: string | null;
  errors: Record<string, string>;
}

export function TrainerDetailsStep({
  formData,
  onChange,
  documents,
  onDocumentsChange,
  hireTrainerId,
  errors,
}: TrainerDetailsStepProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const cities = formData.state ? (CITIES_BY_STATE[formData.state] || []) : [];

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || !hireTrainerId) return;

    for (const file of Array.from(files)) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: `${file.name} is too large (max 5MB)`, variant: 'destructive' });
        continue;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({ title: `${file.name} has an invalid file type`, variant: 'destructive' });
        continue;
      }

      setUploading(true);
      try {
        const doc = await hireTrainerService.uploadCertificate(hireTrainerId, file);
        onDocumentsChange([...documents, doc]);
        toast({ title: 'Certificate uploaded!' });
      } catch (error: any) {
        toast({
          title: 'Upload failed',
          description: error.response?.data?.message || error.message,
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [hireTrainerId, documents, onDocumentsChange, toast]);

  const removeDocument = (docId: string) => {
    onDocumentsChange(documents.filter((d) => d.id !== docId));
  };

  const renderField = (label: string, field: string, required = false, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        value={formData[field] || ''}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder || label}
        className="h-10"
      />
      {errors[field] && <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p>}
    </div>
  );

  const renderSelect = (
    label: string,
    field: string,
    options: { value: string; label: string }[],
    required = false,
    placeholder = 'Select...'
  ) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={formData[field] || ''} onValueChange={(val) => onChange(field, val)}>
        <SelectTrigger className="h-10">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors[field] && <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p>}
    </div>
  );

  const SectionIcon = ({ icon: Icon, color }: { icon: any; color: string }) => (
    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color)}>
      <Icon className="w-4 h-4 text-white" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Progress hint */}
      <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
        <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
        Fields marked with <span className="text-red-500 font-semibold">*</span> are required
      </div>

      {/* Basic Info */}
      <Card className="shadow-sm border-0 ring-1 ring-gray-100 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-3 text-base font-semibold text-gray-800">
            <SectionIcon icon={User} color="bg-blue-500" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            {renderField('Full Name', 'fullName', true, 'Enter your full name')}
            {renderField('WhatsApp Number', 'whatsappNumber', false, '+91 98765 43210')}
            <div className="sm:col-span-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Address</Label>
                <Textarea
                  value={formData.address || ''}
                  onChange={(e) => onChange('address', e.target.value)}
                  placeholder="Enter your full address"
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Country</Label>
              <Input value={formData.country || 'India'} disabled className="h-10 bg-gray-50" />
            </div>

            {/* Searchable State Combobox */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">State <span className="text-red-500">*</span></Label>
              <Popover open={stateOpen} onOpenChange={setStateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={stateOpen}
                    className={cn('w-full h-10 justify-between font-normal', !formData.state && 'text-muted-foreground')}
                  >
                    {formData.state || 'Search & select state'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Type to search..." />
                    <CommandList>
                      <CommandEmpty>No state found.</CommandEmpty>
                      <CommandGroup>
                        {INDIAN_STATES.map((s) => (
                          <CommandItem
                            key={s.value}
                            value={s.value}
                            onSelect={() => {
                              onChange('state', s.value);
                              setStateOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', formData.state === s.value ? 'opacity-100' : 'opacity-0')} />
                            {s.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.state && <p className="text-xs text-red-500 mt-0.5">{errors.state}</p>}
            </div>

            {/* Searchable City Combobox */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">City <span className="text-red-500">*</span></Label>
              <Popover open={cityOpen} onOpenChange={setCityOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={cityOpen}
                    disabled={!formData.state}
                    className={cn('w-full h-10 justify-between font-normal', !formData.city && 'text-muted-foreground')}
                  >
                    {formData.city || (formData.state ? 'Search & select city' : 'Select state first')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Type to search..." />
                    <CommandList>
                      <CommandEmpty>No city found.</CommandEmpty>
                      <CommandGroup>
                        {cities.map((c) => (
                          <CommandItem
                            key={c.value}
                            value={c.value}
                            onSelect={() => {
                              onChange('city', c.value);
                              setCityOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', formData.city === c.value ? 'opacity-100' : 'opacity-0')} />
                            {c.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.city && <p className="text-xs text-red-500 mt-0.5">{errors.city}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Info */}
      <Card className="shadow-sm border-0 ring-1 ring-gray-100 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-3 text-base font-semibold text-gray-800">
            <SectionIcon icon={Briefcase} color="bg-emerald-500" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            {renderSelect('Role', 'role', HIRE_TRAINER_ROLES, true, 'Select Role')}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Total Years Experience <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={formData.totalYearsExperience ?? ''}
                onChange={(e) => onChange('totalYearsExperience', e.target.value)}
                placeholder="e.g. 5"
                className="h-10"
              />
              {errors.totalYearsExperience && <p className="text-xs text-red-500 mt-0.5">{errors.totalYearsExperience}</p>}
            </div>
            {renderSelect('PT Experience (Years)', 'ptExperienceYears', PT_EXPERIENCE_YEARS, false, 'Years')}
            {renderSelect('PT Experience (Months)', 'ptExperienceMonths', PT_EXPERIENCE_MONTHS, false, 'Months')}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Current Salary (₹) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={0}
                value={formData.currentSalary ?? ''}
                onChange={(e) => onChange('currentSalary', e.target.value)}
                placeholder="e.g. 25000"
                className="h-10"
              />
              {errors.currentSalary && <p className="text-xs text-red-500 mt-0.5">{errors.currentSalary}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Expected Salary (₹) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={0}
                value={formData.expectedSalary ?? ''}
                onChange={(e) => onChange('expectedSalary', e.target.value)}
                placeholder="e.g. 35000"
                className="h-10"
              />
              {errors.expectedSalary && <p className="text-xs text-red-500 mt-0.5">{errors.expectedSalary}</p>}
            </div>
            {renderSelect('How Soon Can You Join', 'howSoonCanJoin', HOW_SOON_OPTIONS, true, 'Select availability')}
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card className="shadow-sm border-0 ring-1 ring-gray-100 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-3 text-base font-semibold text-gray-800">
            <SectionIcon icon={MapPin} color="bg-amber-500" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            {renderField('Specialization', 'specialization', false, 'e.g. Weight Training, Yoga')}
            {renderField('Current/Last Gym Name', 'currentGymName', false, 'Gym name')}
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Reason for Leaving</Label>
              <Textarea
                value={formData.reasonForLeaving || ''}
                onChange={(e) => onChange('reasonForLeaving', e.target.value)}
                placeholder="Reason for leaving current/last gym"
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Number of Gyms Changed</Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={formData.numberOfGymsChanged ?? ''}
                onChange={(e) => onChange('numberOfGymsChanged', e.target.value)}
                placeholder="e.g. 3"
                className="h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card className="shadow-sm border-0 ring-1 ring-gray-100 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-3 text-base font-semibold text-gray-800">
            <SectionIcon icon={Heart} color="bg-purple-500" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            {renderSelect('Gender', 'gender', GENDER_OPTIONS, true, 'Select Gender')}
            {renderSelect('Marital Status', 'maritalStatus', MARITAL_STATUS_OPTIONS, false, 'Select')}
          </div>
        </CardContent>
      </Card>

      {/* Certificates */}
      <Card className="shadow-sm border-0 ring-1 ring-gray-100 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-rose-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-3 text-base font-semibold text-gray-800">
            <SectionIcon icon={Award} color="bg-rose-500" />
            Certificates
            <span className="text-xs font-normal text-gray-400 ml-1">(Optional)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          {/* Upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group border-2 border-dashed border-gray-200 rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            {uploading ? (
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="text-sm text-gray-700 font-semibold">
                  Click to upload certificates
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPEG, PNG, WebP or PDF — max 5 MB each
                </p>
              </>
            )}
          </div>

          {/* Uploaded files */}
          {documents.length > 0 && (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  {doc.fileType === 'pdf' ? (
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-red-500" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(doc.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
