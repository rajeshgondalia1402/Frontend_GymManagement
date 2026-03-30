import { MapPin, Briefcase, Clock, IndianRupee, User, ChevronRight, Dumbbell, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { HireTrainerSearchResult } from '@/types';

interface TrainerListCardProps {
  trainer: HireTrainerSearchResult;
  isSelected: boolean;
  onClick: () => void;
}

const roleLabels: Record<string, string> = {
  FIRST_HALF: 'First Half',
  SECOND_HALF: 'Second Half',
  FULL_TIME: 'Full Time',
};

const roleBadgeColors: Record<string, string> = {
  FIRST_HALF: 'bg-blue-50 text-blue-700 border-blue-200',
  SECOND_HALF: 'bg-purple-50 text-purple-700 border-purple-200',
  FULL_TIME: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function formatExp(years: number | null, months?: number | null): string {
  const y = years ?? 0;
  const m = months ?? 0;
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} Year${y !== 1 ? 's' : ''}`);
  if (m > 0) parts.push(`${m} Month${m !== 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(' ') : 'Fresher';
}

export function TrainerListCard({ trainer, isSelected, onClick }: TrainerListCardProps) {
  const totalExpLabel = formatExp(trainer.totalYearsExperience);
  const ptExpLabel = formatExp(trainer.ptExperienceYears, trainer.ptExperienceMonths);
  const hasPtExp = (trainer.ptExperienceYears ?? 0) > 0 || (trainer.ptExperienceMonths ?? 0) > 0;

  const postedDate = formatTimeAgo(trainer.createdAt);

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-4 sm:p-5 cursor-pointer transition-all hover:shadow-md group ${
        isSelected
          ? 'border-emerald-400 ring-1 ring-emerald-200 shadow-md'
          : 'border-gray-200 hover:border-emerald-300'
      }`}
    >
      <div className="flex gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg font-bold ${
              isSelected
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {trainer.fullName
              ? trainer.fullName.charAt(0).toUpperCase()
              : <User className="w-5 h-5" />}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Name + Role */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate group-hover:text-emerald-700 transition-colors">
              {trainer.fullName || 'Unnamed Trainer'}
            </h3>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 shrink-0 mt-1 transition-colors" />
          </div>

          {/* Row 2: Key info pills */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-600 mb-3">
            {trainer.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {trainer.city}{trainer.state ? `, ${trainer.state}` : ''}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-gray-400" />
              {totalExpLabel}
            </span>
            {hasPtExp && (
              <span className="flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5 text-gray-400" />
                {ptExpLabel} PT
              </span>
            )}
            {trainer.expectedSalary != null && (
              <span className="flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                ₹{Number(trainer.expectedSalary).toLocaleString('en-IN')}/mo
              </span>
            )}
            {trainer.howSoonCanJoin && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {trainer.howSoonCanJoin}
              </span>
            )}
          </div>

          {/* Row 3: Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {trainer.role && (
              <Badge
                variant="outline"
                className={`text-xs font-medium ${roleBadgeColors[trainer.role] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}
              >
                {roleLabels[trainer.role] ?? trainer.role}
              </Badge>
            )}
            {trainer.specialization && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                {trainer.specialization}
              </Badge>
            )}
            {trainer.gender && (
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                <UserCheck className="w-3 h-3 mr-0.5" />
                {trainer.gender}
              </Badge>
            )}

            {/* Post date — right aligned on larger screens */}
            <span className="text-xs text-gray-400 sm:ml-auto">{postedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
}
