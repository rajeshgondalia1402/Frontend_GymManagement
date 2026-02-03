import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loading } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  CreditCard,
  UserCog,
  Activity,
  TrendingUp,
  Dumbbell,
  Crown,
  ArrowRight,
  BarChart3,
  PieChart,
  Zap,
  Shield,
  Globe,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminService.getDashboard,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Live clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date with ordinal suffix
  const formatLiveDateTime = (date: Date) => {
    const day = date.getDate();
    const ordinal = (d: number) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    return `${day}${ordinal(day)} ${month} ${year} | ${time}`;
  };

  if (isLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  if (!stats) {
    return <div>Failed to load dashboard</div>;
  }

  const gymActivityRate = stats.totalGyms > 0
    ? Math.round((stats.activeGyms / stats.totalGyms) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZ3JpZCkiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Crown className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
                  <p className="text-slate-400">Complete control over your gym network</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono text-sm">
                    {formatLiveDateTime(currentTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span className="text-green-400 text-xs font-medium">All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Gyms */}
        <Card
          className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          onClick={() => navigate('/admin/gyms')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <Building2 className="h-20 w-20" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-blue-100 font-medium">Total Gyms</span>
            </div>
            <p className="text-4xl font-bold mb-2">{stats?.totalGyms || 0}</p>
            <div className="flex items-center gap-2 text-blue-100">
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${gymActivityRate}%` }}
                />
              </div>
              <span className="text-sm">{gymActivityRate}% active</span>
            </div>
          </CardContent>
        </Card>

        {/* Gym Owners */}
        <Card
          className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          onClick={() => navigate('/admin/gym-owners')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <Users className="h-20 w-20" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-emerald-100 font-medium">Gym Owners</span>
            </div>
            <p className="text-4xl font-bold mb-2">{stats?.totalGymOwners || 0}</p>
            <div className="flex items-center gap-2 text-emerald-100 text-sm">
              <Shield className="h-4 w-4" />
              <span>Registered Partners</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Members */}
        <Card
          className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <UserCog className="h-20 w-20" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <UserCog className="h-5 w-5" />
              </div>
              <span className="text-purple-100 font-medium">Total Members</span>
            </div>
            <p className="text-4xl font-bold mb-2">{stats?.totalMembers || 0}</p>
            <div className="flex items-center gap-2 text-purple-100 text-sm">
              <Globe className="h-4 w-4" />
              <span>Across All Gyms</span>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <Card
          className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          onClick={() => navigate('/admin/subscription-plans')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <CreditCard className="h-20 w-20" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CreditCard className="h-5 w-5" />
              </div>
              <span className="text-orange-100 font-medium">Subscription Plans</span>
            </div>
            <p className="text-4xl font-bold mb-2">{stats?.subscriptionPlans || 0}</p>
            <div className="flex items-center gap-2 text-orange-100 text-sm">
              <Zap className="h-4 w-4" />
              <span>Active Plans</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gym Status Breakdown */}
        <Card className="lg:col-span-1 border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              Gym Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Active Gyms</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats?.activeGyms || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-400 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Inactive Gyms</span>
                </div>
                <span className="text-2xl font-bold text-gray-600">{stats?.inactiveGyms || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-1 border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Total Trainers</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">{stats?.totalTrainers || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Avg Members/Gym</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {stats && stats.totalGyms > 0 ? Math.round(stats.totalMembers / stats.totalGyms) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-1 border-0 shadow-md bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300"
                onClick={() => navigate('/admin/gyms')}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Manage Gyms
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all duration-300"
                onClick={() => navigate('/admin/gym-owners')}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Owners
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-white hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all duration-300"
                onClick={() => navigate('/admin/subscription-plans')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Subscription Plans
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Gyms */}
      <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <CardTitle>Recent Gyms</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              onClick={() => navigate('/admin/gyms')}
            >
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <CardDescription>Latest registered gyms in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentGyms && stats.recentGyms.length > 0 ? (
              stats.recentGyms.map((gym, index) => (
                <div
                  key={gym.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-300 cursor-pointer"
                  onClick={() => navigate('/admin/gyms')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      index === 1 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                        index === 2 ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                          'bg-gradient-to-br from-gray-400 to-gray-500'
                      }`}>
                      {gym.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{gym.name}</p>
                      <p className="text-sm text-gray-500">
                        {gym.owner ? `Owner: ${gym.owner.name || gym.owner.email}` : 'No owner assigned'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={`${gym.isActive
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                    >
                      {gym.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(gym.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No gyms registered yet</p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => navigate('/admin/gyms')}
                >
                  Add First Gym
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
