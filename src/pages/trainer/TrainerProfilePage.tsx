import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Award,
  IndianRupee,
  Building2,
  MapPin,
  Clock,
  FileText,
  Shield,
  Dumbbell,
  Star,
} from 'lucide-react';
import { trainerService } from '@/services/trainer.service';
import { format, parseISO, differenceInYears } from 'date-fns';

export function TrainerProfilePage() {
  const { data: profile, isLoading, error, isError } = useQuery({
    queryKey: ['trainer-profile-details'],
    queryFn: () => trainerService.getProfileDetails(),
    retry: 1,
  });

  // Debug logging
  console.log('TrainerProfilePage - isLoading:', isLoading, 'isError:', isError, 'profile:', profile, 'error:', error);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg">Unable to load profile</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {errorMessage}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Please check if the API is running and try again
          </p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd MMM yyyy');
    } catch {
      return 'N/A';
    }
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    try {
      return differenceInYears(new Date(), parseISO(dateOfBirth));
    } catch {
      return null;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const age = calculateAge(profile.dateOfBirth);

  const getGymAddress = () => {
    if (!profile.gym) return null;
    const parts = [
      profile.gym.address1,
      profile.gym.address2,
      profile.gym.city,
      profile.gym.state,
      profile.gym.zipcode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Profile Header Card */}
      <Card className="relative overflow-hidden border-0 shadow-xl">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMiAyLTQgMi00cy0yLTItNC0yLTQgMC00IDAgMiA0IDIgNHMtMiAyLTIgNCAyIDQgMiA0IDItMiA0LTIgNCAwIDQgMC0yLTQtMi00czItMiAyLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>

        <CardContent className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Profile Photo */}
            <div className="relative">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-white/30 shadow-2xl">
                {profile.trainerPhoto ? (
                  <AvatarImage src={profile.trainerPhoto} alt={profile.name} />
                ) : null}
                <AvatarFallback className="bg-white/20 text-white text-3xl font-bold">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-2 shadow-lg">
                <Dumbbell className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {profile.name}
                </h1>
                <Badge
                  className={`w-fit mx-auto sm:mx-0 ${
                    profile.isActive
                      ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30'
                      : 'bg-red-500/20 text-red-100 border-red-400/30'
                  }`}
                >
                  {profile.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {profile.specialization && (
                <p className="text-violet-100 text-lg mb-3 flex items-center justify-center sm:justify-start gap-2">
                  <Star className="h-4 w-4" />
                  {profile.specialization}
                </p>
              )}

              <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </span>
                {profile.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Experience */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="p-4 text-center">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 w-fit mx-auto mb-2">
              <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {profile.experience ?? 0}
            </p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Years Experience</p>
          </CardContent>
        </Card>

        {/* Monthly Salary */}
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 border-emerald-200/50 dark:border-emerald-800/50">
          <CardContent className="p-4 text-center">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900 p-3 w-fit mx-auto mb-2">
              <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(profile.salary)}
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Monthly Salary</p>
          </CardContent>
        </Card>

        {/* Age */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="p-4 text-center">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 w-fit mx-auto mb-2">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {age ?? 'N/A'}
            </p>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70">Years Old</p>
          </CardContent>
        </Card>

        {/* Tenure */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 border-orange-200/50 dark:border-orange-800/50">
          <CardContent className="p-4 text-center">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-3 w-fit mx-auto mb-2">
              <Briefcase className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {profile.joiningDate
                ? differenceInYears(new Date(), parseISO(profile.joiningDate)) || '<1'
                : 'N/A'}
            </p>
            <p className="text-xs text-orange-600/70 dark:text-orange-400/70">Years at Gym</p>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-violet-500" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <InfoRow
                icon={<User className="h-4 w-4 text-gray-500" />}
                label="Full Name"
                value={profile.name}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4 text-blue-500" />}
                label="Email Address"
                value={profile.email}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4 text-green-500" />}
                label="Phone Number"
                value={profile.phone || 'Not provided'}
              />
              <InfoRow
                icon={<User className="h-4 w-4 text-purple-500" />}
                label="Gender"
                value={profile.gender || 'Not specified'}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4 text-orange-500" />}
                label="Date of Birth"
                value={formatDate(profile.dateOfBirth)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <InfoRow
                icon={<Star className="h-4 w-4 text-yellow-500" />}
                label="Specialization"
                value={profile.specialization || 'Not specified'}
              />
              <InfoRow
                icon={<Award className="h-4 w-4 text-blue-500" />}
                label="Experience"
                value={profile.experience ? `${profile.experience} years` : 'Not specified'}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4 text-green-500" />}
                label="Joining Date"
                value={formatDate(profile.joiningDate)}
              />
              <InfoRow
                icon={<IndianRupee className="h-4 w-4 text-emerald-500" />}
                label="Monthly Salary"
                value={formatCurrency(profile.salary)}
              />
              <InfoRow
                icon={<Shield className="h-4 w-4 text-violet-500" />}
                label="Account Status"
                value={
                  <Badge
                    variant={profile.isActive ? 'default' : 'secondary'}
                    className={
                      profile.isActive
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* ID Proof Information */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              ID Proof Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <InfoRow
                icon={<FileText className="h-4 w-4 text-orange-500" />}
                label="ID Proof Type"
                value={profile.idProofType || 'Not provided'}
              />
              <InfoRow
                icon={<FileText className="h-4 w-4 text-blue-500" />}
                label="ID Document"
                value={
                  profile.idProofDocument ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Uploaded</span>
                  ) : (
                    'Not uploaded'
                  )
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Gym Information */}
        {profile.gym && (
          <Card className="shadow-md">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-cyan-500" />
                Gym Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <InfoRow
                  icon={<Building2 className="h-4 w-4 text-cyan-500" />}
                  label="Gym Name"
                  value={profile.gym.name}
                />
                {getGymAddress() && (
                  <InfoRow
                    icon={<MapPin className="h-4 w-4 text-red-500" />}
                    label="Address"
                    value={getGymAddress()}
                  />
                )}
                {profile.gym.mobileNo && (
                  <InfoRow
                    icon={<Phone className="h-4 w-4 text-green-500" />}
                    label="Gym Phone"
                    value={profile.gym.mobileNo}
                  />
                )}
                {profile.gym.email && (
                  <InfoRow
                    icon={<Mail className="h-4 w-4 text-blue-500" />}
                    label="Gym Email"
                    value={profile.gym.email}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Account Timeline */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            Account Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account Created</p>
                <p className="font-medium">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
            {profile.updatedAt && (
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(profile.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for info rows
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-medium text-right max-w-[60%] break-words">
        {value}
      </div>
    </div>
  );
}

export default TrainerProfilePage;
