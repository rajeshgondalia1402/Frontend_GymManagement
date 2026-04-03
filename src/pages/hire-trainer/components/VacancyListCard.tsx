import {
  MapPin,
  Briefcase,
  Clock,
  IndianRupee,
  Building2,
  CalendarDays,
  Dumbbell,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TrainerVacancy } from '@/types';

const roleLabels: Record<string, string> = {
  FIRST_HALF: 'First Half',
  SECOND_HALF: 'Second Half',
  FULL_TIME: 'Full Time',
};

interface VacancyListCardProps {
  vacancy: TrainerVacancy;
  isSelected: boolean;
  onClick: () => void;
}

export function VacancyListCard({ vacancy, isSelected, onClick }: VacancyListCardProps) {
  const location = [vacancy.city, vacancy.state].filter(Boolean).join(', ');
  const salaryLabel = vacancy.salaryType === 'PER_YEAR' ? '/yr' : '/mo';

  const formatSalary = (val: number | null) =>
    val != null ? `₹${Number(val).toLocaleString('en-IN')}` : null;

  const salaryRange = [formatSalary(vacancy.salaryMin), formatSalary(vacancy.salaryMax)]
    .filter(Boolean)
    .join(' – ');

  const daysLeft = vacancy.closeDate
    ? Math.max(0, Math.ceil((new Date(vacancy.closeDate).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 group ${
        isSelected
          ? 'border-blue-400 bg-blue-50/60 shadow-sm'
          : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {vacancy.gymOwnerLead.gymName}
            </h3>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-blue-200 text-blue-700 bg-blue-50"
            >
              {roleLabels[vacancy.role] || vacancy.role}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            <Building2 className="w-3 h-3 inline mr-1" />
            {vacancy.gymOwnerLead.name}
          </p>
        </div>
        {vacancy.isPTTrainer && (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] shrink-0">
            <Dumbbell className="w-3 h-3 mr-1" />
            PT
          </Badge>
        )}
      </div>

      {/* Info chips */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-gray-600 mt-2">
        {location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-gray-400" /> {location}
          </span>
        )}
        {vacancy.yearsOfExperience != null && (
          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-gray-400" /> {vacancy.yearsOfExperience}+ yrs
          </span>
        )}
        {salaryRange && (
          <span className="flex items-center gap-1">
            <IndianRupee className="w-3 h-3 text-gray-400" /> {salaryRange}{salaryLabel}
          </span>
        )}
        {vacancy.howSoonCanJoin && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" /> {vacancy.howSoonCanJoin}
          </span>
        )}
        {vacancy.gender && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-400" /> {vacancy.gender}
          </span>
        )}
      </div>

      {/* Specialization & close date */}
      <div className="flex items-center justify-between mt-2.5">
        {vacancy.specialization && (
          <Badge variant="outline" className="text-[10px] text-gray-500 font-normal">
            {vacancy.specialization}
          </Badge>
        )}
        {daysLeft !== null && (
          <span className={`text-[10px] flex items-center gap-1 ${
            daysLeft <= 3 ? 'text-red-500' : 'text-gray-400'
          }`}>
            <CalendarDays className="w-3 h-3" />
            {daysLeft === 0 ? 'Closes today' : `${daysLeft}d left`}
          </span>
        )}
      </div>
    </button>
  );
}
