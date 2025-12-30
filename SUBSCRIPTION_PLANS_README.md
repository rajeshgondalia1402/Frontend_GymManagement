# Subscription Plans Page - Installation & Usage

## New Features Implemented

### 1. **Enhanced Form Fields**
- **Plan Category Dropdown**: Select from predefined categories (Basic, Standard, Premium, Duration-Based)
- **Plan Name**: Text input for specific plan name
- **Rich Text Description**: HTML editor with preview mode
- **Currency Selection**: Radio buttons for INR (₹) and USD ($)
- **Dynamic Price Input**: Label and placeholder changes based on selected currency
- **Duration**: Number input for days (30, 90, 180, 365)
- **Rich Text Features**: HTML editor for feature list (supports ul/li)
- **Active Status Toggle**: Switch to enable/disable plan

### 2. **Enhanced Table View**
- Sortable columns (Plan Name, Price, Duration, Created Date)
- Search functionality (search by name or duration)
- Toggle active/inactive directly from table
- Responsive design (hides on mobile)

### 3. **Card View**
- Mobile-friendly card layout
- Shows all plan details
- Edit and Toggle buttons
- Auto-switches to card view on small screens

### 4. **Responsive Design**
- Mobile-first approach
- Stack layout on mobile devices
- Full table on desktop
- Card fallback for mobile

## Installation Steps

### Step 1: Install Missing Dependencies

Run the following command or execute `install-deps.bat`:

```bash
npm install @radix-ui/react-switch @radix-ui/react-radio-group
```

Or simply double-click: `install-deps.bat`

### Step 2: Verify Installation

Check that these packages are installed:
- @radix-ui/react-switch
- @radix-ui/react-radio-group

### Step 3: Run Development Server

```bash
npm run dev
```

### Step 4: Access the Page

Navigate to: `/admin/subscription-plans`

## New Components Created

1. **Switch Component** (`src/components/ui/switch.tsx`)
   - Toggle switch for boolean values
   - Used for IsActive field

2. **Radio Group Component** (`src/components/ui/radio-group.tsx`)
   - Radio button group
   - Used for currency selection

3. **Rich Text Editor** (`src/components/ui/rich-text-editor.tsx`)
   - HTML editor with preview mode
   - Edit/Preview tabs
   - Used for Description and Features fields

## Usage Examples

### Creating a Plan

1. Click "Create Plan" button
2. Select plan category from dropdown
3. Enter plan name
4. Add description with HTML formatting (use Edit/Preview tabs)
5. Select currency (INR or USD)
6. Enter price amount
7. Enter duration in days
8. Add features with HTML (e.g., `<ul><li>Feature 1</li></ul>`)
9. Toggle Active status if needed
10. Click "Create Plan"

### Editing a Plan

1. Click "Edit" button on any plan
2. Modify fields as needed
3. Click "Update Plan"

### Toggle Active Status

- **From Table**: Click the toggle icon next to the plan
- **From Card**: Click "Activate" or "Deactivate" button
- **From Form**: Use the Active Status switch

### Searching Plans

- Type in the search box to filter by plan name or duration
- Results update automatically

### Sorting Plans

- Click column headers in table view to sort
- Click again to reverse sort order

### Switching Views

- Click "Table View" for desktop table layout
- Click "Card View" for card grid layout
- Mobile automatically shows cards

## HTML Formatting Examples

### Description Example:
```html
<p>This is a <strong>premium</strong> plan with unlimited access.</p>
<p>Perfect for large gyms and fitness centers.</p>
```

### Features Example:
```html
<ul>
  <li>Unlimited members</li>
  <li>Advanced analytics</li>
  <li>Priority support</li>
  <li>Custom branding</li>
</ul>
```

## API Integration Notes

The page expects the following API responses:

### Plan Object
```typescript
{
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: 'INR' | 'USD';
  durationDays: number;
  features: string; // HTML string
  isActive: boolean;
  createdAt: string;
}
```

### Required API Methods
- `adminService.getSubscriptionPlans()` - Fetch all plans
- `adminService.createSubscriptionPlan(data)` - Create new plan
- `adminService.updateSubscriptionPlan(id, data)` - Update existing plan

## Troubleshooting

### If dependencies fail to install:
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install`
4. Run `npm install @radix-ui/react-switch @radix-ui/react-radio-group`

### If TypeScript errors appear:
1. Restart TypeScript server in your editor
2. Run `npm run build` to check for actual errors

### If styles are broken:
1. Ensure Tailwind CSS is properly configured
2. Check that all component imports are correct

## Mobile Responsiveness Checklist

- ✅ Form stacks vertically on mobile
- ✅ Dialog scrolls on small screens
- ✅ Search bar and view switcher stack on mobile
- ✅ Table hidden on mobile (< 768px)
- ✅ Cards shown on mobile by default
- ✅ Buttons full-width on mobile
- ✅ Grid adapts from 1 → 2 → 3 columns based on screen size

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Add pagination for large plan lists
- Export plans to CSV/PDF
- Plan templates
- Bulk operations
- Plan usage analytics
- Plan comparison view
