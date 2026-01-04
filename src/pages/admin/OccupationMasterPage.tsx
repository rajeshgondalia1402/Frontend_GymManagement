import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { adminService } from '@/services/admin.service';

const ITEMS_PER_PAGE = 10;

export function OccupationMasterPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: occupations, isLoading, error } = useQuery({
    queryKey: ['occupations'],
    queryFn: adminService.getOccupations,
  });

  // Filter and paginate occupations
  const filteredOccupations = useMemo(() => {
    if (!occupations) return [];
    
    let filtered = occupations;
    
    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (occ) =>
          occ.name?.toLowerCase().includes(searchLower) ||
          occ.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [occupations, debouncedSearch]);

  // Paginate
  const totalPages = Math.ceil(filteredOccupations.length / ITEMS_PER_PAGE);
  const paginatedOccupations = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredOccupations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOccupations, page]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load occupations</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Occupation Master</h1>
          <p className="text-muted-foreground">View and manage occupation records</p>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Occupations</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupations?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Occupations</CardTitle>
            <Briefcase className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {occupations?.filter((o) => o.isActive !== false).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOccupations.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search occupations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner className="h-8 w-8" />
            </div>
          ) : paginatedOccupations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No occupations found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? 'Try adjusting your search criteria'
                  : 'No occupation records available'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOccupations.map((occupation, index) => {
                      // Handle different possible field names from API
                      const occupationName = (occupation as any).name || (occupation as any).occupationName || (occupation as any).title || '-';
                      const occupationDesc = (occupation as any).description || (occupation as any).desc || '-';
                      
                      return (
                        <TableRow key={occupation.id || index}>
                          <TableCell className="font-medium">
                            {(page - 1) * ITEMS_PER_PAGE + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{occupationName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {occupationDesc}
                          </TableCell>
                          <TableCell>
                            <Badge variant={occupation.isActive !== false ? 'default' : 'secondary'}>
                              {occupation.isActive !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(occupation.createdAt)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(page * ITEMS_PER_PAGE, filteredOccupations.length)} of{' '}
                    {filteredOccupations.length} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OccupationMasterPage;
