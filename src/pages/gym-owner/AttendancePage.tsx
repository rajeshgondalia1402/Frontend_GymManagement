import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  Search,
  Calendar,
  Clock,
  Users,
  UserX,
  BarChart3,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { gymOwnerAttendanceService } from '@/services/attendance.service';
import { gymOwnerService } from '@/services/gymOwner.service';
import { toast } from '@/hooks/use-toast';
import type { AttendanceStatus } from '@/types';
import { config } from '@/config/env';

const manualAttendanceSchema = z.object({
  memberId: z.string().min(1, 'Please select a member'),
  attendanceDate: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  reason: z.string().min(1, 'Please provide a reason for manual entry'),
});

type ManualAttendanceForm = z.infer<typeof manualAttendanceSchema>;

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  CHECKED_IN: 'bg-green-100 text-green-800',
  CHECKED_OUT: 'bg-blue-100 text-blue-800',
  ABSENT: 'bg-red-100 text-red-800',
};

function formatDuration(minutes?: number | null): string {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatTime(dateString?: string | null): string {
  if (!dateString) return '-';
  return format(new Date(dateString), 'hh:mm a');
}

export function AttendancePage() {
  const [activeTab, setActiveTab] = useState('today');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Today's Summary
  const { data: todaySummary } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: gymOwnerAttendanceService.getToday,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Today's Detailed Report
  const { data: todayReport, isLoading: loadingTodayReport } = useQuery({
    queryKey: ['attendance-today-report'],
    queryFn: () => gymOwnerAttendanceService.getDailyReport(),
    refetchInterval: 30000,
  });

  // Attendance Records
  const { data: attendanceData, isLoading: loadingRecords } = useQuery({
    queryKey: ['attendance-records', page, debouncedSearch, statusFilter, dateRange],
    queryFn: () =>
      gymOwnerAttendanceService.getAll({
        page,
        limit: 10,
        search: debouncedSearch,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
    enabled: activeTab === 'records',
  });

  // Monthly Report
  const { data: monthlyReport, isLoading: loadingMonthly } = useQuery({
    queryKey: ['attendance-monthly', reportYear, reportMonth],
    queryFn: () => gymOwnerAttendanceService.getMonthlyReport(reportYear, reportMonth),
    enabled: activeTab === 'reports',
  });

  // Members for manual attendance
  const { data: membersData } = useQuery({
    queryKey: ['members-dropdown'],
    queryFn: () => gymOwnerService.getMembers({ page: 1, limit: 1000 }),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ManualAttendanceForm>({
    resolver: zodResolver(manualAttendanceSchema),
    defaultValues: {
      attendanceDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const manualMutation = useMutation({
    mutationFn: gymOwnerAttendanceService.createManual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      setManualDialogOpen(false);
      reset();
      toast({ title: 'Manual attendance entry created successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create attendance entry';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const onManualSubmit = (data: ManualAttendanceForm) => {
    manualMutation.mutate({
      memberId: data.memberId,
      attendanceDate: data.attendanceDate,
      checkInTime: data.checkInTime ? new Date(`${data.attendanceDate}T${data.checkInTime}`).toISOString() : undefined,
      checkOutTime: data.checkOutTime ? new Date(`${data.attendanceDate}T${data.checkOutTime}`).toISOString() : undefined,
      reason: data.reason,
    });
  };

  const records = attendanceData?.data || [];
  const pagination = attendanceData?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const members = membersData?.data || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Attendance Management
          </h1>
          <p className="text-muted-foreground">Track and manage member attendance</p>
        </div>
        <Button onClick={() => setManualDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Manual Entry
        </Button>
      </div>

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Check-ins Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySummary?.totalCheckIns || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Check-outs Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySummary?.totalCheckOuts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Currently in Gym
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{todaySummary?.currentlyInGym || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg. Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(todaySummary?.averageDuration)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="today">Today's Attendance</TabsTrigger>
          <TabsTrigger value="records">All Records</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Today's Attendance */}
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today - {format(new Date(), 'EEEE, MMMM d, yyyy')}</CardTitle>
              <CardDescription>
                Members who checked in today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTodayReport ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (todayReport?.members?.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No check-ins recorded today</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayReport?.members?.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {record.member?.memberPhoto ? (
                                <AvatarImage src={`${config.backendUrl}${record.member.memberPhoto}`} />
                              ) : null}
                              <AvatarFallback>
                                {record.member?.name?.[0] || 'M'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{record.member?.name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{record.member?.memberId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatTime(record.checkInTime)}</TableCell>
                        <TableCell>{formatTime(record.checkOutTime)}</TableCell>
                        <TableCell>{formatDuration(record.durationMinutes)}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[record.status]}>
                            {record.status === 'CHECKED_IN' ? 'In Gym' : 'Left'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {record.verificationMethod === 'FINGERPRINT' ? 'Biometric' : record.verificationMethod}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Records */}
        <TabsContent value="records" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as AttendanceStatus | 'all')}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-[160px]"
            />
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              className="w-[160px]"
            />
          </div>

          {/* Records Table */}
          <Card>
            <CardContent className="p-0">
              {loadingRecords ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance records found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(new Date(record.attendanceDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                {record.member?.memberPhoto ? (
                                  <AvatarImage src={`${config.backendUrl}${record.member.memberPhoto}`} />
                                ) : null}
                                <AvatarFallback>
                                  {record.member?.name?.[0] || 'M'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{record.member?.name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">{record.member?.memberId}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatTime(record.checkInTime)}</TableCell>
                          <TableCell>{formatTime(record.checkOutTime)}</TableCell>
                          <TableCell>{formatDuration(record.durationMinutes)}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[record.status]}>
                              {record.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.isManualEntry ? 'Manual' : record.verificationMethod}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages} ({pagination?.total} records)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="space-y-4">
          {/* Month Selector */}
          <div className="flex gap-4 items-center">
            <Select
              value={reportMonth.toString()}
              onValueChange={(value) => setReportMonth(parseInt(value, 10))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {format(new Date(2024, i, 1), 'MMMM')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={reportYear.toString()}
              onValueChange={(value) => setReportYear(parseInt(value, 10))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Monthly Stats */}
          {loadingMonthly ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : monthlyReport ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{monthlyReport.totalAttendance}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Daily Average
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{monthlyReport.averageDaily}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Peak Day
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {monthlyReport.peakDay
                        ? `${format(new Date(monthlyReport.peakDay.date), 'MMM d')} (${monthlyReport.peakDay.count})`
                        : '-'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{monthlyReport.totalMembers}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Breakdown */}
              {monthlyReport.byDay && monthlyReport.byDay.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Daily Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {monthlyReport.byDay.map((day) => (
                        <div key={day.date} className="flex items-center gap-4">
                          <span className="w-24 text-sm text-muted-foreground">
                            {format(new Date(day.date), 'MMM d')}
                          </span>
                          <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full flex items-center justify-end pr-2"
                              style={{
                                width: `${Math.min(100, (day.count / (monthlyReport.peakDay?.count || 1)) * 100)}%`,
                              }}
                            >
                              <span className="text-xs text-primary-foreground font-medium">
                                {day.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No report data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Manual Attendance Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Attendance Entry</DialogTitle>
            <DialogDescription>
              Add a manual attendance entry for a member
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onManualSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Member *</Label>
              <Select onValueChange={(value) => setValue('memberId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email} ({member.memberId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.memberId && (
                <p className="text-sm text-destructive">{errors.memberId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendanceDate">Date</Label>
              <Input
                id="attendanceDate"
                type="date"
                {...register('attendanceDate')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkInTime">Check-in Time</Label>
                <Input
                  id="checkInTime"
                  type="time"
                  {...register('checkInTime')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOutTime">Check-out Time</Label>
                <Input
                  id="checkOutTime"
                  type="time"
                  {...register('checkOutTime')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., System was offline, member forgot to scan"
                {...register('reason')}
              />
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setManualDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={manualMutation.isPending}>
                {manualMutation.isPending ? <Spinner className="mr-2" /> : null}
                Create Entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AttendancePage;
