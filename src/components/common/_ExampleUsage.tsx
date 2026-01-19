/**
 * Example: How to use Common Components
 * 
 * This file demonstrates the recommended patterns for using the common component
 * abstraction layer. Copy these patterns when building new features.
 * 
 * NOTE: This is a reference file - DO NOT import this in your routes.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';

// ✅ Import from common - this is the recommended pattern
import {
  AppButton,
  AppInput,
  AppSelect,
  AppModal,
  AppTable,
  StatusBadge,
  ActionMenu,
  ConfirmDialog,
  AppCard,
  AppCardHeader,
  AppCardContent,
} from '@/components/common';

// Types
interface ExampleMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'expired';
  membershipEnd: string;
}

// Form schema
const memberSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  status: z.string(),
});

type MemberFormData = z.infer<typeof memberSchema>;

/**
 * Example page using common components
 */
export function ExampleMembersPage() {
  // State
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
  });

  // Mock query - replace with actual API call
  const { data, isLoading } = useQuery({
    queryKey: ['example-members', statusFilter],
    queryFn: async (): Promise<ExampleMember[]> => {
      // Replace with actual API call
      return [];
    },
  });

  // Mock mutation - replace with actual API call
  const createMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      // Replace with actual API call
      console.log('Creating member:', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['example-members'] });
      setModalOpen(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Replace with actual API call
      console.log('Deleting member:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['example-members'] });
      setConfirmDelete(false);
      setSelectedId(null);
    },
  });

  // Handlers
  const onSubmit = (data: MemberFormData) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    setSelectedId(id);
    setConfirmDelete(true);
  };

  const confirmDeleteAction = () => {
    if (selectedId) {
      deleteMutation.mutate(selectedId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage gym members</p>
        </div>

        {/* ✅ AppButton with loading state and icon */}
        <AppButton leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
          Add Member
        </AppButton>
      </div>

      {/* Filters Card */}
      <AppCard>
        <AppCardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* ✅ AppInput with icon */}
            <AppInput
              placeholder="Search members..."
              leftIcon={<Search className="h-4 w-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              containerClassName="flex-1 max-w-sm"
            />

            {/* ✅ AppSelect with options array */}
            <AppSelect
              placeholder="All Status"
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'expired', label: 'Expired' },
              ]}
              className="w-[150px]"
            />
          </div>
        </AppCardHeader>

        <AppCardContent>
          {/* ✅ AppTable with responsive design */}
          <AppTable
            data={data || []}
            loading={isLoading}
            getRowKey={(member) => member.id}
            emptyMessage="No members found"
            emptyDescription="Click 'Add Member' to create your first member"
            mobileBreakpoint="md"
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (member) => (
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground md:hidden">{member.email}</p>
                  </div>
                ),
              },
              {
                key: 'email',
                header: 'Email',
                hideOnMobile: true,
              },
              {
                key: 'phone',
                header: 'Phone',
                hideOnMobile: true,
              },
              {
                key: 'status',
                header: 'Status',
                render: (member) => (
                  // ✅ StatusBadge - auto picks color and label
                  <StatusBadge status={member.status} />
                ),
              },
              {
                key: 'actions',
                header: '',
                width: '50px',
                render: (member) => (
                  // ✅ ActionMenu - simplified dropdown
                  <ActionMenu
                    items={[
                      {
                        label: 'View Details',
                        icon: <Eye className="h-4 w-4" />,
                        onClick: () => console.log('View:', member.id),
                      },
                      {
                        label: 'Edit',
                        icon: <Edit className="h-4 w-4" />,
                        onClick: () => console.log('Edit:', member.id),
                      },
                      {
                        label: 'Delete',
                        icon: <Trash2 className="h-4 w-4" />,
                        onClick: () => handleDelete(member.id),
                        destructive: true,
                        separator: true,
                      },
                    ]}
                  />
                ),
              },
            ]}
            // Mobile card view
            renderMobileCard={(member) => (
              <AppCard className="p-4" hoverable>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <p className="text-sm text-muted-foreground">{member.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={member.status} size="sm" />
                    <ActionMenu
                      items={[
                        { label: 'View', icon: <Eye className="h-4 w-4" />, onClick: () => {} },
                        { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, onClick: () => handleDelete(member.id), destructive: true },
                      ]}
                    />
                  </div>
                </div>
              </AppCard>
            )}
          />
        </AppCardContent>
      </AppCard>

      {/* ✅ AppModal - simplified dialog */}
      <AppModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Add New Member"
        description="Fill in the member details below"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ✅ AppInput with label and error */}
          <AppInput
            label="Full Name"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <AppInput
            label="Email"
            type="email"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <AppInput label="Phone" {...register('phone')} />

          <AppSelect
            label="Status"
            value="active"
            onValueChange={() => {}}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-4">
            <AppButton variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" loading={createMutation.isPending} loadingText="Creating...">
              Create Member
            </AppButton>
          </div>
        </form>
      </AppModal>

      {/* ✅ ConfirmDialog - for delete confirmation */}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete Member"
        description="Are you sure you want to delete this member? This action cannot be undone."
        variant="destructive"
        confirmText="Delete"
        onConfirm={confirmDeleteAction}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

export default ExampleMembersPage;
