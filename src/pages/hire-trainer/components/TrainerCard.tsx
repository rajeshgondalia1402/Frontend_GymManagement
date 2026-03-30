import { MapPin, Briefcase, Clock, IndianRupee, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { HireTrainerSearchResult } from '@/types';

interface TrainerCardProps {
  trainer: HireTrainerSearchResult;
}

const roleLabels: Record<string, string> = {
  FIRST_HALF: 'First Half',
  SECOND_HALF: 'Second Half',
  FULL_TIME: 'Full Time',
};

const roleBadgeColors: Record<string, string> = {
  FIRST_HALF: 'bg-blue-100 text-blue-700',
  SECOND_HALF: 'bg-purple-100 text-purple-700',
  FULL_TIME: 'bg-emerald-100 text-emerald-700',
};

export function TrainerCard({ trainer }: TrainerCardProps) {
  const totalExp = trainer.totalYearsExperience ?? 0;
  const ptYears = trainer.ptExperienceYears ?? 0;
  const ptMonths = trainer.ptExperienceMonths ?? 0;

  const ptExpLabel =
    ptYears || ptMonths
      ? `${ptYears > 0 ? `${ptYears}y` : ''}${ptMonths > 0 ? ` ${ptMonths}m` : ''} PT`
      : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Name & Role Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
              {trainer.fullName || 'Unnamed'}
            </h3>
          </div>
          {trainer.role && (
            <Badge
              variant="secondary"
              className={`text-xs whitespace-nowrap ${roleBadgeColors[trainer.role] ?? ''}`}
            >
              {roleLabels[trainer.role] ?? trainer.role}
            </Badge>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
          {trainer.city && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">
                {trainer.city}
                {trainer.state ? `, ${trainer.state}` : ''}
              </span>
            </div>
          )}

          {totalExp > 0 && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>
                {totalExp} yr{totalExp !== 1 ? 's' : ''} total
                {ptExpLabel ? ` · ${ptExpLabel}` : ''}
              </span>
            </div>
          )}

          {trainer.expectedSalary != null && (
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>₹{trainer.expectedSalary.toLocaleString('en-IN')}/mo</span>
            </div>
          )}

          {trainer.howSoonCanJoin && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{trainer.howSoonCanJoin}</span>
            </div>
          )}
        </div>

        {/* Specialization & Gender */}
        <div className="flex flex-wrap gap-1.5">
          {trainer.specialization && (
            <Badge variant="outline" className="text-xs">
              {trainer.specialization}
            </Badge>
          )}
          {trainer.gender && (
            <Badge variant="outline" className="text-xs">
              {trainer.gender}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
