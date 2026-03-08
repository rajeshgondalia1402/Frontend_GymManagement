import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Minus,
  Flame,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { memberAttendanceService } from '@/services/attendance.service';

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

const STATUS_ICONS = {
  present: <CheckCircle className="h-4 w-4 text-green-500" />,
  absent: <XCircle className="h-4 w-4 text-red-500" />,
  no_data: <Minus className="h-4 w-4 text-muted-foreground" />,
};

const STATUS_COLORS = {
  present: 'bg-green-100 text-green-800 border-green-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  no_data: 'bg-muted text-muted-foreground border-muted',
};

export function MyAttendancePage() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [historyPage, setHistoryPage] = useState(1);

  // Attendance Summary
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['my-attendance-summary'],
    queryFn: memberAttendanceService.getMySummary,
  });

  // Attendance Streak
  const { data: streak, isLoading: loadingStreak } = useQuery({
    queryKey: ['my-attendance-streak'],
    queryFn: memberAttendanceService.getMyStreak,
  });

  // Calendar Data
  const { data: calendar, isLoading: loadingCalendar } = useQuery({
    queryKey: ['my-attendance-calendar', calendarYear, calendarMonth],
    queryFn: () => memberAttendanceService.getMyCalendar(calendarYear, calendarMonth),
  });

  // Attendance History
  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['my-attendance-history', historyPage],
    queryFn: () => memberAttendanceService.getMyAttendance({ page: historyPage, limit: 10 }),
    enabled: activeTab === 'history',
  });

  const firstDayOfMonth = new Date(calendarYear, calendarMonth - 1, 1).getDay();
  const calendarDays = calendar || [];
  const history = historyData?.data || [];
  const historyPagination = historyData?.pagination;

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (calendarMonth === 1) {
        setCalendarMonth(12);
        setCalendarYear(calendarYear - 1);
      } else {
        setCalendarMonth(calendarMonth - 1);
      }
    } else {
      if (calendarMonth === 12) {
        setCalendarMonth(1);
        setCalendarYear(calendarYear + 1);
      } else {
        setCalendarMonth(calendarMonth + 1);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          My Attendance
        </h1>
        <p className="text-muted-foreground">Track your gym attendance and progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Spinner />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.attendancePercentage || 0}%</div>
                <Progress value={summary?.attendancePercentage || 0} className="mt-2" />
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Days Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Spinner />
            ) : (
              <div className="text-2xl font-bold text-green-600">{summary?.presentDays || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStreak ? (
              <Spinner />
            ) : (
              <div className="text-2xl font-bold text-orange-500">
                {streak?.currentStreak || 0} days
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Best Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStreak ? (
              <Spinner />
            ) : (
              <div className="text-2xl font-bold text-purple-600">
                {streak?.longestStreak || 0} days
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Average Duration Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Average Workout Duration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatDuration(summary?.averageDuration)}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Based on {summary?.presentDays || 0} gym visits
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(new Date(calendarYear, calendarMonth - 1), 'MMMM yyyy')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {calendarDays.filter(d => d.status === 'present').length} days present this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCalendar ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-sm font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before the first of the month */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {/* Days of the month */}
                    {calendarDays.map((day, index) => {
                      const dayNum = index + 1;
                      const isToday =
                        day.date === format(new Date(), 'yyyy-MM-dd');

                      return (
                        <div
                          key={day.date}
                          className={`
                            aspect-square rounded-lg border p-1 flex flex-col items-center justify-center
                            ${STATUS_COLORS[day.status]}
                            ${isToday ? 'ring-2 ring-primary' : ''}
                          `}
                        >
                          <span className="text-sm font-medium">{dayNum}</span>
                          {day.status !== 'no_data' && (
                            <div className="mt-1">{STATUS_ICONS[day.status]}</div>
                          )}
                          {day.duration && (
                            <span className="text-xs mt-0.5">{formatDuration(day.duration)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center gap-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
                      <span className="text-sm text-muted-foreground">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
                      <span className="text-sm text-muted-foreground">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-muted border" />
                      <span className="text-sm text-muted-foreground">Future</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>Your detailed attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance records yet</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {format(new Date(record.attendanceDate), 'EEE, MMM d, yyyy')}
                          </TableCell>
                          <TableCell>{formatTime(record.checkInTime)}</TableCell>
                          <TableCell>{formatTime(record.checkOutTime)}</TableCell>
                          <TableCell>{formatDuration(record.durationMinutes)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                record.status === 'CHECKED_OUT'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }
                            >
                              {record.status === 'CHECKED_IN' ? 'In Gym' : 'Completed'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {historyPagination && historyPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Page {historyPage} of {historyPagination.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                          disabled={historyPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setHistoryPage((p) =>
                              Math.min(historyPagination.totalPages, p + 1)
                            )
                          }
                          disabled={historyPage === historyPagination.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MyAttendancePage;
