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
  Plus,
  Briefcase,
  Pencil,
  MapPin,
} from 'lucide-react';
import { hireTrainerService } from '@/services/hireTrainer.service';
import { trainerVacancyService } from '@/services/trainerVacancy.service';
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
import { VacancyListCard } from './components/VacancyListCard';
import { VacancyDetailPanel } from './components/VacancyDetailPanel';
import { PostVacancyDialog } from './components/PostVacancyDialog';
import { EditTrainerProfileDialog } from './components/EditTrainerProfileDialog';
import { SearchableMultiSelect, ChipMultiSelect } from './components/SearchableMultiSelect';
import {
  INDIAN_STATES,
  CITIES_BY_STATE,
  HIRE_TRAINER_ROLES,
  GENDER_OPTIONS,
  HOW_SOON_OPTIONS,
} from '@/data/indianStates';
import { useDebounce } from '@/hooks/use-debounce';
import type { HireTrainerSearchParams, HireTrainerSearchResult, TrainerVacancy, TrainerVacancySearchParams } from '@/types';

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
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<HireTrainerSearchResult | null>(null);
  const [activeTab, setActiveTab] = useState<'trainers' | 'vacancies'>('trainers');
  const [selectedVacancy, setSelectedVacancy] = useState<TrainerVacancy | null>(null);
  const [showPostVacancy, setShowPostVacancy] = useState(false);
  const [editVacancy, setEditVacancy] = useState<TrainerVacancy | null>(null);
  const [showEditTrainer, setShowEditTrainer] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [multiFilters, setMultiFilters] = useState<MultiFilters>({
    cities: [],
    roles: [],
    genders: [],
    availability: [],
  });

  /* Vacancy-specific multi-select filters */
  interface VacancyMultiFilters {
    cities: string[];
    roles: string[];
    genders: string[];
    specializations: string[];
  }
  const [vacancyMultiFilters, setVacancyMultiFilters] = useState<VacancyMultiFilters>({
    cities: [],
    roles: [],
    genders: [],
    specializations: [],
  });
  const [showMobileVacancyFilters, setShowMobileVacancyFilters] = useState(false);

  const [filters, setFilters] = useState<HireTrainerSearchParams>({
    page: 1,
    limit: 15,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Silently check if user is already logged in (non-blocking)
  useEffect(() => {
    const savedEmail = gymOwnerLeadService.getSavedEmail();
    if (!savedEmail) return;
    gymOwnerLeadService.checkSession(savedEmail).then((session) => {
      if (session.isVerified && session.isRegistered) {
        if (session.userType === 'gym_owner' && session.lead) {
          setLoggedInUser({
            userType: 'gym_owner',
            name: session.lead.name,
            detail: session.lead.gymName,
            email: session.lead.email,
          });
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
        }
      }
    }).catch(() => { /* ignore — page works without login */ });
  }, []);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch || undefined, page: 1 }));
    setVacancyFilters((prev) => ({ ...prev, search: debouncedSearch || undefined, page: 1 }));
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

  // Sync vacancy multi-filters to vacancy query params
  useEffect(() => {
    setVacancyFilters((prev) => ({
      ...prev,
      city: vacancyMultiFilters.cities.length > 0 ? vacancyMultiFilters.cities.join(',') : undefined,
      role: vacancyMultiFilters.roles.length > 0 ? vacancyMultiFilters.roles.join(',') : undefined,
      gender: vacancyMultiFilters.genders.length > 0 ? vacancyMultiFilters.genders.join(',') : undefined,
      specialization: vacancyMultiFilters.specializations.length > 0 ? vacancyMultiFilters.specializations.join(',') : undefined,
      page: 1,
    }));
  }, [vacancyMultiFilters]);

  const params: HireTrainerSearchParams = { ...filters };

  const isTrainerOwnProfile = loggedInUser?.userType === 'trainer';

  // Public search — for non-trainer users
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['hire-trainers-search', params],
    queryFn: () => hireTrainerService.searchTrainers(params),
    placeholderData: (prev) => prev,
    enabled: activeTab === 'trainers' && !isTrainerOwnProfile,
  });

  // Trainer's own profile
  const { data: myProfileData, isLoading: myProfileLoading, isFetching: myProfileFetching } = useQuery({
    queryKey: ['my-trainer-profile', loggedInUser?.email],
    queryFn: () => hireTrainerService.getMyProfile(loggedInUser!.email),
    enabled: activeTab === 'trainers' && isTrainerOwnProfile && !!loggedInUser?.email,
  });

  // Build trainer list based on user type
  const myTrainerAsSearchResult: HireTrainerSearchResult[] = myProfileData ? [{
    id: myProfileData.id,
    fullName: myProfileData.fullName,
    city: myProfileData.city,
    state: myProfileData.state,
    role: myProfileData.role,
    totalYearsExperience: myProfileData.totalYearsExperience,
    ptExperienceYears: myProfileData.ptExperienceYears,
    ptExperienceMonths: myProfileData.ptExperienceMonths,
    expectedSalary: myProfileData.expectedSalary,
    specialization: myProfileData.specialization,
    gender: myProfileData.gender,
    howSoonCanJoin: myProfileData.howSoonCanJoin,
    createdAt: myProfileData.createdAt,
  }] : [];

  const trainers = isTrainerOwnProfile
    ? myTrainerAsSearchResult
    : Array.isArray(data?.data) ? data.data : [];
  const pagination = isTrainerOwnProfile ? undefined : data?.pagination;
  const isTrainerLoading = isTrainerOwnProfile ? myProfileLoading : isLoading;
  const isTrainerFetching = isTrainerOwnProfile ? myProfileFetching : isFetching;

  // Vacancy search
  const [vacancyFilters, setVacancyFilters] = useState<TrainerVacancySearchParams>({
    page: 1,
    limit: 15,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const isGymOwnerVacancies = loggedInUser?.userType === 'gym_owner';

  // Public search — for trainers and non-logged-in users
  const { data: vacancyData, isLoading: vacancyLoading, isFetching: vacancyFetching } = useQuery({
    queryKey: ['trainer-vacancies', vacancyFilters],
    queryFn: () => trainerVacancyService.search(vacancyFilters),
    placeholderData: (prev) => prev,
    enabled: activeTab === 'vacancies' && !isGymOwnerVacancies,
  });

  // Gym owner's own vacancies
  const { data: myVacancyData, isLoading: myVacancyLoading, isFetching: myVacancyFetching } = useQuery({
    queryKey: ['my-vacancies', loggedInUser?.email],
    queryFn: () => trainerVacancyService.getMyVacancies(loggedInUser!.email),
    enabled: activeTab === 'vacancies' && isGymOwnerVacancies && !!loggedInUser?.email,
  });

  // Merge based on user type
  const rawMyVacancies = Array.isArray(myVacancyData) ? myVacancyData : [];
  const filteredMyVacancies = isGymOwnerVacancies
    ? rawMyVacancies.filter((v) => {
        const search = vacancyFilters.search?.toLowerCase();
        if (!search) return true;
        return (
          v.specialization?.toLowerCase().includes(search) ||
          v.city?.toLowerCase().includes(search) ||
          v.state?.toLowerCase().includes(search) ||
          v.description?.toLowerCase().includes(search) ||
          v.gymOwnerLead?.gymName?.toLowerCase().includes(search)
        );
      })
    : [];

  const vacancies = isGymOwnerVacancies
    ? filteredMyVacancies
    : Array.isArray(vacancyData?.data) ? vacancyData.data : [];
  const vacancyPagination = isGymOwnerVacancies ? undefined : vacancyData?.pagination;
  const isVacancyLoading = isGymOwnerVacancies ? myVacancyLoading : vacancyLoading;
  const isVacancyFetching = isGymOwnerVacancies ? myVacancyFetching : vacancyFetching;

  // Immediate search handler (bypasses debounce, applies to both tabs)
  const handleSearch = useCallback(() => {
    const searchText = searchInput.trim() || undefined;
    setFilters(prev => ({ ...prev, search: searchText, page: 1 }));
    setVacancyFilters(prev => ({ ...prev, search: searchText, page: 1 }));
  }, [searchInput]);

  // Global filter handlers — sync city & role to both tabs
  const handleGlobalCityChange = useCallback((cities: string[]) => {
    setMultiFilters(prev => ({ ...prev, cities }));
    setVacancyMultiFilters(prev => ({ ...prev, cities }));
  }, []);

  const handleGlobalRoleChange = useCallback((roles: string[]) => {
    setMultiFilters(prev => ({ ...prev, roles }));
    setVacancyMultiFilters(prev => ({ ...prev, roles }));
  }, []);

  const clearGlobalFilters = useCallback(() => {
    setSearchInput('');
    setMultiFilters({ cities: [], roles: [], genders: [], availability: [] });
    setVacancyMultiFilters({ cities: [], roles: [], genders: [], specializations: [] });
    setFilters({ page: 1, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' });
    setVacancyFilters({ page: 1, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' });
  }, []);

  const globalActiveCount = multiFilters.cities.length + multiFilters.roles.length + (searchInput.trim() ? 1 : 0);

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

  const VACANCY_SPECIALIZATION_OPTIONS = [
    'Strength Training', 'Cardio', 'Yoga', 'CrossFit', 'Pilates',
    'Zumba', 'Boxing', 'MMA', 'Nutrition', 'Weight Loss',
    'Body Building', 'Functional Training', 'Calisthenics', 'Swimming',
    'Dance Fitness', 'HIIT', 'Rehabilitation', 'Sports Training', 'Other',
  ].map((s) => ({ value: s, label: s }));

  const VACANCY_GENDER_OPTIONS = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Any', label: 'Any' },
  ];

  const updateVacancyFilter = useCallback(
    (key: keyof TrainerVacancySearchParams, value: string | number | undefined) => {
      setVacancyFilters((prev) => ({
        ...prev,
        [key]: value === '' || value === NONE_VALUE ? undefined : value,
        page: 1,
      }));
    },
    [],
  );

  const clearVacancyFilters = useCallback(() => {
    setSearchInput('');
    setMultiFilters(prev => ({ ...prev, cities: [], roles: [] }));
    setVacancyMultiFilters({ cities: [], roles: [], genders: [], specializations: [] });
    setVacancyFilters({ page: 1, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' });
  }, []);

  const vacancyActiveFilterCount =
    vacancyMultiFilters.cities.length +
    vacancyMultiFilters.roles.length +
    vacancyMultiFilters.genders.length +
    vacancyMultiFilters.specializations.length +
    [
      vacancyFilters.salaryMin,
      vacancyFilters.salaryMax,
      vacancyFilters.experienceMin,
      vacancyFilters.experienceMax,
    ].filter((v) => v !== undefined).length;

  // --- Vacancy Sidebar Filter Content ---
  const vacancyFilterContent = (
    <div className="space-y-5">
      {/* Location — searchable multi-select */}
      <FilterSection title="Location" count={vacancyMultiFilters.cities.length}>
        <SearchableMultiSelect
          options={allCities}
          selected={vacancyMultiFilters.cities}
          onChange={handleGlobalCityChange}
          placeholder="Select cities..."
          searchPlaceholder="Search cities..."
        />
      </FilterSection>

      {/* Job Type — chip multi-select */}
      <FilterSection title="Job Type" count={vacancyMultiFilters.roles.length}>
        <ChipMultiSelect
          options={HIRE_TRAINER_ROLES}
          selected={vacancyMultiFilters.roles}
          onChange={handleGlobalRoleChange}
        />
      </FilterSection>

      {/* Specialization — searchable multi-select */}
      <FilterSection title="Specialization" count={vacancyMultiFilters.specializations.length}>
        <SearchableMultiSelect
          options={VACANCY_SPECIALIZATION_OPTIONS}
          selected={vacancyMultiFilters.specializations}
          onChange={(specializations) => setVacancyMultiFilters((prev) => ({ ...prev, specializations }))}
          placeholder="Select specializations..."
          searchPlaceholder="Search specializations..."
        />
      </FilterSection>

      {/* Experience Range */}
      <FilterSection title="Experience (years)">
        <div className="flex gap-2">
          <Input type="number" placeholder="Min" min={0} max={50} value={vacancyFilters.experienceMin ?? ''} onChange={(e) => updateVacancyFilter('experienceMin', e.target.value ? Number(e.target.value) : undefined)} className="h-9 text-sm" />
          <span className="text-gray-400 self-center text-sm">–</span>
          <Input type="number" placeholder="Max" min={0} max={50} value={vacancyFilters.experienceMax ?? ''} onChange={(e) => updateVacancyFilter('experienceMax', e.target.value ? Number(e.target.value) : undefined)} className="h-9 text-sm" />
        </div>
      </FilterSection>

      {/* Salary Range */}
      <FilterSection title="Salary Range (₹/mo)">
        <div className="flex gap-2">
          <Input type="number" placeholder="Min" min={0} value={vacancyFilters.salaryMin ?? ''} onChange={(e) => updateVacancyFilter('salaryMin', e.target.value ? Number(e.target.value) : undefined)} className="h-9 text-sm" />
          <span className="text-gray-400 self-center text-sm">–</span>
          <Input type="number" placeholder="Max" min={0} value={vacancyFilters.salaryMax ?? ''} onChange={(e) => updateVacancyFilter('salaryMax', e.target.value ? Number(e.target.value) : undefined)} className="h-9 text-sm" />
        </div>
      </FilterSection>

      {/* Gender — chip multi-select */}
      <FilterSection title="Gender Preference" count={vacancyMultiFilters.genders.length}>
        <ChipMultiSelect
          options={VACANCY_GENDER_OPTIONS}
          selected={vacancyMultiFilters.genders}
          onChange={(genders) => setVacancyMultiFilters((prev) => ({ ...prev, genders }))}
        />
      </FilterSection>

      {vacancyActiveFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearVacancyFilters} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5">
          <X className="w-3.5 h-3.5" /> Clear all filters
        </Button>
      )}
    </div>
  );

  // --- Sidebar Filter Content ---
  const filterContent = (
    <div className="space-y-5">
      {/* Location — searchable multi-select */}
      <FilterSection title="Location" count={multiFilters.cities.length}>
        <SearchableMultiSelect
          options={allCities}
          selected={multiFilters.cities}
          onChange={handleGlobalCityChange}
          placeholder="Select cities..."
          searchPlaceholder="Search cities..."
        />
      </FilterSection>

      {/* Job Type — chip multi-select */}
      <FilterSection title="Job Type" count={multiFilters.roles.length}>
        <ChipMultiSelect
          options={HIRE_TRAINER_ROLES}
          selected={multiFilters.roles}
          onChange={handleGlobalRoleChange}
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
              {activeTab === 'trainers'
                ? (isTrainerOwnProfile ? 'My Profile' : 'Find & Hire Trainers')
                : 'Trainer Vacancies'}
            </h1>
            <p className="text-emerald-100 mt-2 text-sm sm:text-base max-w-xl mx-auto">
              {activeTab === 'trainers'
                ? (isTrainerOwnProfile
                  ? 'View and update your trainer profile'
                  : 'Discover qualified fitness trainers ready to join your gym')
                : 'Browse open trainer positions at top gyms'}
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="flex bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'trainers' ? 'Search by name, city, specialization...' : 'Search vacancies by gym, city, specialization...'}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full h-12 sm:h-14 pl-12 pr-4 text-sm sm:text-base outline-none border-0 bg-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 sm:px-8 font-medium text-sm sm:text-base transition-colors shrink-0"
              >
                Search
              </button>
            </div>

            {/* Global Quick Filters */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {/* Role Chips */}
              {HIRE_TRAINER_ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => {
                    const newRoles = multiFilters.roles.includes(role.value)
                      ? multiFilters.roles.filter((r) => r !== role.value)
                      : [...multiFilters.roles, role.value];
                    handleGlobalRoleChange(newRoles);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    multiFilters.roles.includes(role.value)
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                  }`}
                >
                  {role.label}
                </button>
              ))}

              <span className="text-white/40 text-xs">|</span>

              {/* City Chips (show selected, click to remove) */}
              {multiFilters.cities.slice(0, 3).map((city) => (
                <span
                  key={city}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white text-emerald-700 shadow-sm cursor-pointer hover:bg-emerald-50"
                  onClick={() => handleGlobalCityChange(multiFilters.cities.filter((c) => c !== city))}
                >
                  <MapPin className="w-3 h-3" />
                  {city}
                  <X className="w-3 h-3" />
                </span>
              ))}
              {multiFilters.cities.length > 3 && (
                <span className="text-xs text-emerald-100">
                  +{multiFilters.cities.length - 3} more
                </span>
              )}

              {/* Clear All */}
              {globalActiveCount > 0 && (
                <button
                  onClick={clearGlobalFilters}
                  className="ml-1 px-2.5 py-1 rounded-full text-xs text-emerald-100 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex">
              <button
                onClick={() => { setActiveTab('trainers'); setSelectedVacancy(null); }}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'trainers'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Trainers
              </button>
              <button
                onClick={() => { setActiveTab('vacancies'); setSelectedTrainer(null); }}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'vacancies'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Briefcase className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Vacancies
              </button>
            </div>
            {/* Post Vacancy — only for logged-in gym owners */}
            {loggedInUser?.userType === 'gym_owner' && activeTab === 'vacancies' && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                onClick={() => { setEditVacancy(null); setShowPostVacancy(true); }}
              >
                <Plus className="w-4 h-4" /> Post Vacancy
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'trainers' ? (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Results bar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isTrainerOwnProfile
                  ? `${trainers.length} My Post${trainers.length !== 1 ? 's' : ''}`
                  : pagination ? `${pagination.total} Trainer${pagination.total !== 1 ? 's' : ''} found` : 'Searching...'}
              </span>
            </div>
            {isTrainerFetching && !isTrainerLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
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
          {/* Left Sidebar — desktop (hide for trainer's own profile) */}
          {!isTrainerOwnProfile && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white border rounded-xl p-5 sticky top-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Filters</h2>
              </div>
              {filterContent}
            </div>
          </aside>
          )}

          {/* Right — Results */}
          <div className="flex-1 min-w-0">
            {isTrainerLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
                <p className="text-sm text-gray-500">{isTrainerOwnProfile ? 'Loading your profile...' : 'Searching trainers...'}</p>
              </div>
            ) : trainers.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900">
                  {isTrainerOwnProfile ? 'No profile found' : 'No trainers found'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {isTrainerOwnProfile
                    ? 'Your profile could not be loaded'
                    : 'Try adjusting your search criteria or filters'}
                </p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 gap-1.5">
                    <X className="w-3.5 h-3.5" /> Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {trainers.map((trainer) => (
                  <div key={trainer.id} className="relative">
                    <TrainerListCard
                      trainer={trainer}
                      isSelected={selectedTrainer?.id === trainer.id}
                      onClick={() => setSelectedTrainer(trainer)}
                    />
                    {isTrainerOwnProfile && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowEditTrainer(true); }}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors z-10"
                        title="Edit profile"
                      >
                        <Pencil className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                    )}
                  </div>
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
      ) : (
      /* ═══════ VACANCIES TAB ═══════ */
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Vacancy Results bar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isGymOwnerVacancies
                  ? `${vacancies.length} My Vacanc${vacancies.length !== 1 ? 'ies' : 'y'}`
                  : vacancyPagination ? `${vacancyPagination.total} Vacanc${vacancyPagination.total !== 1 ? 'ies' : 'y'} found` : 'Searching...'}
              </span>
            </div>
            {isVacancyFetching && !isVacancyLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            {vacancyActiveFilterCount > 0 && (
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                {vacancyActiveFilterCount} filter{vacancyActiveFilterCount > 1 ? 's' : ''} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <Select value={vacancyFilters.sortBy ?? 'createdAt'} onValueChange={(v) => setVacancyFilters((prev) => ({ ...prev, sortBy: v, page: 1 }))}>
                <SelectTrigger className="h-8 w-36 text-xs border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Newest First</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="closeDate">Deadline</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => setVacancyFilters((prev) => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))} className="h-8 px-2 text-xs text-gray-500">
                {vacancyFilters.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
            <Button variant="outline" size="sm" className="lg:hidden gap-1.5 h-8" onClick={() => setShowMobileVacancyFilters(!showMobileVacancyFilters)}>
              <Filter className="w-3.5 h-3.5" /> Filters
              {vacancyActiveFilterCount > 0 && <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{vacancyActiveFilterCount}</span>}
            </Button>
            {/* Post Vacancy — mobile button for gym owners */}
            {loggedInUser?.userType === 'gym_owner' && (
              <Button
                size="sm"
                className="sm:hidden bg-blue-600 hover:bg-blue-700 text-white gap-1"
                onClick={() => { setEditVacancy(null); setShowPostVacancy(true); }}
              >
                <Plus className="w-3.5 h-3.5" /> Post
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Vacancy Filters */}
        {showMobileVacancyFilters && (
          <div className="lg:hidden mb-4 bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowMobileVacancyFilters(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            {vacancyFilterContent}
          </div>
        )}

        {/* Two-Column Layout */}
        <div className="flex gap-6">
          {/* Left Sidebar — desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white border rounded-xl p-5 sticky top-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Filters</h2>
              </div>
              {vacancyFilterContent}
            </div>
          </aside>

          {/* Right — Vacancy List */}
          <div className="flex-1 min-w-0">
          {isVacancyLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-sm text-gray-500">{isGymOwnerVacancies ? 'Loading your vacancies...' : 'Searching vacancies...'}</p>
            </div>
          ) : vacancies.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900">No vacancies found</p>
              <p className="mt-1 text-sm text-gray-500">
                {isGymOwnerVacancies
                  ? "You haven't posted any vacancies yet"
                  : loggedInUser?.userType === 'gym_owner'
                  ? 'Be the first to post a trainer vacancy!'
                  : 'Check back later for new opportunities'}
              </p>
              {loggedInUser?.userType === 'gym_owner' && (
                <Button
                  size="sm"
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  onClick={() => { setEditVacancy(null); setShowPostVacancy(true); }}
                >
                  <Plus className="w-4 h-4" /> Post Vacancy
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {vacancies.map((vacancy) => (
                <div key={vacancy.id} className="relative">
                  <VacancyListCard
                    vacancy={vacancy}
                    isSelected={selectedVacancy?.id === vacancy.id}
                    onClick={() => setSelectedVacancy(vacancy)}
                  />
                  {isGymOwnerVacancies && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditVacancy(vacancy); setShowPostVacancy(true); }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors z-10"
                      title="Edit vacancy"
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Vacancy Pagination */}
          {vacancyPagination && vacancyPagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white border rounded-xl px-4 py-3">
              <span className="text-xs text-gray-500">Page {vacancyPagination.page} of {vacancyPagination.totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={vacancyPagination.page <= 1} onClick={() => setVacancyFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))} className="h-8 text-xs">
                  Previous
                </Button>
                {Array.from({ length: Math.min(vacancyPagination.totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(vacancyPagination.page - 2, vacancyPagination.totalPages - 4));
                  const pg = start + i;
                  if (pg > vacancyPagination.totalPages) return null;
                  return (
                    <Button key={pg} variant={pg === vacancyPagination.page ? 'default' : 'outline'} size="sm" onClick={() => setVacancyFilters((prev) => ({ ...prev, page: pg }))} className={`h-8 w-8 text-xs p-0 ${pg === vacancyPagination.page ? 'bg-blue-600 hover:bg-blue-700' : ''}`}>
                      {pg}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" disabled={vacancyPagination.page >= vacancyPagination.totalPages} onClick={() => setVacancyFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))} className="h-8 text-xs">
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
        </div>{/* close flex gap-6 */}
      </div>
      )}

      {/* Trainer Detail Slide-over */}
      {selectedTrainer && (
        <TrainerDetailPanel trainer={selectedTrainer} onClose={() => setSelectedTrainer(null)} />
      )}

      {/* Vacancy Detail Slide-over */}
      {selectedVacancy && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedVacancy(null)} />
          <div className="relative w-full max-w-md bg-white shadow-xl h-full overflow-y-auto animate-in slide-in-from-right duration-200">
            <VacancyDetailPanel
              vacancy={selectedVacancy}
              onClose={() => setSelectedVacancy(null)}
              isOwner={isGymOwnerVacancies}
              onEdit={(v) => { setSelectedVacancy(null); setEditVacancy(v); setShowPostVacancy(true); }}
            />
          </div>
        </div>
      )}

      {/* Post Vacancy Dialog */}
      {showPostVacancy && loggedInUser && (
        <PostVacancyDialog
          open={showPostVacancy}
          onClose={() => { setShowPostVacancy(false); setEditVacancy(null); }}
          gymOwnerEmail={loggedInUser.email}
          editVacancy={editVacancy}
        />
      )}

      {/* Edit Trainer Profile Dialog */}
      {showEditTrainer && loggedInUser?.userType === 'trainer' && myProfileData && (
        <EditTrainerProfileDialog
          open={showEditTrainer}
          onClose={() => setShowEditTrainer(false)}
          trainerEmail={loggedInUser.email}
          trainer={myProfileData}
        />
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
