# shadcn/ui Migration Guide

## Overview

This document describes the safe migration from direct Radix UI usage to shadcn/ui with Tailwind CSS in the Gym Management Frontend.

## Architecture

```
src/
├── components/
│   ├── ui/              # shadcn/ui primitives (DO NOT import directly in pages)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── common/          # Abstraction layer (IMPORT FROM HERE)
│   │   ├── AppButton.tsx
│   │   ├── AppInput.tsx
│   │   ├── AppModal.tsx
│   │   ├── AppSelect.tsx
│   │   ├── AppTable.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── ActionMenu.tsx
│   │   ├── FormField.tsx
│   │   ├── AppCard.tsx
│   │   └── index.ts
│   └── layout/          # Layout components
└── pages/               # Feature pages (import from common/)
```

## Migration Rules

### ✅ DO

1. **Import from `@/components/common`** for new features
2. **Wrap existing shadcn usage** when making changes
3. **Use Tailwind utility classes** for styling
4. **Keep existing page logic intact** - only change imports

### ❌ DON'T

1. **Don't import from `@/components/ui` directly** in pages
2. **Don't modify existing business logic**
3. **Don't remove Radix UI** - shadcn uses it internally
4. **Don't change routing or page structure**

## Component Mapping

| Old Pattern | New Common Component |
|-------------|---------------------|
| `<Button>` from ui | `<AppButton>` from common |
| `<Input>` + `<Label>` | `<AppInput label="...">` |
| `<Dialog>` + subcomponents | `<AppModal>` |
| `<Select>` + subcomponents | `<AppSelect options={[...]} />` |
| `<Badge>` for status | `<StatusBadge status="active" />` |
| `<Table>` + subcomponents | `<AppTable columns={[...]} data={[...]} />` |
| `<DropdownMenu>` for actions | `<ActionMenu items={[...]} />` |
| Custom delete confirm | `<ConfirmDialog variant="destructive" />` |

## Usage Examples

### 1. AppButton (replaces Button)

```tsx
// Before
import { Button } from '@/components/ui/button';
<Button disabled={isLoading}>
  {isLoading ? 'Creating...' : 'Create Member'}
</Button>

// After
import { AppButton } from '@/components/common';
<AppButton loading={isLoading} loadingText="Creating...">
  Create Member
</AppButton>
```

### 2. AppInput (replaces Input + Label)

```tsx
// Before
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
<div>
  <Label htmlFor="email">Email *</Label>
  <Input id="email" {...register('email')} />
  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
</div>

// After
import { AppInput } from '@/components/common';
<AppInput
  label="Email"
  required
  error={errors.email?.message}
  {...register('email')}
/>
```

### 3. AppModal (replaces Dialog)

```tsx
// Before
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add New Member</DialogTitle>
    </DialogHeader>
    <form>...</form>
  </DialogContent>
</Dialog>

// After
import { AppModal } from '@/components/common';
<AppModal
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  title="Add New Member"
>
  <form>...</form>
</AppModal>
```

### 4. AppSelect (replaces Select)

```tsx
// Before
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
<Select value={statusFilter} onValueChange={setStatusFilter}>
  <SelectTrigger className="w-[150px]">
    <SelectValue placeholder="All Status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Status</SelectItem>
    <SelectItem value="active">Active</SelectItem>
    <SelectItem value="expired">Expired</SelectItem>
  </SelectContent>
</Select>

// After
import { AppSelect } from '@/components/common';
<AppSelect
  placeholder="All Status"
  value={statusFilter}
  onValueChange={setStatusFilter}
  options={[
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
  ]}
  className="w-[150px]"
/>
```

### 5. StatusBadge (replaces Badge for status)

```tsx
// Before
import { Badge } from '@/components/ui/badge';
<Badge variant={status === 'active' ? 'default' : 'destructive'}>
  {status === 'active' ? 'Active' : 'Expired'}
</Badge>

// After
import { StatusBadge } from '@/components/common';
<StatusBadge status={status} /> // Automatically picks correct variant and label
```

### 6. ActionMenu (replaces DropdownMenu)

```tsx
// Before
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><MoreVertical /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleView}><Eye /> View</DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete} className="text-red-600"><Trash2 /> Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// After
import { ActionMenu } from '@/components/common';
<ActionMenu
  items={[
    { label: 'View', icon: <Eye className="h-4 w-4" />, onClick: handleView },
    { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true },
  ]}
/>
```

### 7. ConfirmDialog (for delete confirmations)

```tsx
// Before
if (confirm('Are you sure you want to delete?')) {
  deleteMutation.mutate(id);
}

// After
import { ConfirmDialog } from '@/components/common';
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deleteId, setDeleteId] = useState<string | null>(null);

<ConfirmDialog
  open={showDeleteConfirm}
  onOpenChange={setShowDeleteConfirm}
  title="Delete Member"
  description="This action cannot be undone. Are you sure?"
  variant="destructive"
  confirmText="Delete"
  onConfirm={() => {
    deleteMutation.mutate(deleteId);
    setShowDeleteConfirm(false);
  }}
  loading={deleteMutation.isPending}
/>
```

### 8. AppTable (responsive table)

```tsx
import { AppTable, StatusBadge, ActionMenu } from '@/components/common';

<AppTable
  data={members}
  getRowKey={(member) => member.id}
  loading={isLoading}
  emptyMessage="No members found"
  columns={[
    {
      key: 'name',
      header: 'Name',
      render: (member) => member.user?.name || 'Unknown',
    },
    {
      key: 'email',
      header: 'Email',
      hideOnMobile: true,
      render: (member) => member.user?.email,
    },
    {
      key: 'status',
      header: 'Status',
      render: (member) => <StatusBadge status={getMemberStatus(member)} />,
    },
    {
      key: 'actions',
      header: '',
      width: '50px',
      render: (member) => (
        <ActionMenu
          items={[
            { label: 'View', icon: <Eye />, onClick: () => navigate(`/member/${member.id}`) },
            { label: 'Delete', icon: <Trash2 />, onClick: () => handleDelete(member.id), destructive: true },
          ]}
        />
      ),
    },
  ]}
/>
```

## Responsive Design Patterns

### Mobile-first Breakpoints

```tsx
// Tailwind breakpoints
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px

// Example: Stack on mobile, side-by-side on desktop
<div className="flex flex-col md:flex-row gap-4">
  <AppInput label="First Name" />
  <AppInput label="Last Name" />
</div>

// Example: Hide on mobile
<TableHead className="hidden md:table-cell">Email</TableHead>

// Example: Different sizes
<AppButton size="sm" className="md:size-default">Add</AppButton>
```

### Responsive Table with Mobile Cards

```tsx
<AppTable
  data={members}
  columns={columns}
  getRowKey={(m) => m.id}
  mobileBreakpoint="md"
  renderMobileCard={(member) => (
    <AppCard className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{member.name}</p>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
        <StatusBadge status={member.status} />
      </div>
    </AppCard>
  )}
/>
```

## Incremental Migration Strategy

1. **Phase 1: New Features** - Use common components for all new pages
2. **Phase 2: High-traffic Pages** - Migrate dashboards and member lists
3. **Phase 3: Forms** - Update form inputs to use AppInput/FormField
4. **Phase 4: Remaining Pages** - Complete migration of remaining pages

## Existing Pages (DO NOT MODIFY)

The following pages are working and should NOT be changed unless necessary:

- All pages in `src/pages/` continue using direct ui/ imports
- Business logic, hooks, services remain unchanged
- Routing in `src/routes/` remains unchanged
- Auth flow in `src/store/authStore.ts` remains unchanged

## Testing Checklist

After migration:
- [ ] All forms submit correctly
- [ ] All modals open/close properly
- [ ] Tables display and paginate correctly
- [ ] Status badges show correct colors
- [ ] Actions (Edit, Delete, View) work
- [ ] Mobile responsiveness is maintained
- [ ] No console errors
- [ ] TypeScript compiles without errors

## Dependencies

Already installed (no action needed):
- tailwindcss (configured)
- @radix-ui/* (used internally by shadcn)
- class-variance-authority
- clsx
- tailwind-merge
- lucide-react

## Support

For questions about this migration:
1. Check this guide first
2. Look at existing common components for patterns
3. Compare with working pages (MembersPage, TrainersPage)
