import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  MapPin,
  Briefcase,
  Clock,
  IndianRupee,
  Building2,
  Dumbbell,
  CalendarDays,
  Award,
  FileText,
  Users,
  Pencil,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WhatsAppFilledIcon } from '@/components/ui/icons';
import { gymOwnerLeadService } from '@/services/gymOwnerLead.service';
import type { TrainerVacancy } from '@/types';

const roleLabels: Record<string, string> = {
  FIRST_HALF: 'First Half',
  SECOND_HALF: 'Second Half',
  FULL_TIME: 'Full Time',
};

interface VacancyDetailPanelProps {
  vacancy: TrainerVacancy;
  onClose: () => void;
  onEdit?: (vacancy: TrainerVacancy) => void;
  isOwner?: boolean;
}

function openWhatsApp(vacancy: TrainerVacancy, trainerName: string) {
  const gymName = vacancy.gymOwnerLead.gymName;
  const ownerName = vacancy.gymOwnerLead.name;
  const role = roleLabels[vacancy.role] || vacancy.role;
  const location = [vacancy.city, vacancy.state].filter(Boolean).join(', ');

  const msg = encodeURIComponent(
    `Hello ${ownerName},\n\n` +
    `I'm *${trainerName}*, and I found your *${role} Trainer* vacancy at *${gymName}* on *Gym Desk Pro*.\n\n` +
    (location ? `Location: ${location}\n` : '') +
    `I'm interested in this position and would love to discuss the opportunity.\n\n` +
    `Looking forward to hearing from you!\n\n` +
    `— ${trainerName} (via Gym Desk Pro)`,
  );
  const mobile = vacancy.gymOwnerLead.mobile.replace(/\D/g, '');
  const intlMobile = mobile.startsWith('91') ? mobile : `91${mobile}`;
  window.open(`https://wa.me/${intlMobile}?text=${msg}`, '_blank');
}

export function VacancyDetailPanel({ vacancy, onClose, onEdit, isOwner }: VacancyDetailPanelProps) {
  const navigate = useNavigate();
  const location = [vacancy.city, vacancy.state].filter(Boolean).join(', ');
  const salaryLabel = vacancy.salaryType === 'PER_YEAR' ? '/year' : '/month';

  const formatSalary = (val: number | null) =>
    val != null ? `₹${Number(val).toLocaleString('en-IN')}` : null;

  const salaryRange = [formatSalary(vacancy.salaryMin), formatSalary(vacancy.salaryMax)]
    .filter(Boolean)
    .join(' – ');

  const daysLeft = vacancy.closeDate
    ? Math.max(0, Math.ceil((new Date(vacancy.closeDate).getTime() - Date.now()) / 86400000))
    : null;

  const handleContactClick = useCallback(() => {
    // Check if trainer is logged in
    const savedEmail = gymOwnerLeadService.getSavedEmail();

    if (!savedEmail) {
      navigate('/hire-trainer/login?from=vacancy');
      return;
    }

    // Get trainer's name from localStorage or fallback
    const trainerName = localStorage.getItem('hire-trainer-name') || 'Trainer';
    openWhatsApp(vacancy, trainerName);
  }, [vacancy, navigate]);

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-start justify-between shrink-0 bg-gradient-to-r from-blue-50 to-white">
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg font-bold text-gray-900">{vacancy.gymOwnerLead.gymName}</h2>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                {roleLabels[vacancy.role] || vacancy.role}
              </Badge>
              {vacancy.isPTTrainer && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                  <Dumbbell className="w-3 h-3 mr-1" /> PT Required
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Posted by {vacancy.gymOwnerLead.name}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOwner && onEdit && (
              <button
                onClick={() => onEdit(vacancy)}
                className="p-1.5 rounded-full hover:bg-blue-100 transition-colors"
                title="Edit vacancy"
              >
                <Pencil className="w-4 h-4 text-blue-600" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Highlight Cards */}
          <div className="grid grid-cols-2 gap-3">
            {location && (
              <HighlightCard icon={<MapPin className="w-4 h-4 text-emerald-600" />} label="Location" value={location} />
            )}
            {vacancy.yearsOfExperience != null && (
              <HighlightCard icon={<Briefcase className="w-4 h-4 text-blue-600" />} label="Experience" value={`${vacancy.yearsOfExperience}+ years`} />
            )}
            {salaryRange && (
              <HighlightCard icon={<IndianRupee className="w-4 h-4 text-amber-600" />} label="Salary" value={`${salaryRange}${salaryLabel}`} />
            )}
            {vacancy.howSoonCanJoin && (
              <HighlightCard icon={<Clock className="w-4 h-4 text-violet-600" />} label="Join By" value={vacancy.howSoonCanJoin} />
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            {vacancy.specialization && (
              <DetailRow icon={<Dumbbell className="w-4 h-4 text-gray-400" />} label="Specialization" value={vacancy.specialization} />
            )}
            {vacancy.certificate && (
              <DetailRow icon={<Award className="w-4 h-4 text-gray-400" />} label="Certificate Required" value={vacancy.certificate} />
            )}
            {vacancy.ptClientExperience != null && (
              <DetailRow icon={<Briefcase className="w-4 h-4 text-gray-400" />} label="PT Client Experience" value={`${vacancy.ptClientExperience} years`} />
            )}
            {vacancy.gender && (
              <DetailRow icon={<Users className="w-4 h-4 text-gray-400" />} label="Gender Preference" value={vacancy.gender} />
            )}
            {daysLeft !== null && (
              <DetailRow
                icon={<CalendarDays className="w-4 h-4 text-gray-400" />}
                label="Application Deadline"
                value={`${new Date(vacancy.closeDate!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${daysLeft === 0 ? 'Today' : `${daysLeft} days left`})`}
              />
            )}
          </div>

          {/* Description */}
          {vacancy.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 pb-1.5 border-b border-gray-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" /> Job Description
              </h3>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: vacancy.description }}
              />
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="border-t px-6 py-4 bg-gray-50 shrink-0">
          {isOwner ? (
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                onClick={() => onEdit?.(vacancy)}
              >
                <Pencil className="w-4 h-4" />
                Edit Vacancy
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-[#25D366] hover:bg-[#1ebe57] text-white gap-2"
                  onClick={handleContactClick}
                >
                  <WhatsAppFilledIcon size={18} />
                  Contact via WhatsApp
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                Message will be sent to the gym owner
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function HighlightCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}
