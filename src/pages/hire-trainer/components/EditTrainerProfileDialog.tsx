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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSingleSelect } from './SearchableSingleSelect';
import { hireTrainerService } from '@/services/hireTrainer.service';
import {
  INDIAN_STATES,
  CITIES_BY_STATE,
  HIRE_TRAINER_ROLES,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  HOW_SOON_OPTIONS,
} from '@/data/indianStates';
import { Loader2 } from 'lucide-react';
import type { HireTrainer } from '@/types';

interface EditTrainerProfileDialogProps {
  open: boolean;
  onClose: () => void;
  trainerEmail: string;
  trainer: HireTrainer;
}

export function EditTrainerProfileDialog({
  open,
  onClose,
  trainerEmail,
  trainer,
}: EditTrainerProfileDialogProps) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    fullName: '',
    address: '',
    whatsappNumber: '',
    state: '',
    city: '',
    role: '',
    totalYearsExperience: '',
    ptExperienceYears: '',
    ptExperienceMonths: '',
    currentSalary: '',
    expectedSalary: '',
    howSoonCanJoin: '',
    specialization: '',
    currentGymName: '',
    reasonForLeaving: '',
    numberOfGymsChanged: '',
    gender: '',
    maritalStatus: '',
  });

  useEffect(() => {
    if (trainer && open) {
      setForm({
        fullName: trainer.fullName || '',
        address: trainer.address || '',
        whatsappNumber: trainer.whatsappNumber || '',
        state: trainer.state || '',
        city: trainer.city || '',
        role: trainer.role || '',
        totalYearsExperience: trainer.totalYearsExperience?.toString() || '',
        ptExperienceYears: trainer.ptExperienceYears?.toString() || '',
        ptExperienceMonths: trainer.ptExperienceMonths?.toString() || '',
        currentSalary: trainer.currentSalary?.toString() || '',
        expectedSalary: trainer.expectedSalary?.toString() || '',
        howSoonCanJoin: trainer.howSoonCanJoin || '',
        specialization: trainer.specialization || '',
        currentGymName: trainer.currentGymName || '',
        reasonForLeaving: trainer.reasonForLeaving || '',
        numberOfGymsChanged: trainer.numberOfGymsChanged?.toString() || '',
        gender: trainer.gender || '',
        maritalStatus: trainer.maritalStatus || '',
      });
    }
  }, [trainer, open]);

  const stateCities = form.state ? (CITIES_BY_STATE[form.state] ?? []) : [];

  const updateMutation = useMutation({
    mutationFn: () =>
      hireTrainerService.updateProfile(trainerEmail, {
        fullName: form.fullName || undefined,
        address: form.address || undefined,
        whatsappNumber: form.whatsappNumber || undefined,
        state: form.state || undefined,
        city: form.city || undefined,
        role: form.role || undefined,
        totalYearsExperience: form.totalYearsExperience || undefined,
        ptExperienceYears: form.ptExperienceYears || undefined,
        ptExperienceMonths: form.ptExperienceMonths || undefined,
        currentSalary: form.currentSalary || undefined,
        expectedSalary: form.expectedSalary || undefined,
        howSoonCanJoin: form.howSoonCanJoin || undefined,
        specialization: form.specialization || undefined,
        currentGymName: form.currentGymName || undefined,
        reasonForLeaving: form.reasonForLeaving || undefined,
        numberOfGymsChanged: form.numberOfGymsChanged || undefined,
        gender: form.gender || undefined,
        maritalStatus: form.maritalStatus || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trainer-profile'] });
      queryClient.invalidateQueries({ queryKey: ['hire-trainers-search'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.role) return;
    updateMutation.mutate();
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              required
            />
          </div>

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
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Total Experience (yrs)</Label>
              <Input
                type="number"
                min={0}
                max={50}
                placeholder="e.g. 3"
                value={form.totalYearsExperience}
                onChange={(e) => updateField('totalYearsExperience', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>PT Exp (yrs)</Label>
              <Input
                type="number"
                min={0}
                max={50}
                placeholder="e.g. 2"
                value={form.ptExperienceYears}
                onChange={(e) => updateField('ptExperienceYears', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>PT Exp (months)</Label>
              <Input
                type="number"
                min={0}
                max={11}
                placeholder="e.g. 6"
                value={form.ptExperienceMonths}
                onChange={(e) => updateField('ptExperienceMonths', e.target.value)}
              />
            </div>
          </div>

          {/* Salary Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Current Salary (₹/mo)</Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 25000"
                value={form.currentSalary}
                onChange={(e) => updateField('currentSalary', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expected Salary (₹/mo)</Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 35000"
                value={form.expectedSalary}
                onChange={(e) => updateField('expectedSalary', e.target.value)}
              />
            </div>
          </div>

          {/* Specialization */}
          <div className="space-y-1.5">
            <Label>Specialization</Label>
            <Input
              placeholder="e.g. Strength Training, Yoga, CrossFit"
              value={form.specialization}
              onChange={(e) => updateField('specialization', e.target.value)}
            />
          </div>

          {/* Gender & Marital Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => updateField('gender', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Marital Status</Label>
              <Select value={form.maritalStatus} onValueChange={(v) => updateField('maritalStatus', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUS_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* How Soon Can Join */}
          <div className="space-y-1.5">
            <Label>How Soon Can You Join?</Label>
            <Select value={form.howSoonCanJoin} onValueChange={(v) => updateField('howSoonCanJoin', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select availability" />
              </SelectTrigger>
              <SelectContent>
                {HOW_SOON_OPTIONS.map((h) => (
                  <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>State</Label>
              <SearchableSingleSelect
                options={INDIAN_STATES}
                value={form.state}
                onChange={(v) => {
                  updateField('state', v);
                  updateField('city', '');
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
                onChange={(v) => updateField('city', v)}
                placeholder="Select city"
                searchPlaceholder="Search cities..."
                disabled={!form.state}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              placeholder="Enter your address"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
            />
          </div>

          {/* WhatsApp Number */}
          <div className="space-y-1.5">
            <Label>WhatsApp Number</Label>
            <Input
              placeholder="Enter WhatsApp number"
              value={form.whatsappNumber}
              onChange={(e) => updateField('whatsappNumber', e.target.value)}
            />
          </div>

          {/* Current Gym & Reason */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Current Gym Name</Label>
              <Input
                placeholder="e.g. Gold's Gym"
                value={form.currentGymName}
                onChange={(e) => updateField('currentGymName', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>No. of Gyms Changed</Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 2"
                value={form.numberOfGymsChanged}
                onChange={(e) => updateField('numberOfGymsChanged', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reason for Leaving</Label>
            <Input
              placeholder="Why are you looking for a new opportunity?"
              value={form.reasonForLeaving}
              onChange={(e) => updateField('reasonForLeaving', e.target.value)}
            />
          </div>

          {/* Error */}
          {updateMutation.error && (
            <p className="text-sm text-red-600">
              {(updateMutation.error as Error).message || 'Failed to update profile'}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending || !form.fullName || !form.role} className="bg-blue-600 hover:bg-blue-700 text-white">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
