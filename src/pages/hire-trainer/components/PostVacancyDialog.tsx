import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { SearchableMultiSelect } from './SearchableMultiSelect';
import { SearchableSingleSelect } from './SearchableSingleSelect';
import { trainerVacancyService } from '@/services/trainerVacancy.service';
import { INDIAN_STATES, CITIES_BY_STATE, HIRE_TRAINER_ROLES, HOW_SOON_OPTIONS } from '@/data/indianStates';
import { Loader2 } from 'lucide-react';
import type { TrainerVacancy } from '@/types';

const SPECIALIZATION_OPTIONS = [
  'Strength Training', 'Cardio', 'Yoga', 'CrossFit', 'Pilates',
  'Zumba', 'Boxing', 'MMA', 'Nutrition', 'Weight Loss',
  'Body Building', 'Functional Training', 'Calisthenics', 'Swimming',
  'Dance Fitness', 'HIIT', 'Rehabilitation', 'Sports Training', 'Other',
].map((s) => ({ value: s, label: s }));

interface PostVacancyDialogProps {
  open: boolean;
  onClose: () => void;
  gymOwnerEmail: string;
  editVacancy?: TrainerVacancy | null;
}

export function PostVacancyDialog({
  open,
  onClose,
  gymOwnerEmail,
  editVacancy,
}: PostVacancyDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!editVacancy;

  const [form, setForm] = useState({
    role: '' as string,
    yearsOfExperience: '',
    ptClientExperience: '',
    description: '',
    specializations: [] as string[],
    certificate: '',
    isPTTrainer: false,
    howSoonCanJoin: '',
    gender: '',
    salaryMin: '',
    salaryMax: '',
    salaryType: 'PER_MONTH' as string,
    country: 'India',
    state: '',
    city: '',
    closeDate: '',
  });

  useEffect(() => {
    if (editVacancy) {
      setForm({
        role: editVacancy.role || '',
        yearsOfExperience: editVacancy.yearsOfExperience?.toString() || '',
        ptClientExperience: editVacancy.ptClientExperience?.toString() || '',
        description: editVacancy.description || '',
        specializations: editVacancy.specialization
          ? editVacancy.specialization.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        certificate: editVacancy.certificate || '',
        isPTTrainer: editVacancy.isPTTrainer,
        howSoonCanJoin: editVacancy.howSoonCanJoin || '',
        gender: editVacancy.gender || '',
        salaryMin: editVacancy.salaryMin?.toString() || '',
        salaryMax: editVacancy.salaryMax?.toString() || '',
        salaryType: editVacancy.salaryType || 'PER_MONTH',
        country: editVacancy.country || 'India',
        state: editVacancy.state || '',
        city: editVacancy.city || '',
        closeDate: editVacancy.closeDate ? editVacancy.closeDate.split('T')[0] : '',
      });
    } else {
      setForm({
        role: '',
        yearsOfExperience: '',
        ptClientExperience: '',
        description: '',
        specializations: [],
        certificate: '',
        isPTTrainer: false,
        howSoonCanJoin: '',
        gender: '',
        salaryMin: '',
        salaryMax: '',
        salaryType: 'PER_MONTH',
        country: 'India',
        state: '',
        city: '',
        closeDate: '',
      });
    }
  }, [editVacancy, open]);

  const stateCities = form.state ? (CITIES_BY_STATE[form.state] ?? []) : [];

  const createMutation = useMutation({
    mutationFn: () =>
      trainerVacancyService.create({
        gymOwnerLeadEmail: gymOwnerEmail,
        role: form.role,
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
        ptClientExperience: form.ptClientExperience ? Number(form.ptClientExperience) : undefined,
        description: form.description || undefined,
        specialization: form.specializations.length > 0 ? form.specializations.join(', ') : undefined,
        certificate: form.certificate || undefined,
        isPTTrainer: form.isPTTrainer,
        howSoonCanJoin: form.howSoonCanJoin || undefined,
        gender: form.gender || undefined,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        salaryType: form.salaryType || undefined,
        country: form.country,
        state: form.state || undefined,
        city: form.city || undefined,
        closeDate: form.closeDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-vacancies'] });
      queryClient.invalidateQueries({ queryKey: ['my-vacancies'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      trainerVacancyService.update(editVacancy!.id, {
        gymOwnerLeadEmail: gymOwnerEmail,
        role: form.role,
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
        ptClientExperience: form.ptClientExperience ? Number(form.ptClientExperience) : undefined,
        description: form.description || undefined,
        specialization: form.specializations.length > 0 ? form.specializations.join(', ') : undefined,
        certificate: form.certificate || undefined,
        isPTTrainer: form.isPTTrainer,
        howSoonCanJoin: form.howSoonCanJoin || undefined,
        gender: form.gender || undefined,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        salaryType: form.salaryType || undefined,
        country: form.country,
        state: form.state || undefined,
        city: form.city || undefined,
        closeDate: form.closeDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-vacancies'] });
      queryClient.invalidateQueries({ queryKey: ['my-vacancies'] });
      onClose();
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role) return;
    if (isEdit) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Vacancy' : 'Post Trainer Vacancy'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Role Type */}
          <div className="space-y-1.5">
            <Label>Role Type <span className="text-red-500">*</span></Label>
            <Select value={form.role} onValueChange={(v) => updateField('role', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role type" />
              </SelectTrigger>
              <SelectContent>
                {HIRE_TRAINER_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Experience Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Years of Experience</Label>
              <Input
                type="number"
                min={0}
                max={50}
                placeholder="e.g. 3"
                value={form.yearsOfExperience}
                onChange={(e) => updateField('yearsOfExperience', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>PT Client Experience (years)</Label>
              <Input
                type="number"
                min={0}
                max={50}
                placeholder="e.g. 2"
                value={form.ptClientExperience}
                onChange={(e) => updateField('ptClientExperience', e.target.value)}
              />
            </div>
          </div>

          {/* Description - Rich Text */}
          <div className="space-y-1.5">
            <RichTextEditor
              label="Description"
              value={form.description}
              onChange={(v) => updateField('description', v)}
              placeholder="Describe the job role, responsibilities, perks..."
            />
          </div>

          {/* Specialization (multi-select) */}
          <div className="space-y-1.5">
            <Label>Specialization</Label>
            <SearchableMultiSelect
              options={SPECIALIZATION_OPTIONS}
              selected={form.specializations}
              onChange={(vals) => updateField('specializations', vals)}
              placeholder="Select specializations"
              searchPlaceholder="Search specializations..."
              maxDisplay={3}
            />
          </div>

          {/* Certificate */}
          <div className="space-y-1.5">
            <Label>Certificate Required</Label>
            <Input
              placeholder="e.g. ACE, NASM, ISSA, or None"
              value={form.certificate}
              onChange={(e) => updateField('certificate', e.target.value)}
            />
          </div>

          {/* Is PT Trainer */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="isPTTrainer"
              checked={form.isPTTrainer}
              onCheckedChange={(v) => updateField('isPTTrainer', !!v)}
            />
            <Label htmlFor="isPTTrainer" className="cursor-pointer">Is PT Trainer Required?</Label>
          </div>

          {/* Gender Preference */}
          <div className="space-y-1.5">
            <Label>Gender Preference</Label>
            <Select value={form.gender} onValueChange={(v) => updateField('gender', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Any">Any</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* How Soon Can Join */}
          <div className="space-y-1.5">
            <Label>How Soon Can Join?</Label>
            <Select value={form.howSoonCanJoin} onValueChange={(v) => updateField('howSoonCanJoin', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select availability" />
              </SelectTrigger>
              <SelectContent>
                {HOW_SOON_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Salary Range */}
          <div className="space-y-1.5">
            <Label>Salary Range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Min"
                value={form.salaryMin}
                onChange={(e) => updateField('salaryMin', e.target.value)}
                className="flex-1"
              />
              <span className="text-gray-400 text-sm">–</span>
              <Input
                type="number"
                min={0}
                placeholder="Max"
                value={form.salaryMax}
                onChange={(e) => updateField('salaryMax', e.target.value)}
                className="flex-1"
              />
              <Select value={form.salaryType} onValueChange={(v) => updateField('salaryType', v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_MONTH">Per Month</SelectItem>
                  <SelectItem value="PER_YEAR">Per Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location: Country (read-only), State and City */}
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input value="India" disabled className="bg-gray-50" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>State</Label>
              <SearchableSingleSelect
                options={INDIAN_STATES}
                value={form.state}
                onChange={(val) => {
                  updateField('state', val);
                  if (val !== form.state) updateField('city', '');
                }}
                placeholder="Select state"
                searchPlaceholder="Search states..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <SearchableSingleSelect
                options={stateCities}
                value={form.city}
                onChange={(val) => updateField('city', val)}
                placeholder={form.state ? 'Select city' : 'Select state first'}
                searchPlaceholder="Search cities..."
                disabled={!form.state}
              />
            </div>
          </div>

          {/* Close Application Date */}
          <div className="space-y-1.5">
            <Label>Close Application Date</Label>
            <Input
              type="date"
              value={form.closeDate}
              onChange={(e) => updateField('closeDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              {(error as Error).message || 'Something went wrong'}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.role || isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isEdit ? 'Update Vacancy' : 'Post Vacancy'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
