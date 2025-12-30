import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, CreditCard, UserCog, Activity, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminService.getDashboard,
  });

  if (isLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  if (!stats) {
    return <div>Failed to load dashboard</div>;
  }

  const statCards = [
    {
      title: 'Total Gyms',
      value: stats?.totalGyms || 0,
      icon: <Building2 className="h-5 w-5" />,
      color: 'bg-blue-500',
      description: `${stats?.activeGyms || 0} active, ${stats?.inactiveGyms || 0} inactive`,
    },
    {
      title: 'Gym Owners',
      value: stats?.totalGymOwners || 0,
      icon: <Users className="h-5 w-5" />,
      color: 'bg-green-500',
      description: 'Registered owners',
    },
    {
      title: 'Total Members',
      value: stats?.totalMembers || 0,
      icon: <UserCog className="h-5 w-5" />,
      color: 'bg-purple-500',
      description: 'Across all gyms',
    },
    {
      title: 'Subscription Plans',
      value: stats?.subscriptionPlans || 0,
      icon: <CreditCard className="h-5 w-5" />,
      color: 'bg-orange-500',
      description: 'Active plans',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Overview of your gym management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                </div>
                <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center text-white`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Gyms</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentGyms && stats.recentGyms.length > 0 ? (
                stats.recentGyms.map((gym) => (
                  <div key={gym.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{gym.name}</p>
                      <p className="text-sm text-gray-500">
                        {gym.owner ? `Owner: ${gym.owner.name || gym.owner.email}` : 'No owner assigned'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={gym.isActive ? 'success' : 'secondary'}>
                        {gym.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(gym.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No gyms registered yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Quick Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Trainers</span>
                <span className="font-bold text-gray-900">{stats?.totalTrainers || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Active Gyms</span>
                <span className="font-bold text-gray-900">{stats?.activeGyms || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Inactive Gyms</span>
                <span className="font-bold text-gray-900">{stats?.inactiveGyms || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Avg Members/Gym</span>
                <span className="font-bold text-gray-900">
                  {stats && stats.totalGyms > 0 ? Math.round(stats.totalMembers / stats.totalGyms) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
