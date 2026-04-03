import { useQuery } from '@tanstack/react-query';
import { gymOwnerService } from '@/services/gymOwner.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, IndianRupee, CalendarDays, ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

// ── Color palettes ──────────────────────────────
const BAR_COLORS = {
  newInquiries: '#8b5cf6',
  newJoiners: '#3b82f6',
  newPT: '#f59e0b',
  renewals: '#10b981',
};

const MONTH_OPTIONS = [
  { value: 3, label: '3 Months' },
  { value: 6, label: '6 Months' },
  { value: 9, label: '9 Months' },
  { value: 12, label: '12 Months' },
];

const formatCurrency = (value: number) => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
};

const formatMonthLabel = (month: string) => {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
};

// ── Shared Month Range Filter ───────────────────
function MonthRangeFilter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      {MONTH_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-all duration-200 ${
            value === opt.value
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Custom Bar Tooltip ──────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border p-3 text-sm min-w-[150px]">
      <p className="font-semibold text-gray-800 mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Income vs Expense Tooltip ────────────────────
const IncomeExpenseTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
  const expenses = payload.find((p: any) => p.dataKey === 'expenses')?.value || 0;
  const net = income - expenses;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-gray-800 mb-2 border-b pb-1.5">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Income
          </span>
          <span className="font-semibold text-emerald-700">{formatCurrency(income)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Expenses
          </span>
          <span className="font-semibold text-rose-700">{formatCurrency(expenses)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-1.5">
          <span className="flex items-center gap-1.5">
            {net >= 0 ? <TrendingUp className="h-3 w-3 text-blue-500" /> : <TrendingDown className="h-3 w-3 text-orange-500" />}
            {net >= 0 ? 'Profit' : 'Loss'}
          </span>
          <span className={`font-bold ${net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(Math.abs(net))}</span>
        </div>
      </div>
    </div>
  );
};

// ── Income & Expense Chart (Month-wise Bar Chart) ───
export function IncomeExpensePieChart() {
  const [months, setMonths] = useState(6);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-income-expense-chart', months],
    queryFn: () => gymOwnerService.getDashboardIncomeExpenseChart(months),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-blue-600" />
            Income vs Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const netProfit = data.totalIncome - data.totalExpenses;
  const chartData = data.data.map((item) => ({
    ...item,
    month: formatMonthLabel(item.month),
    net: item.income - item.expenses,
  }));

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 px-4 sm:px-6">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-blue-600" />
            Income vs Expenses
          </CardTitle>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
            <MonthRangeFilter value={months} onChange={setMonths} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 space-y-4">

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 border border-emerald-200/50">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] sm:text-xs font-medium text-emerald-600">Total Income</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-emerald-700">{formatCurrency(data.totalIncome)}</p>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl p-3 border border-rose-200/50">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-[10px] sm:text-xs font-medium text-rose-600">Total Expenses</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-rose-700">{formatCurrency(data.totalExpenses)}</p>
          </div>
          <div className={`rounded-xl p-3 border ${
            netProfit >= 0
              ? 'bg-gradient-to-br from-blue-50 to-indigo-100/50 border-blue-200/50'
              : 'bg-gradient-to-br from-orange-50 to-amber-100/50 border-orange-200/50'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              {netProfit >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-orange-500" />
              )}
              <span className={`text-[10px] sm:text-xs font-medium ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                Net {netProfit >= 0 ? 'Profit' : 'Loss'}
              </span>
            </div>
            <p className={`text-base sm:text-lg font-bold ${netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {formatCurrency(Math.abs(netProfit))}
            </p>
          </div>
        </div>

        {/* ── Bar Chart ── */}
        {chartData.every((d) => !d.income && !d.expenses) ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <IndianRupee className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">No financial data for last {months} months</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barGap={4} barCategoryGap="20%">
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => {
                  if (v >= 100000) return `${(v / 100000).toFixed(0)}L`;
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                  return v;
                }}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<IncomeExpenseTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
              <Bar
                dataKey="income"
                name="Income"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                animationDuration={600}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                animationBegin={150}
                animationDuration={600}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* ── Category Breakdown Toggle ── */}
        {(data.incomeBreakdown.length > 0 || data.expenseBreakdown.length > 0) && (
          <div>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showBreakdown ? 'rotate-180' : ''}`} />
              {showBreakdown ? 'Hide' : 'View'} Category Breakdown
            </button>
            {showBreakdown && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                {/* Income Categories */}
                <div>
                  <h4 className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Income Sources
                  </h4>
                  <div className="space-y-1.5">
                    {data.incomeBreakdown.map((item) => (
                      <div key={item.category} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate mr-2">{item.category}</span>
                        <span className="font-medium text-gray-800 whitespace-nowrap">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                    {data.incomeBreakdown.length === 0 && (
                      <p className="text-xs text-gray-400">No income data</p>
                    )}
                  </div>
                </div>
                {/* Expense Categories */}
                <div>
                  <h4 className="text-xs font-semibold text-rose-700 mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Expense Categories
                  </h4>
                  <div className="space-y-1.5">
                    {data.expenseBreakdown.map((item) => (
                      <div key={item.category} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate mr-2">{item.category}</span>
                        <span className="font-medium text-gray-800 whitespace-nowrap">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                    {data.expenseBreakdown.length === 0 && (
                      <p className="text-xs text-gray-400">No expense data</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Monthly Activity Bar Chart ──────────────────
type BarKey = 'newInquiries' | 'newJoiners' | 'newPT' | 'renewals';

const BAR_SERIES: { key: BarKey; label: string; color: string }[] = [
  { key: 'newInquiries', label: 'Inquiries', color: BAR_COLORS.newInquiries },
  { key: 'newJoiners', label: 'New Joiners', color: BAR_COLORS.newJoiners },
  { key: 'newPT', label: 'New PT', color: BAR_COLORS.newPT },
  { key: 'renewals', label: 'Renewals', color: BAR_COLORS.renewals },
];

export function MonthlyActivityBarChart() {
  const [months, setMonths] = useState(6);
  const [visibleSeries, setVisibleSeries] = useState<Set<BarKey>>(
    new Set(['newInquiries', 'newJoiners', 'newPT', 'renewals'])
  );

  const toggleSeries = (key: BarKey) => {
    setVisibleSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-monthly-activity-chart', months],
    queryFn: () => gymOwnerService.getDashboardMonthlyActivityChart(months),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Monthly Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const chartData = data.data.map((item) => ({
    ...item,
    month: formatMonthLabel(item.month),
  }));

  // Calculate totals for summary
  const totals = data.data.reduce(
    (acc, item) => ({
      inquiries: acc.inquiries + item.newInquiries,
      joiners: acc.joiners + item.newJoiners,
      pt: acc.pt + item.newPT,
      renewals: acc.renewals + item.renewals,
    }),
    { inquiries: 0, joiners: 0, pt: 0, renewals: 0 }
  );

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 px-4 sm:px-6">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Monthly Activity
          </CardTitle>
          {/* Period filter */}
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
            <MonthRangeFilter value={months} onChange={setMonths} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {/* Toggleable summary pills — click to show/hide series */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { key: 'newInquiries' as BarKey, label: 'Inquiries', value: totals.inquiries, color: BAR_COLORS.newInquiries },
            { key: 'newJoiners' as BarKey, label: 'New Joiners', value: totals.joiners, color: BAR_COLORS.newJoiners },
            { key: 'newPT' as BarKey, label: 'New PT', value: totals.pt, color: BAR_COLORS.newPT },
            { key: 'renewals' as BarKey, label: 'Renewals', value: totals.renewals, color: BAR_COLORS.renewals },
          ].map((item) => {
            const isActive = visibleSeries.has(item.key);
            return (
              <button
                key={item.label}
                onClick={() => toggleSeries(item.key)}
                className={`flex items-center gap-2 rounded-lg p-2.5 text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-gray-50 ring-1 ring-gray-200'
                    : 'bg-gray-50/50 opacity-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-opacity"
                  style={{ backgroundColor: item.color, opacity: isActive ? 1 : 0.3 }}
                />
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm sm:text-base font-bold text-gray-800">{item.value}</p>
                </div>
              </button>
            );
          })}
        </div>

        {chartData.every((d) => !d.newInquiries && !d.newJoiners && !d.newPT && !d.renewals) ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <BarChart3 className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">No activity data for last {months} months</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barGap={2} barCategoryGap="20%">
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
              {BAR_SERIES.filter((s) => visibleSeries.has(s.key)).map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                  animationBegin={i * 150}
                  animationDuration={600}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
