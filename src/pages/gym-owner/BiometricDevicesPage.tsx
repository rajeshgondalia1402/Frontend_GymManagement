import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Wifi,
  WifiOff,
  Fingerprint,
  DoorOpen,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { biometricDeviceService } from '@/services/attendance.service';
import { toast } from '@/hooks/use-toast';
import type { BiometricDevice, DeviceType, DoorLockType } from '@/types';

const deviceSchema = z.object({
  deviceName: z.string().min(1, 'Device name is required').max(100),
  deviceSerial: z.string().min(1, 'Serial number is required').max(100),
  deviceModel: z.string().min(1, 'Device model is required').max(100),
  deviceType: z.enum(['FINGERPRINT', 'FINGERPRINT_DOOR', 'FACE', 'IRIS']).default('FINGERPRINT'),
  vendorId: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  productId: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  ipAddress: z.string().optional(),
  port: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  doorLockType: z.enum(['NONE', 'USB_RELAY', 'SMART_LOCK_API', 'ESP32_HTTP', 'ZKTECO_DEVICE']).default('NONE'),
  location: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

const DEVICE_TYPES: { value: DeviceType; label: string }[] = [
  { value: 'FINGERPRINT', label: 'Fingerprint Scanner' },
  { value: 'FINGERPRINT_DOOR', label: 'Fingerprint + Door Lock' },
  { value: 'FACE', label: 'Face Recognition' },
  { value: 'IRIS', label: 'Iris Scanner' },
];

const DOOR_LOCK_TYPES: { value: DoorLockType; label: string }[] = [
  { value: 'NONE', label: 'No Door Lock' },
  { value: 'USB_RELAY', label: 'USB Relay Module' },
  { value: 'SMART_LOCK_API', label: 'Smart Lock (API)' },
  { value: 'ESP32_HTTP', label: 'ESP32/Arduino (HTTP)' },
  { value: 'ZKTECO_DEVICE', label: 'ZKTeco Device' },
];

export function BiometricDevicesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<BiometricDevice | null>(null);
  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['biometric-devices', page, debouncedSearch],
    queryFn: () => biometricDeviceService.getAll({ page, limit: 10, search: debouncedSearch }),
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      deviceType: 'FINGERPRINT',
      doorLockType: 'NONE',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    watch: watchEdit,
    formState: { errors: errorsEdit },
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
  });

  const createMutation = useMutation({
    mutationFn: biometricDeviceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Device registered successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to register device';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => biometricDeviceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      setEditDialogOpen(false);
      setSelectedDevice(null);
      resetEdit();
      toast({ title: 'Device updated successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update device';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: biometricDeviceService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      setDeleteDialogOpen(false);
      setSelectedDevice(null);
      toast({ title: 'Device deleted successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete device';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const testMutation = useMutation({
    mutationFn: biometricDeviceService.testConnection,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      toast({
        title: data.isOnline ? 'Device is online' : 'Device is offline',
        variant: data.isOnline ? 'default' : 'destructive',
      });
    },
    onError: () => {
      toast({ title: 'Failed to test device connection', variant: 'destructive' });
    },
  });

  const onSubmit = (data: DeviceFormData) => {
    createMutation.mutate({
      deviceName: data.deviceName,
      deviceSerial: data.deviceSerial,
      deviceModel: data.deviceModel,
      deviceType: data.deviceType,
      vendorId: data.vendorId,
      productId: data.productId,
      ipAddress: data.ipAddress,
      port: data.port,
      doorLockType: data.doorLockType,
      location: data.location,
    });
  };

  const onEditSubmit = (data: DeviceFormData) => {
    if (selectedDevice) {
      updateMutation.mutate({
        id: selectedDevice.id,
        data: {
          deviceName: data.deviceName,
          deviceModel: data.deviceModel,
          deviceType: data.deviceType,
          vendorId: data.vendorId,
          productId: data.productId,
          ipAddress: data.ipAddress,
          port: data.port,
          doorLockType: data.doorLockType,
          location: data.location,
        },
      });
    }
  };

  const handleEdit = (device: BiometricDevice) => {
    setSelectedDevice(device);
    setValueEdit('deviceName', device.deviceName);
    setValueEdit('deviceSerial', device.deviceSerial);
    setValueEdit('deviceModel', device.deviceModel);
    setValueEdit('deviceType', device.deviceType);
    setValueEdit('vendorId', device.vendorId as any);
    setValueEdit('productId', device.productId as any);
    setValueEdit('ipAddress', device.ipAddress || '');
    setValueEdit('port', device.port as any);
    setValueEdit('doorLockType', device.doorLockType);
    setValueEdit('location', device.location || '');
    setEditDialogOpen(true);
  };

  const handleDelete = (device: BiometricDevice) => {
    setSelectedDevice(device);
    setDeleteDialogOpen(true);
  };

  const handleTest = (device: BiometricDevice) => {
    testMutation.mutate(device.id);
  };

  const devices = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load devices. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Fingerprint className="h-6 w-6" />
            Biometric Devices
          </h1>
          <p className="text-muted-foreground">Manage fingerprint scanners and door access devices</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {devices.filter(d => d.isOnline).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">With Door Lock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devices.filter(d => d.doorLockType !== 'NONE').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Devices Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-12">
              <Fingerprint className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No devices registered yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Device
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Door Lock</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{device.deviceName}</p>
                          <p className="text-sm text-muted-foreground">{device.deviceModel}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{device.deviceSerial}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {DEVICE_TYPES.find(t => t.value === device.deviceType)?.label || device.deviceType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {device.doorLockType !== 'NONE' ? (
                          <Badge variant="secondary" className="gap-1">
                            <DoorOpen className="h-3 w-3" />
                            {DOOR_LOCK_TYPES.find(t => t.value === device.doorLockType)?.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{device.location || '-'}</TableCell>
                      <TableCell>
                        {device.isOnline ? (
                          <Badge variant="default" className="bg-green-600 gap-1">
                            <Wifi className="h-3 w-3" />
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <WifiOff className="h-3 w-3" />
                            Offline
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleTest(device)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Test Connection
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(device)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(device)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
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

      {/* Add Device Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Register New Device</DialogTitle>
            <DialogDescription>Add a new biometric device to your gym</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name *</Label>
                <Input
                  id="deviceName"
                  placeholder="e.g., Front Desk Scanner"
                  {...register('deviceName')}
                />
                {errors.deviceName && (
                  <p className="text-sm text-destructive">{errors.deviceName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceSerial">Serial Number *</Label>
                <Input
                  id="deviceSerial"
                  placeholder="e.g., SG-12345"
                  {...register('deviceSerial')}
                />
                {errors.deviceSerial && (
                  <p className="text-sm text-destructive">{errors.deviceSerial.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceModel">Device Model *</Label>
                <Input
                  id="deviceModel"
                  placeholder="e.g., SecuGen Hamster Pro 20"
                  {...register('deviceModel')}
                />
                {errors.deviceModel && (
                  <p className="text-sm text-destructive">{errors.deviceModel.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Main Entrance"
                  {...register('location')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Device Type</Label>
                <Select
                  value={watch('deviceType')}
                  onValueChange={(value) => setValue('deviceType', value as DeviceType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Door Lock Type</Label>
                <Select
                  value={watch('doorLockType')}
                  onValueChange={(value) => setValue('doorLockType', value as DoorLockType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select door lock" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOOR_LOCK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendorId">USB Vendor ID</Label>
                <Input
                  id="vendorId"
                  type="number"
                  placeholder="e.g., 4450"
                  {...register('vendorId')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productId">USB Product ID</Label>
                <Input
                  id="productId"
                  type="number"
                  placeholder="e.g., 800"
                  {...register('productId')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ipAddress">IP Address (for network devices)</Label>
                <Input
                  id="ipAddress"
                  placeholder="e.g., 192.168.1.100"
                  {...register('ipAddress')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="e.g., 4370"
                  {...register('port')}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Spinner className="mr-2" /> : null}
                Register Device
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>Update device information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-deviceName">Device Name *</Label>
                <Input id="edit-deviceName" {...registerEdit('deviceName')} />
                {errorsEdit.deviceName && (
                  <p className="text-sm text-destructive">{errorsEdit.deviceName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-deviceSerial">Serial Number</Label>
                <Input id="edit-deviceSerial" disabled {...registerEdit('deviceSerial')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-deviceModel">Device Model *</Label>
                <Input id="edit-deviceModel" {...registerEdit('deviceModel')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input id="edit-location" {...registerEdit('location')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Device Type</Label>
                <Select
                  value={watchEdit('deviceType')}
                  onValueChange={(value) => setValueEdit('deviceType', value as DeviceType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Door Lock Type</Label>
                <Select
                  value={watchEdit('doorLockType')}
                  onValueChange={(value) => setValueEdit('doorLockType', value as DoorLockType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOOR_LOCK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Spinner className="mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedDevice?.deviceName}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedDevice && deleteMutation.mutate(selectedDevice.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Spinner className="mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BiometricDevicesPage;
