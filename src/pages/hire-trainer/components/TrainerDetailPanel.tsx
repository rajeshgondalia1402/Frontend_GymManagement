import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  MapPin,
  Briefcase,
  Clock,
  IndianRupee,
  User,
  Dumbbell,
  CalendarDays,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WhatsAppFilledIcon } from '@/components/ui/icons';
import { gymOwnerLeadService } from '@/services/gymOwnerLead.service';
import type { HireTrainerSearchResult, GymOwnerLead } from '@/types';

interface TrainerDetailPanelProps {
  trainer: HireTrainerSearchResult;
  onClose: () => void;
}

const roleLabels: Record<string, string> = {
  FIRST_HALF: 'First Half',
  SECOND_HALF: 'Second Half',
  FULL_TIME: 'Full Time',
};

function openWhatsApp(trainer: HireTrainerSearchResult, lead: GymOwnerLead) {
  const trainerName = trainer.fullName || 'Trainer';
  const role = trainer.role ? (roleLabels[trainer.role] ?? trainer.role) : 'Trainer';
  const salary =
    trainer.expectedSalary != null
      ? `₹${Number(trainer.expectedSalary).toLocaleString('en-IN')}/month`
      : '';
  const location = [trainer.city, trainer.state].filter(Boolean).join(', ');

  const msg = encodeURIComponent(
    `Hello ${trainerName},\n\n` +
    `I'm *${lead.name}*, owner of *${lead.gymName}*. ` +
    `I found your profile on *Gym Desk Pro* and I'm interested in hiring you as a *${role}* trainer for my gym` +
    (location ? ` in ${location}` : '') +
    `.\n\n` +
    (salary ? `I noticed your expected salary is *${salary}*. ` : '') +
    `Could we discuss the role, timings, and other details?\n\n` +
    `Looking forward to hearing from you!\n` +
    `📞 ${lead.mobile}\n\n` +
    `— ${lead.name}, ${lead.gymName} (via Gym Desk Pro)`,
  );
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

export function TrainerDetailPanel({ trainer, onClose }: TrainerDetailPanelProps) {
  const navigate = useNavigate();
  const totalExp = trainer.totalYearsExperience ?? 0;
  const ptYears = trainer.ptExperienceYears ?? 0;
  const ptMonths = trainer.ptExperienceMonths ?? 0;

  const [gymOwnerLead, setGymOwnerLead] = useState<GymOwnerLead | null>(null);

  // Check if gym owner is already authenticated (from localStorage)
  useEffect(() => {
    const savedEmail = gymOwnerLeadService.getSavedEmail();
    if (savedEmail) {
      gymOwnerLeadService.checkSession(savedEmail).then((session) => {
        if (session.isVerified && session.isRegistered && session.lead) {
          setGymOwnerLead(session.lead);
        }
      }).catch(() => { /* ignore */ });
    }
  }, []);

  const handleContactClick = useCallback(() => {
    if (!gymOwnerLead) {
      navigate('/hire-trainer/login?from=trainer');
      return;
    }
    openWhatsApp(trainer, gymOwnerLead);
  }, [gymOwnerLead, trainer, navigate]);



  function fmtExp(years: number, months?: number): string {
    const parts: string[] = [];
    if (years > 0) parts.push(`${years} Year${years !== 1 ? 's' : ''}`);
    if (months && months > 0) parts.push(`${months} Month${months !== 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' ') : 'Fresher';
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent background scroll on mobile
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                {trainer.fullName
                  ? trainer.fullName.charAt(0).toUpperCase()
                  : <User className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold">{trainer.fullName || 'Unnamed Trainer'}</h2>
                {trainer.city && (
                  <p className="text-emerald-100 text-sm flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {trainer.city}{trainer.state ? `, ${trainer.state}` : ''}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap gap-2">
            {trainer.role && (
              <Badge className="bg-white/20 text-white border-white/30 text-xs">
                {roleLabels[trainer.role] ?? trainer.role}
              </Badge>
            )}
            {trainer.specialization && (
              <Badge className="bg-white/20 text-white border-white/30 text-xs">
                {trainer.specialization}
              </Badge>
            )}
            {trainer.gender && (
              <Badge className="bg-white/20 text-white border-white/30 text-xs">
                {trainer.gender}
              </Badge>
            )}
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Key Highlights */}
          <div className="grid grid-cols-2 gap-3">
            <HighlightCard
              icon={<Briefcase className="w-4 h-4 text-emerald-600" />}
              label="Total Experience"
              value={fmtExp(totalExp)}
            />
            <HighlightCard
              icon={<IndianRupee className="w-4 h-4 text-emerald-600" />}
              label="Expected Salary"
              value={
                trainer.expectedSalary != null
                  ? `₹${Number(trainer.expectedSalary).toLocaleString('en-IN')}/mo`
                  : 'Not specified'
              }
            />
            <HighlightCard
              icon={<Clock className="w-4 h-4 text-emerald-600" />}
              label="Can Join"
              value={trainer.howSoonCanJoin || 'Not specified'}
            />
            <HighlightCard
              icon={<CalendarDays className="w-4 h-4 text-emerald-600" />}
              label="Applied"
              value={new Date(trainer.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            />
          </div>

          {/* PT Experience */}
          {(ptYears > 0 || ptMonths > 0) && (
            <DetailSection title="Personal Training Experience">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Dumbbell className="w-4 h-4 text-emerald-500" />
                <span>{fmtExp(ptYears, ptMonths)} of personal training experience</span>
              </div>
            </DetailSection>
          )}

          {/* Profile Summary */}
          <DetailSection title="Profile Summary">
            <div className="space-y-3">
              <InfoRow label="Full Name" value={trainer.fullName} />
              <InfoRow label="Location" value={[trainer.city, trainer.state].filter(Boolean).join(', ')} />
              <InfoRow label="Job Type" value={trainer.role ? (roleLabels[trainer.role] ?? trainer.role) : null} />
              <InfoRow label="Specialization" value={trainer.specialization} />
              <InfoRow label="Gender" value={trainer.gender} />
              <InfoRow
                label="Total Experience"
                value={fmtExp(totalExp)}
              />
              {(ptYears > 0 || ptMonths > 0) && (
                <InfoRow
                  label="PT Experience"
                  value={fmtExp(ptYears, ptMonths)}
                />
              )}
              <InfoRow
                label="Expected Salary"
                value={
                  trainer.expectedSalary != null
                    ? `₹${Number(trainer.expectedSalary).toLocaleString('en-IN')} per month`
                    : null
                }
              />
              <InfoRow label="Availability" value={trainer.howSoonCanJoin} />
            </div>
          </DetailSection>
        </div>

        {/* Footer CTA */}
        <div className="border-t px-6 py-4 bg-gray-50 shrink-0">
          {gymOwnerLead && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                {gymOwnerLead.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{gymOwnerLead.name}</p>
                <p className="text-xs text-gray-500 truncate">{gymOwnerLead.gymName}</p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-[#25D366] hover:bg-[#1ebe57] text-white gap-2"
              onClick={handleContactClick}
            >
              <WhatsAppFilledIcon size={18} />
              {gymOwnerLead ? 'Contact via WhatsApp' : 'Login to Contact'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            {gymOwnerLead
              ? 'Message will be sent with your gym details'
              : 'Verify your email to contact trainers'}
          </p>
        </div>
      </div>

    </>
  );
}

function HighlightCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
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

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start text-sm">
      <span className="w-36 shrink-0 text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
