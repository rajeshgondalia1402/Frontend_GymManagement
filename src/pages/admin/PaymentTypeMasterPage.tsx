import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
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

export function PaymentTypeMasterPage() {
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

  const { data: paymentTypes, isLoading, error } = useQuery({
    queryKey: ['payment-types'],
    queryFn: adminService.getPaymentTypes,
  });

  // Filter and paginate payment types
  const filteredPaymentTypes = useMemo(() => {
    if (!paymentTypes) return [];
    
    let filtered = paymentTypes;
    
    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (item: any) =>
          (item.name || item.paymentTypeName || item.title || '')?.toLowerCase().includes(searchLower) ||
          (item.description || item.desc || '')?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [paymentTypes, debouncedSearch]);

  // Paginate
  const totalPages = Math.ceil(filteredPaymentTypes.length / ITEMS_PER_PAGE);
  const paginatedPaymentTypes = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredPaymentTypes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPaymentTypes, page]);

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
          <p className="text-red-500 mb-2">Failed to load payment types</p>
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
          <h1 className="text-2xl font-bold">Payment Type Master</h1>
          <p className="text-muted-foreground">View payment type records</p>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payment Types</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentTypes?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Types</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentTypes?.filter((item: any) => item.isActive !== false).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPaymentTypes.length}</div>
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
                placeholder="Search payment types..."
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
          ) : paginatedPaymentTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No payment types found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? 'Try adjusting your search criteria'
                  : 'No payment type records available'}
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
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPaymentTypes.map((paymentType: any, index: number) => {
                      const typeName = paymentType.name || paymentType.paymentTypeName || paymentType.title || '-';
                      
                      return (
                        <TableRow key={paymentType.id || index}>
                          <TableCell className="font-medium">
                            {(page - 1) * ITEMS_PER_PAGE + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{typeName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={paymentType.isActive !== false ? 'default' : 'secondary'}>
                              {paymentType.isActive !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(paymentType.createdAt)}</TableCell>
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
                    {Math.min(page * ITEMS_PER_PAGE, filteredPaymentTypes.length)} of{' '}
                    {filteredPaymentTypes.length} results
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

export default PaymentTypeMasterPage;
