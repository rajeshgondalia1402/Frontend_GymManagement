import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CreditCard,
  Calendar,
  Building2,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Dumbbell,
  IndianRupee,
  Receipt,
  History,
  ChevronDown,
  ChevronUp,
  Wallet,
  CircleDot,
  Heart,
  Droplets,
  Briefcase,
  Shield,
  FileText,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { memberService } from '@/services/member.service';
import type {
  MemberCompleteDetails,
  MemberCompletePaymentHistoryItem,
  MemberCompleteRenewalHistoryItem,
} from '@/types';
import { BACKEND_BASE_URL } from '@/services/api';

// ─── Helpers ─────────────────────────────────────────────
function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

function formatCurrency(amount?: number | null) {
  if (amount == null) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
}

function paymentStatusColor(status?: string) {
  switch (status) {
    case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
    case 'PARTIAL': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'PENDING': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function paymentModeBadge(mode?: string) {
  const colors: Record<string, string> = {
    UPI: 'bg-purple-100 text-purple-700',
    CASH: 'bg-green-100 text-green-700',
    CARD: 'bg-blue-100 text-blue-700',
    'NET_BANKING': 'bg-indigo-100 text-indigo-700',
    CHEQUE: 'bg-orange-100 text-orange-700',
    'BANK_TRANSFER': 'bg-teal-100 text-teal-700',
  };
  return colors[mode || ''] || 'bg-gray-100 text-gray-600';
}

// ─── Info Row Component ────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
  valueClass,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 py-2.5 border-b border-dashed last:border-0">
      <span className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-shrink-0">
        {icon}
        {label}
      </span>
      <span className={`text-xs sm:text-sm font-medium text-right max-w-[55%] break-words ${valueClass || ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

// ─── Section: Membership Status Banner ────────────────────
function MembershipStatusBanner({ membership }: { membership: MemberCompleteDetails['membership'] }) {
  const status = membership.expiryStatus || membership.status;
  const isExpired = status === 'EXPIRED';
  const isExpiring = status === 'EXPIRING_SOON';

  const config = isExpired
    ? { bg: 'bg-gradient-to-r from-red-50 to-red-100 border-red-300', icon: <AlertTriangle className="h-7 w-7 sm:h-8 sm:w-8 text-red-500" />, title: 'Membership Expired', titleColor: 'text-red-800', desc: `Expired ${membership.daysSinceExpiry} day(s) ago`, descColor: 'text-red-600' }
    : isExpiring
    ? { bg: 'bg-gradient-to-r from-yellow-50 to-amber-100 border-yellow-300', icon: <Clock className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-500" />, title: 'Expiring Soon', titleColor: 'text-yellow-800', desc: `${membership.daysRemaining} day(s) remaining`, descColor: 'text-yellow-700' }
    : { bg: 'bg-gradient-to-r from-green-50 to-emerald-100 border-green-300', icon: <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-green-500" />, title: 'Membership Active', titleColor: 'text-green-800', desc: `${membership.daysRemaining} day(s) remaining`, descColor: 'text-green-700' };

  return (
    <Card className={`border-2 ${config.bg}`}>
      <CardContent className="py-4 sm:py-5 px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {config.icon}
          <div className="flex-1 min-w-0">
            <h2 className={`text-lg sm:text-xl font-bold ${config.titleColor}`}>{config.title}</h2>
            <p className={`text-sm ${config.descColor}`}>{config.desc}</p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs text-muted-foreground">Valid until</p>
            <p className="font-semibold text-sm">{formatDate(membership.endDate)}</p>
          </div>
        </div>
        <div className="sm:hidden mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(membership.startDate)} — {formatDate(membership.endDate)}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section: Personal Info ───────────────────────────────
function PersonalInfoCard({ info, photoBase }: { info: MemberCompleteDetails['memberInfo']; photoBase: string }) {
  const photoUrl = info.memberPhoto ? `${photoBase}${info.memberPhoto}` : null;

  return (
    <Card>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {/* Photo + Key info */}
        <div className="flex items-start gap-4 mb-4 pb-4 border-b">
          <div className="flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={info.name}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl sm:text-2xl">
                {info.name?.charAt(0)?.toUpperCase() || 'M'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base sm:text-lg truncate">{info.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">ID: {info.memberId}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge variant={info.isActive ? 'success' : 'destructive'} className="text-xs">
                {info.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {info.memberType?.replace(/_/g, ' ').toLowerCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="space-y-0">
          {info.email && <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={info.email} />}
          {info.phone && <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={info.phone} />}
          {info.altContactNo && <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Alt. Phone" value={info.altContactNo} />}
          {info.dateOfBirth && <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Date of Birth" value={formatDate(info.dateOfBirth)} />}
          {info.gender && <InfoRow icon={<CircleDot className="h-3.5 w-3.5" />} label="Gender" value={info.gender} />}
          {info.bloodGroup && <InfoRow icon={<Droplets className="h-3.5 w-3.5" />} label="Blood Group" value={<Badge variant="outline" className="text-xs">{info.bloodGroup}</Badge>} />}
          {info.address && <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={info.address} />}
          {info.occupation && <InfoRow icon={<Briefcase className="h-3.5 w-3.5" />} label="Occupation" value={info.occupation} />}
          {info.maritalStatus && <InfoRow icon={<Heart className="h-3.5 w-3.5" />} label="Marital Status" value={info.maritalStatus} />}
          {info.emergencyContact && <InfoRow icon={<Shield className="h-3.5 w-3.5" />} label="Emergency Contact" value={info.emergencyContact} />}
          {info.healthNotes && <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Health Notes" value={info.healthNotes} />}
          {info.anniversaryDate && <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Anniversary" value={formatDate(info.anniversaryDate)} />}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section: Gym & Trainer ───────────────────────────────
function GymTrainerCard({ gym, trainer }: { gym: MemberCompleteDetails['gym']; trainer: MemberCompleteDetails['trainer'] }) {
  const gymAddress = [gym.address1, gym.address2, gym.city].filter(Boolean).join(', ');

  return (
    <Card>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Gym & Trainer
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 space-y-4">
        {/* Gym */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Gym</p>
          <div className="space-y-0">
            <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Name" value={gym.name} />
            {gymAddress && <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={gymAddress} />}
            {gym.mobileNo && <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={gym.mobileNo} />}
            {gym.email && <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={gym.email} />}
          </div>
        </div>

        {/* Trainer */}
        <div className="pt-2 border-t">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assigned Trainer</p>
          {trainer ? (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {trainer.name?.charAt(0)?.toUpperCase() || 'T'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{trainer.name}</p>
                {trainer.specialization && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" />
                    {trainer.specialization}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic py-2">No trainer assigned</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section: Membership & Package ────────────────────────
function MembershipDetailsCard({ membership, currentPackage }: { membership: MemberCompleteDetails['membership']; currentPackage: MemberCompleteDetails['currentPackage'] }) {
  return (
    <Card>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Membership & Package
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 space-y-4">
        {/* Membership */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Membership Period</p>
          <div className="space-y-0">
            <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Start Date" value={formatDate(membership.startDate)} />
            <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="End Date" value={formatDate(membership.endDate)} />
            <InfoRow label="Status" value={
              <Badge className={`text-xs ${
                membership.expiryStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                membership.expiryStatus === 'EXPIRING_SOON' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {membership.expiryStatus?.replace(/_/g, ' ') || membership.status}
              </Badge>
            } />
            <InfoRow
              label="Days Remaining"
              value={membership.isExpired ? `Expired ${membership.daysSinceExpiry}d ago` : `${membership.daysRemaining} days`}
              valueClass={membership.isExpired ? 'text-red-600' : membership.daysRemaining <= 7 ? 'text-yellow-600' : 'text-green-600'}
            />
          </div>
        </div>

        {/* Package */}
        {currentPackage && (
          <div className="pt-2 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Current Package</p>
            <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{currentPackage.packageName}</span>
                </div>
                <Badge variant="outline" className="text-xs">{currentPackage.packageType}</Badge>
              </div>
              {currentPackage.description && (
                <p className="text-xs text-muted-foreground mt-1">{currentPackage.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{currentPackage.durationMonths} month(s)</span>
                <span className="font-semibold text-foreground">{formatCurrency(currentPackage.packageFees)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Section: Fee Breakdown ───────────────────────────────
function FeeBreakdownCard({ regularFees, ptFees }: { regularFees: MemberCompleteDetails['regularFees']; ptFees: MemberCompleteDetails['ptFees'] }) {
  if (!regularFees && !ptFees) return null;

  function FeeTable({ title, fees, accent }: { title: string; fees: NonNullable<MemberCompleteDetails['regularFees']>; accent: string }) {
    return (
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${accent}`}>{title}</p>
        <div className="space-y-0">
          <InfoRow label="Package Fees" value={formatCurrency(fees.packageFees)} />
          {fees.maxDiscount > 0 && <InfoRow label="Max Discount" value={<span className="text-green-600">- {formatCurrency(fees.maxDiscount)}</span>} />}
          {fees.maxDiscount > 0 && <InfoRow label="After Discount" value={formatCurrency(fees.afterDiscount)} />}
          {fees.extraDiscount > 0 && <InfoRow label="Extra Discount" value={<span className="text-green-600">- {formatCurrency(fees.extraDiscount)}</span>} />}
          <div className="flex items-start justify-between gap-2 py-2.5 border-t-2 border-primary/20">
            <span className="text-xs sm:text-sm font-semibold">Final Amount</span>
            <span className="text-sm sm:text-base font-bold text-primary">{formatCurrency(fees.finalFees)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Fee Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 space-y-4">
        {regularFees && <FeeTable title="Regular Membership" fees={regularFees} accent="text-blue-600" />}
        {ptFees && (
          <div className={regularFees ? 'pt-2 border-t' : ''}>
            <FeeTable title={ptFees.packageName || 'PT Membership'} fees={ptFees} accent="text-purple-600" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Section: Payment Summary ─────────────────────────────
function PaymentSummaryCard({ summary }: { summary: MemberCompleteDetails['paymentSummary'] }) {
  const grand = summary.grandTotal;

  return (
    <Card>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {/* Grand total cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-xs text-blue-600 font-medium">Total Fees</p>
            <p className="text-sm sm:text-lg font-bold text-blue-800 mt-0.5">{formatCurrency(grand.totalFees)}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <p className="text-xs text-green-600 font-medium">Total Paid</p>
            <p className="text-sm sm:text-lg font-bold text-green-800 mt-0.5">{formatCurrency(grand.totalPaid)}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-center">
            <p className="text-xs text-red-600 font-medium">Pending</p>
            <p className="text-sm sm:text-lg font-bold text-red-800 mt-0.5">{formatCurrency(grand.totalPending)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-gray-600 font-medium">Status</p>
            <Badge className={`mt-1 text-xs ${paymentStatusColor(grand.overallStatus)}`}>
              {grand.overallStatus}
            </Badge>
          </div>
        </div>

        {/* Regular & PT breakdown */}
        <div className="space-y-2">
          {summary.regular && (
            <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="font-medium">Regular</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-green-600">{formatCurrency(summary.regular.totalPaid)}</span>
                <span className="text-muted-foreground">/</span>
                <span>{formatCurrency(summary.regular.finalFees)}</span>
                <Badge className={`text-[10px] ${paymentStatusColor(summary.regular.paymentStatus)}`}>
                  {summary.regular.paymentStatus}
                </Badge>
              </div>
            </div>
          )}
          {summary.pt && (
            <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="font-medium">PT</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-green-600">{formatCurrency(summary.pt.totalPaid)}</span>
                <span className="text-muted-foreground">/</span>
                <span>{formatCurrency(summary.pt.finalFees)}</span>
                <Badge className={`text-[10px] ${paymentStatusColor(summary.pt.paymentStatus)}`}>
                  {summary.pt.paymentStatus}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section: Payment History ─────────────────────────────
function PaymentHistoryCard({ payments }: { payments: MemberCompletePaymentHistoryItem[] }) {
  const [showAll, setShowAll] = useState(false);
  if (!payments || payments.length === 0) return null;

  const displayed = showAll ? payments : payments.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Payment History
          </CardTitle>
          <Badge variant="outline" className="text-xs">{payments.length} payment(s)</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {/* Desktop table (hidden on mobile) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Receipt</th>
                <th className="pb-2 pr-3 font-medium">Date</th>
                <th className="pb-2 pr-3 font-medium">For</th>
                <th className="pb-2 pr-3 font-medium text-right">Amount</th>
                <th className="pb-2 pr-3 font-medium">Mode</th>
                <th className="pb-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-2.5 pr-3 font-mono text-xs">{p.receiptNo}</td>
                  <td className="py-2.5 pr-3 text-xs">{formatDate(p.paymentDate)}</td>
                  <td className="py-2.5 pr-3">
                    <Badge variant="outline" className={`text-[10px] ${p.paymentFor === 'PT' ? 'border-purple-300 text-purple-700' : 'border-blue-300 text-blue-700'}`}>
                      {p.paymentFor}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-3 text-right font-semibold text-green-600">{formatCurrency(p.paidAmount)}</td>
                  <td className="py-2.5 pr-3">
                    <Badge className={`text-[10px] ${paymentModeBadge(p.paymentMode)}`}>
                      {p.paymentMode?.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-xs text-muted-foreground truncate max-w-[120px]">{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-2">
          {displayed.map((p) => (
            <div key={p.id} className="p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs text-muted-foreground">{p.receiptNo}</span>
                <Badge variant="outline" className={`text-[10px] ${p.paymentFor === 'PT' ? 'border-purple-300 text-purple-700' : 'border-blue-300 text-blue-700'}`}>
                  {p.paymentFor}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-green-600">{formatCurrency(p.paidAmount)}</span>
                <Badge className={`text-[10px] ${paymentModeBadge(p.paymentMode)}`}>
                  {p.paymentMode?.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(p.paymentDate)}
                {p.notes && <span className="truncate">• {p.notes}</span>}
              </div>
            </div>
          ))}
        </div>

        {payments.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-xs"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
            {showAll ? 'Show Less' : `Show All (${payments.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Section: Renewal History ─────────────────────────────
function RenewalHistoryCard({ renewals }: { renewals: MemberCompleteRenewalHistoryItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!renewals || renewals.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Renewal History
          </CardTitle>
          <Badge variant="outline" className="text-xs">{renewals.length} renewal(s)</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 space-y-2">
        {renewals.map((r) => (
          <div key={r.id} className="border rounded-lg overflow-hidden">
            {/* Renewal header */}
            <button
              className="w-full flex items-center justify-between gap-2 p-3 hover:bg-muted/30 transition-colors text-left"
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{r.renewalNumber}</span>
                  <Badge variant="outline" className="text-[10px]">{r.renewalType}</Badge>
                  <Badge className={`text-[10px] ${paymentStatusColor(r.payment.paymentStatus)}`}>
                    {r.payment.paymentStatus}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{r.package.packageName}</span>
                  <span>•</span>
                  <span>{formatDate(r.renewalDate)}</span>
                  <span>•</span>
                  <span className="font-semibold text-foreground">{formatCurrency(r.fees.finalFees)}</span>
                </div>
              </div>
              {expanded === r.id ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </button>

            {/* Expanded details */}
            {expanded === r.id && (
              <div className="border-t px-3 pb-3 pt-2 bg-muted/20 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Membership Period</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-background rounded border">
                      <p className="text-muted-foreground">Previous</p>
                      <p className="font-medium mt-0.5">{formatDate(r.previousMembershipStart)} — {formatDate(r.previousMembershipEnd)}</p>
                    </div>
                    <div className="p-2 bg-background rounded border">
                      <p className="text-muted-foreground">New</p>
                      <p className="font-medium mt-0.5">{formatDate(r.newMembershipStart)} — {formatDate(r.newMembershipEnd)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Fee Details</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">Package Fee</span><span>{formatCurrency(r.fees.packageFees)}</span></div>
                      {r.fees.maxDiscount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-green-600">-{formatCurrency(r.fees.maxDiscount)}</span></div>}
                      {r.fees.extraDiscount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Extra Discount</span><span className="text-green-600">-{formatCurrency(r.fees.extraDiscount)}</span></div>}
                      <div className="flex justify-between border-t pt-1 font-semibold"><span>Final</span><span>{formatCurrency(r.fees.finalFees)}</span></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Payment</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="text-green-600">{formatCurrency(r.payment.paidAmount)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span className="text-red-600">{formatCurrency(r.payment.pendingAmount)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Mode</span>
                        <Badge className={`text-[10px] ${paymentModeBadge(r.payment.paymentMode)}`}>
                          {r.payment.paymentMode?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Section: Renewal Notice ──────────────────────────────
function RenewalNotice({ membership }: { membership: MemberCompleteDetails['membership'] }) {
  const status = membership.expiryStatus;
  if (status === 'ACTIVE' && membership.daysRemaining > 30) return null;

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="py-4 px-4 sm:px-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800 text-sm sm:text-base">
              {status === 'EXPIRED' ? 'Membership Expired' : 'Renewal Reminder'}
            </h3>
            <p className="text-xs sm:text-sm text-yellow-700 mt-1">
              {status === 'EXPIRED'
                ? 'Your membership has expired. Please contact your gym to renew and continue enjoying the facilities.'
                : 'Your membership is expiring soon. Contact your gym to renew and avoid any interruption in your fitness journey.'}
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-yellow-700">
              <Phone className="h-3 w-3" />
              Contact your gym owner for renewal options
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────
export function MembershipPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['member-complete-details'],
    queryFn: memberService.getMyCompleteDetails,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Spinner />
        <p className="text-sm text-muted-foreground">Loading your details...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Failed to load membership details. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-5 px-1 sm:px-0 pb-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
          <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary flex-shrink-0" />
          My Membership
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          Your complete membership details, fees & payment history
        </p>
      </div>

      {/* Status banner */}
      <MembershipStatusBanner membership={data.membership} />

      {/* Renewal notice */}
      <RenewalNotice membership={data.membership} />

      {/* Two-column layout for info cards */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        <PersonalInfoCard info={data.memberInfo} photoBase={BACKEND_BASE_URL} />
        <div className="space-y-4 sm:space-y-5">
          <GymTrainerCard gym={data.gym} trainer={data.trainer} />
          <MembershipDetailsCard membership={data.membership} currentPackage={data.currentPackage} />
        </div>
      </div>

      {/* Fee breakdown */}
      <FeeBreakdownCard regularFees={data.regularFees} ptFees={data.ptFees} />

      {/* Payment summary */}
      <PaymentSummaryCard summary={data.paymentSummary} />

      {/* Payment history */}
      <PaymentHistoryCard payments={data.paymentHistory} />

      {/* Renewal history */}
      <RenewalHistoryCard renewals={data.renewalHistory} />
    </div>
  );
}
