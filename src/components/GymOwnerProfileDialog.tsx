import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  User, Building2, MapPin, Phone, Mail, Globe, FileText,
  Calendar, CreditCard, Users, Save, X, Pencil
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';
import { gymOwnerService } from '@/services/gymOwner.service';
import { BACKEND_BASE_URL } from '@/services/api';
import type { UpdateGymOwnerProfile } from '@/types';

interface GymOwnerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GymOwnerProfileDialog({ open, onOpenChange }: GymOwnerProfileDialogProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateGymOwnerProfile>({});

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['gymOwnerProfile'],
    queryFn: () => gymOwnerService.getProfile(),
    enabled: open,
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        gymName: profile.gym.name,
        address1: profile.gym.address1 || '',
        address2: profile.gym.address2 || '',
        city: profile.gym.city || '',
        state: profile.gym.state || '',
        zipcode: profile.gym.zipcode || '',
        phoneNo: profile.gym.phoneNo || '',
        gstRegNo: profile.gym.gstRegNo || '',
        website: profile.gym.website || '',
        memberSize: profile.gym.memberSize || undefined,
        note: profile.gym.note || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateGymOwnerProfile) => gymOwnerService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymOwnerProfile'] });
      toast({ title: 'Profile updated successfully' });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to update profile',
        description: err?.response?.data?.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        gymName: profile.gym.name,
        address1: profile.gym.address1 || '',
        address2: profile.gym.address2 || '',
        city: profile.gym.city || '',
        state: profile.gym.state || '',
        zipcode: profile.gym.zipcode || '',
        phoneNo: profile.gym.phoneNo || '',
        gstRegNo: profile.gym.gstRegNo || '',
        website: profile.gym.website || '',
        memberSize: profile.gym.memberSize || undefined,
        note: profile.gym.note || '',
      });
    }
    setIsEditing(false);
  };

  const getDaysRemaining = () => {
    if (!profile?.gym.subscriptionEnd) return null;
    const end = new Date(profile.gym.subscriptionEnd);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            My Profile
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            Failed to load profile. Please try again.
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Header Section with Logo */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              {profile.gym.gymLogo ? (
                <img
                  src={`${BACKEND_BASE_URL}${profile.gym.gymLogo}`}
                  alt="Gym Logo"
                  className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                  {profile.gym.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{profile.gym.name}</h3>
                <p className="text-sm text-gray-600">{profile.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={profile.gym.isActive ? 'default' : 'secondary'}>
                    {profile.gym.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {profile.gym.subscriptionPlan && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <CreditCard className="h-3 w-3 mr-1" />
                      {profile.gym.subscriptionPlan.name}
                    </Badge>
                  )}
                </div>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            {/* Subscription Info */}
            {profile.gym.subscriptionPlan && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Subscription Period</p>
                    <p className="font-medium">
                      {profile.gym.subscriptionStart && format(new Date(profile.gym.subscriptionStart), 'dd MMM yyyy')}
                      {' - '}
                      {profile.gym.subscriptionEnd && format(new Date(profile.gym.subscriptionEnd), 'dd MMM yyyy')}
                    </p>
                  </div>
                  {daysRemaining !== null && (
                    <Badge
                      variant={daysRemaining <= 7 ? 'destructive' : daysRemaining <= 30 ? 'secondary' : 'default'}
                      className="text-sm"
                    >
                      {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired'}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Owner Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-gray-600">
                  <User className="h-4 w-4" />
                  Owner Name
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="font-medium">{profile.name}</p>
                )}
              </div>

              {/* Gym Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-gray-600">
                  <Building2 className="h-4 w-4" />
                  Gym Name
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.gymName || ''}
                    onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                    placeholder="Enter gym name"
                  />
                ) : (
                  <p className="font-medium">{profile.gym.name}</p>
                )}
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-gray-600">
                  <Mail className="h-4 w-4" />
                  Email
                  <span className="text-xs text-gray-400 ml-1">(cannot be changed)</span>
                </Label>
                <p className="font-medium text-gray-500">{profile.email}</p>
              </div>

              {/* Mobile (Read-only) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-gray-600">
                  <Phone className="h-4 w-4" />
                  Mobile No
                  <span className="text-xs text-gray-400 ml-1">(cannot be changed)</span>
                </Label>
                <p className="font-medium text-gray-500">{profile.gym.mobileNo || '-'}</p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-gray-600">
                  <Phone className="h-4 w-4" />
                  Phone No
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.phoneNo || ''}
                    onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="font-medium">{profile.gym.phoneNo || '-'}</p>
                )}
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-gray-600">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="Enter website URL"
                  />
                ) : (
                  <p className="font-medium">{profile.gym.website || '-'}</p>
                )}
              </div>

              {/* Address 1 */}
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-1 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  Address Line 1
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.address1 || ''}
                    onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                    placeholder="Enter address line 1"
                  />
                ) : (
                  <p className="font-medium">{profile.gym.address1 || '-'}</p>
                )}
              </div>

              {/* Address 2 */}
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-1 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  Address Line 2
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.address2 || ''}
                    onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                    placeholder="Enter address line 2"
                  />
                ) : (
                  <p className="font-medium">{profile.gym.address2 || '-'}</p>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label className="text-gray-600">City</Label>
                {isEditing ? (
                  <Input
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Enter city"
                  />
                ) : (
                  <p className="font-medium">{profile.gym.city || '-'}</p>
                )}
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label className="text-gray-600">State</Label>
                {isEditing ? (
                  <Input
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Enter state"
                  />
                ) : (
                  <p className="font-medium">{profile.gym.state || '-'}</p>
                )}
              </div>

              {/* Zipcode */}
              <div className="space-y-2">
                <Label className="text-gray-600">Zipcode</Label>
                {isEditing ? (
                  <Input
                    value={formData.zipcode || ''}
                    onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                    placeholder="Enter zipcode"
                  />
                ) : (
                  <p className="font-medium">{profile.gym.zipcode || '-'}</p>
                )}
              </div>

              {/* GST Reg No */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-gray-600">
                  <FileText className="h-4 w-4" />
                  GST Registration No
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.gstRegNo || ''}
                    onChange={(e) => setFormData({ ...formData, gstRegNo: e.target.value })}
                    placeholder="Enter GST number"
                  />
                ) : (
                  <p className="font-medium">{profile.gym.gstRegNo || '-'}</p>
                )}
              </div>

              {/* Member Size */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-gray-600">
                  <Users className="h-4 w-4" />
                  Expected Member Size
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.memberSize || ''}
                    onChange={(e) => setFormData({ ...formData, memberSize: parseInt(e.target.value) || undefined })}
                    placeholder="Enter expected members"
                  />
                ) : (
                  <p className="font-medium">{profile.gym.memberSize || '-'}</p>
                )}
              </div>

              {/* Member Since */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </Label>
                <p className="font-medium">
                  {format(new Date(profile.createdAt), 'dd MMM yyyy')}
                </p>
              </div>

              {/* Note/Terms */}
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-1 text-gray-600">
                  <FileText className="h-4 w-4" />
                  Terms & Conditions (shown on receipts)
                </Label>
                {isEditing ? (
                  <textarea
                    className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.note || ''}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Enter terms and conditions"
                  />
                ) : (
                  <p className="font-medium text-sm whitespace-pre-wrap">{profile.gym.note || '-'}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Spinner className="h-4 w-4 mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
