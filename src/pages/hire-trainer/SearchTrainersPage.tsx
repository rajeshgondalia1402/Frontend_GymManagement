import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Filter,
  ArrowUpDown,
  Users,
  LogOut,
  Building2,
  User,
} from 'lucide-react';
import { hireTrainerService } from '@/services/hireTrainer.service';
import { gymOwnerLeadService } from '@/services/gymOwnerLead.service';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrainerListCard } from './components/TrainerListCard';
import { TrainerDetailPanel } from './components/TrainerDetailPanel';
import { SearchableMultiSelect, ChipMultiSelect } from './components/SearchableMultiSelect';
import {
  INDIAN_STATES,
  CITIES_BY_STATE,
  HIRE_TRAINER_ROLES,
  GENDER_OPTIONS,
  HOW_SOON_OPTIONS,
} from '@/data/indianStates';
import { useDebounce } from '@/hooks/use-debounce';
import type { HireTrainerSearchParams, HireTrainerSearchResult } from '@/types';

interface LoggedInUser {
  userType: 'gym_owner' | 'trainer';
  name: string;
  detail: string;
  email: string;
}

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest First' },
  { value: 'expectedSalary', label: 'Salary' },
  { value: 'totalYearsExperience', label: 'Experience' },
];

const NONE_VALUE = '__none__';

/* Multi-select state — arrays of selected values */
interface MultiFilters {
  cities: string[];
  roles: string[];
  genders: string[];
  availability: string[];
}

export function SearchTrainersPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<HireTrainerSearchResult | null>(null);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [multiFilters, setMultiFilters] = useState<MultiFilters>({
    cities: [],
    roles: [],
    genders: [],
    availability: [],
  });

  const [filters, setFilters] = useState<HireTrainerSearchParams>({
    page: 1,
    limit: 15,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Auth gate: redirect to login if not authenticated
  useEffect(() => {
    const savedMobile = gymOwnerLeadService.getSavedMobile();
    const savedEmail = gymOwnerLeadService.getSavedEmail();
    if (!savedMobile || !savedEmail) {
      navigate('/hire-trainer/login', { replace: true });
      return;
    }
    gymOwnerLeadService.checkSession(savedEmail).then((session) => {
      if (session.isVerified && session.isRegistered) {
        if (session.userType === 'gym_owner' && session.lead) {
          setLoggedInUser({
            userType: 'gym_owner',
            name: session.lead.name,
            detail: session.lead.gymName,
            email: session.lead.email,
          });
          setAuthChecked(true);
        } else if (session.userType === 'trainer' && session.trainer) {
          const roleLabel = session.trainer.role
            ? session.trainer.role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
            : '';
          setLoggedInUser({
            userType: 'trainer',
            name: session.trainer.fullName || 'Trainer',
            detail: [roleLabel, session.trainer.city].filter(Boolean).join(' · '),
            email: session.trainer.email,
          });
          setAuthChecked(true);
        } else {
          gymOwnerLeadService.clearMobile();
          gymOwnerLeadService.clearEmail();
          gymOwnerLeadService.clearUserType();
          navigate('/hire-trainer/login', { replace: true });
        }
      } else {
        gymOwnerLeadService.clearMobile();
        gymOwnerLeadService.clearEmail();
        gymOwnerLeadService.clearUserType();
        navigate('/hire-trainer/login', { replace: true });
      }
    }).catch(() => {
      navigate('/hire-trainer/login', { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch || undefined, page: 1 }));
  }, [debouncedSearch]);

  // Sync multi-select to query params (comma-separated)
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      city: multiFilters.cities.length > 0 ? multiFilters.cities.join(',') : undefined,
      role: multiFilters.roles.length > 0 ? multiFilters.roles.join(',') : undefined,
      gender: multiFilters.genders.length > 0 ? multiFilters.genders.join(',') : undefined,
      availability: multiFilters.availability.length > 0 ? multiFilters.availability.join(',') : undefined,
      page: 1,
    }));
  }, [multiFilters]);

  const params: HireTrainerSearchParams = { ...filters };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['hire-trainers-search', params],
    queryFn: () => hireTrainerService.searchTrainers(params),
    placeholderData: (prev) => prev,
  });

  const trainers = Array.isArray(data?.data) ? data.data : [];
  const pagination = data?.pagination;

  const updateFilter = useCallback(
    (key: keyof HireTrainerSearchParams, value: string | number | undefined) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value === '' || value === NONE_VALUE ? undefined : value,
        page: 1,
      }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setMultiFilters({ cities: [], roles: [], genders: [], availability: [] });
    setFilters({ page: 1, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' });
  }, []);

  const activeFilterCount =
    multiFilters.cities.length +
    multiFilters.roles.length +
    multiFilters.genders.length +
    multiFilters.availability.length +
    [
      filters.experienceMin,
      filters.experienceMax,
      filters.salaryMin,
      filters.salaryMax,
      filters.specialization,
    ].filter((v) => v !== undefined && v !== '').length;

  const stateCities = INDIAN_STATES.flatMap((s) => CITIES_BY_STATE[s.value] ?? []);
  const allCities = Array.from(
    new Map(stateCities.map((c) => [c.value, c])).values(),
  ).sort((a, b) => a.label.localeCompare(b.label));

  // --- Sidebar Filter Content ---
  const filterContent = (
    <div className="space-y-5">
      {/* Location — searchable multi-select */}
      <FilterSection title="Location" count={multiFilters.cities.length}>
        <SearchableMultiSelect
          options={allCities}
          selected={multiFilters.cities}
          onChange={(cities) => setMultiFilters((prev) => ({ ...prev, cities }))}
          placeholder="Select cities..."
          searchPlaceholder="Search cities..."
        />
      </FilterSection>

      {/* Job Type — chip multi-select */}
      <FilterSection title="Job Type" count={multiFilters.roles.length}>
        <ChipMultiSelect
          options={HIRE_TRAINER_ROLES}
          selected={multiFilters.roles}
          onChange={(roles) => setMultiFilters((prev) => ({ ...prev, roles }))}
        />
      </FilterSection>

      {/* Experience Range */}
      <FilterSection title="Experience (years)">
        <div className="flex gap-2">
          <Input type="number" placeholder="Min" min={0} max={50} value={filters.experienceMin ?? ''} onChange={(e) => updateFilter('experienceMin', e.target.value ? Number(e.target.value) : undefined)} className="h-9 text-sm" />
          <span className="text-gray-400 self-center text-sm">–</span>
          <Input type="number" placeholder="Max" min={0} max={50} value={filters.experienceMax ?? ''} onChange={(e) => updateFilter('experienceMax', e.target.value ? Number(e.target.value) : undefined)} className="h-9 text-sm" />
        </div>
      </FilterSection>

      {/* Salary Range */}
      <FilterSection title="Expected Salary (₹/mo)">
        <div className="flex gap-2">
          <Input type="number" placeholder="Min" min={0} value={filters.salaryMin ?? ''} onChange={(e) => updateFilter('salaryMin', e.target.value ? Number(e.target.value) : undefined)} className="h-9 text-sm" />
          <span className="text-gray-400 self-center text-sm">–</span>
          <Input type="number" placeholder="Max" min={0} value={filters.salaryMax ?? ''} onChange={(e) => updateFilter('salaryMax', e.target.value ? Number(e.target.value) : undefined)} className="h-9 text-sm" />
        </div>
      </FilterSection>

      {/* Gender — chip multi-select */}
      <FilterSection title="Gender" count={multiFilters.genders.length}>
        <ChipMultiSelect
          options={GENDER_OPTIONS}
          selected={multiFilters.genders}
          onChange={(genders) => setMultiFilters((prev) => ({ ...prev, genders }))}
        />
      </FilterSection>

      {/* Availability — chip multi-select */}
      <FilterSection title="Availability" count={multiFilters.availability.length}>
        <ChipMultiSelect
          options={HOW_SOON_OPTIONS}
          selected={multiFilters.availability}
          onChange={(availability) => setMultiFilters((prev) => ({ ...prev, availability }))}
        />
      </FilterSection>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5">
          <X className="w-3.5 h-3.5" /> Clear all filters
        </Button>
      )}
    </div>
  );

  const handleLogout = useCallback(() => {
    gymOwnerLeadService.clearMobile();
    gymOwnerLeadService.clearEmail();
    gymOwnerLeadService.clearUserType();
    navigate('/hire-trainer/login', { replace: true });
  }, [navigate]);

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Logged-in user bar */}
      {loggedInUser && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                loggedInUser.userType === 'trainer' ? 'bg-blue-100' : 'bg-emerald-100'
              }`}>
                {loggedInUser.userType === 'trainer' ? (
                  <Users className="w-4 h-4 text-blue-700" />
                ) : (
                  <User className="w-4 h-4 text-emerald-700" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 truncate">{loggedInUser.name}</span>
                  {loggedInUser.detail && (
                    <>
                      <span className="hidden sm:inline text-gray-300">|</span>
                      <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                        {loggedInUser.userType === 'trainer' ? (
                          <Users className="w-3 h-3" />
                        ) : (
                          <Building2 className="w-3 h-3" />
                        )}
                        {loggedInUser.detail}
                      </span>
                    </>
                  )}
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                    loggedInUser.userType === 'trainer'
                      ? 'border-blue-200 text-blue-600'
                      : 'border-emerald-200 text-emerald-600'
                  }`}>
                    {loggedInUser.userType === 'trainer' ? 'Trainer' : 'Gym Owner'}
                  </Badge>
                </div>
                {loggedInUser.detail && (
                  <p className="text-xs text-gray-400 truncate sm:hidden">{loggedInUser.detail}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Search Bar */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-700 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              Find & Hire Trainers
            </h1>
            <p className="text-emerald-100 mt-2 text-sm sm:text-base max-w-xl mx-auto">
              Discover qualified fitness trainers ready to join your gym
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="flex bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, city, specialization..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-12 sm:h-14 pl-12 pr-4 text-sm sm:text-base outline-none border-0 bg-transparent"
                />
              </div>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 sm:px-8 font-medium text-sm sm:text-base transition-colors shrink-0">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Results bar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">
                {pagination ? `${pagination.total} Trainer${pagination.total !== 1 ? 's' : ''} found` : 'Searching...'}
              </span>
            </div>
            {isFetching && !isLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
            {activeFilterCount > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <Select value={filters.sortBy ?? 'createdAt'} onValueChange={(v) => updateFilter('sortBy', v)}>
                <SelectTrigger className="h-8 w-36 text-xs border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => setFilters((prev) => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))} className="h-8 px-2 text-xs text-gray-500">
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
            <Button variant="outline" size="sm" className="lg:hidden gap-1.5 h-8" onClick={() => setShowMobileFilters(!showMobileFilters)}>
              <Filter className="w-3.5 h-3.5" /> Filters
              {activeFilterCount > 0 && <span className="bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>}
            </Button>
          </div>
        </div>

        {/* Mobile Filters */}
        {showMobileFilters && (
          <div className="lg:hidden mb-4 bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowMobileFilters(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            {filterContent}
          </div>
        )}

        {/* Two-Column Layout */}
        <div className="flex gap-6">
          {/* Left Sidebar — desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white border rounded-xl p-5 sticky top-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Filters</h2>
              </div>
              {filterContent}
            </div>
          </aside>

          {/* Right — Results */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
                <p className="text-sm text-gray-500">Searching trainers...</p>
              </div>
            ) : trainers.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900">No trainers found</p>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria or filters</p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 gap-1.5">
                    <X className="w-3.5 h-3.5" /> Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {trainers.map((trainer) => (
                  <TrainerListCard
                    key={trainer.id}
                    trainer={trainer}
                    isSelected={selectedTrainer?.id === trainer.id}
                    onClick={() => setSelectedTrainer(trainer)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 bg-white border rounded-xl px-4 py-3">
                <span className="text-xs text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))} className="h-8 text-xs">
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
                    const page = start + i;
                    if (page > pagination.totalPages) return null;
                    return (
                      <Button key={page} variant={page === pagination.page ? 'default' : 'outline'} size="sm" onClick={() => setFilters((prev) => ({ ...prev, page }))} className={`h-8 w-8 text-xs p-0 ${page === pagination.page ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}>
                        {page}
                      </Button>
                    );
                  })}
                  <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))} className="h-8 text-xs">
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trainer Detail Slide-over */}
      {selectedTrainer && (
        <TrainerDetailPanel trainer={selectedTrainer} onClose={() => setSelectedTrainer(null)} />
      )}
    </PublicLayout>
  );
}

function FilterSection({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</label>
        {count != null && count > 0 && (
          <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 font-medium">{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}
