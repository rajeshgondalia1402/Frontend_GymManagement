import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { trainerService } from '@/services/trainer.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function PTMembersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['trainer-pt-members', page, searchTerm],
    queryFn: () => trainerService.getMyPTMembers({ page, limit, search: searchTerm }),
  });

  // API returns: { success, message, data: { ptMembers, total, page, limit } }
  const members = data?.data?.ptMembers || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;
  const pagination = { page: data?.data?.page || 1, totalPages, total };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My PT Members</h1>
          <p className="text-muted-foreground">
            Manage your assigned personal training members
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Users className="h-4 w-4 mr-1" />
          {pagination.total} Members
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned PT Members</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No PT members assigned to you yet</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                    <TableHead className="py-3 text-white font-semibold">Name</TableHead>
                    <TableHead className="py-3 text-white font-semibold">Email</TableHead>
                    <TableHead className="py-3 text-white font-semibold">Package</TableHead>
                    <TableHead className="py-3 text-white font-semibold">Status</TableHead>
                    <TableHead className="py-3 text-white font-semibold">Start Date</TableHead>
                    <TableHead className="py-3 text-white font-semibold">End Date</TableHead>
                    <TableHead className="text-right py-3 text-white font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.memberName || 'N/A'}
                      </TableCell>
                      <TableCell>{member.memberEmail || 'N/A'}</TableCell>
                      <TableCell>{member.packageName || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={member.isActive ? 'default' : 'secondary'}
                        >
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.startDate
                          ? new Date(member.startDate).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {member.endDate
                          ? new Date(member.endDate).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/trainer/pt-members/${member.memberId}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
                  </p>
                  <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                    <SelectTrigger className="w-[70px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs sm:text-sm text-muted-foreground">per page</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-xs">
                    <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-xs">
                    <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• You can only view members assigned to you as their PT trainer</p>
            <p>• Contact your gym owner to assign or reassign members</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PTMembersPage;
