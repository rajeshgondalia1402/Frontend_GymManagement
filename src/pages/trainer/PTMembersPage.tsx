import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users, Search, Eye, ChevronLeft, ChevronRight, Mail, Phone, Target, Calendar, Activity, Pill } from 'lucide-react';
import { trainerService } from '@/services/trainer.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function PTMembersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['trainer-pt-members', page, searchTerm],
    queryFn: () => trainerService.getMyPTMembers({ page, limit, search: searchTerm }),
  });

  const { data: memberDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['trainer-pt-member-detail', selectedMemberId],
    queryFn: () => trainerService.getPTMemberDetail(selectedMemberId!),
    enabled: !!selectedMemberId && isDialogOpen,
  });

  const members = data?.data?.ptMembers || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;
  const pagination = { page: data?.data?.page || 1, totalPages, total };

  const handleViewClick = (memberId: string) => {
    setSelectedMemberId(memberId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedMemberId(null);
  };

  const member = memberDetail?.data;

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
                          onClick={() => handleViewClick(member.memberId)}
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

      {/* PT Member Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sticky top-0 bg-background z-10 p-4 sm:p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <DialogTitle className="text-xl sm:text-2xl font-bold truncate">
                  {member?.memberName || 'PT Member Details'}
                </DialogTitle>
                {member && (
                  <Badge variant={member.isActive ? 'default' : 'secondary'} className="mt-2">
                    {member.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {isDetailLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : !member ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Member details not found.</p>
              </div>
            ) : (
              <>
                {/* Personal Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Personal Information
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium text-sm sm:text-base break-all">{member.memberEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Mobile No
                      </p>
                      <p className="font-medium text-sm sm:text-base">{member.memberPhone || 'N/A'}</p>
                    </div>
                    {member.goals && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" /> Goals
                        </p>
                        <p className="font-medium text-sm sm:text-base">{member.goals}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* PT Membership Period */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    PT Membership Period
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="font-medium text-sm sm:text-base">
                          {member.startDate
                            ? new Date(member.startDate).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">End Date</p>
                        <p className="font-medium text-sm sm:text-base">
                          {member.endDate
                            ? new Date(member.endDate).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {member.notes && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Notes
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                      <p className="text-sm">{member.notes}</p>
                    </div>
                  </div>
                )}

                {/* Diet Plan */}
                {member.dietPlan && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Assigned Diet Plan
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="font-semibold text-base">{member.dietPlan.planName || 'N/A'}</p>
                        <Badge variant={member.dietPlan.isActive ? 'default' : 'secondary'} className="w-fit">
                          {member.dietPlan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {member.dietPlan.description && (
                        <p className="text-sm text-muted-foreground">{member.dietPlan.description}</p>
                      )}
                      {member.dietPlan.calories && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Daily Calories:</span>{' '}
                          <span className="font-medium">{member.dietPlan.calories} kcal</span>
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
                        <div>
                          <span className="text-muted-foreground">Start:</span>{' '}
                          <span className="font-medium">
                            {member.dietPlan.startDate
                              ? new Date(member.dietPlan.startDate).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">End:</span>{' '}
                          <span className="font-medium">
                            {member.dietPlan.endDate
                              ? new Date(member.dietPlan.endDate).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Supplements */}
                {member.supplements && member.supplements.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Supplements
                    </h3>
                    <div className="space-y-3">
                      {member.supplements.map((supplement: any) => (
                        <div key={supplement.id} className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <p className="font-semibold">{supplement.name}</p>
                            <Badge variant={supplement.isActive ? 'default' : 'secondary'} className="w-fit">
                              {supplement.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                            {supplement.dosage && (
                              <div>
                                <span className="text-muted-foreground">Dosage:</span>{' '}
                                <span className="font-medium">{supplement.dosage}</span>
                              </div>
                            )}
                            {supplement.frequency && (
                              <div>
                                <span className="text-muted-foreground">Frequency:</span>{' '}
                                <span className="font-medium">{supplement.frequency}</span>
                              </div>
                            )}
                            {supplement.timing && (
                              <div>
                                <span className="text-muted-foreground">Timing:</span>{' '}
                                <span className="font-medium">{supplement.timing}</span>
                              </div>
                            )}
                          </div>
                          {supplement.notes && (
                            <p className="text-sm text-muted-foreground pt-1 border-t">{supplement.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t p-4 sm:p-6">
            <Button variant="outline" className="w-full" onClick={handleCloseDialog}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PTMembersPage;
