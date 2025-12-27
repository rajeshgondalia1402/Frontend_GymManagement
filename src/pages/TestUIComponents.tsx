import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { downloadCsv, downloadPdfTable, convertToTableRows } from '@/lib/exportHelpers';
import { Download, FileSpreadsheet } from 'lucide-react';

// Sample data for testing
const sampleMembers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'Active', membershipEnd: '2024-12-31' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'Active', membershipEnd: '2024-11-30' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'Expired', membershipEnd: '2024-01-15' },
  { id: '4', name: 'Alice Williams', email: 'alice@example.com', status: 'Active', membershipEnd: '2025-03-20' },
];

export function TestUIComponents() {
  const handleExportCsv = () => {
    downloadCsv(sampleMembers, 'members-export.csv');
  };

  const handleExportPdf = () => {
    const columns = ['ID', 'Name', 'Email', 'Status', 'Membership End'];
    const rows = convertToTableRows(sampleMembers, ['id', 'name', 'email', 'status', 'membershipEnd']);
    downloadPdfTable(columns, rows, 'members-export.pdf', 'Members List');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">UI Components Test Page</h1>
          <p className="text-gray-600 mt-2">
            This page demonstrates the UI components and export functionality
          </p>
        </div>

        {/* Buttons Card */}
        <Card>
          <CardHeader>
            <CardTitle>Button Components</CardTitle>
            <CardDescription>Various button styles and variants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button>Default Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardContent>
        </Card>

        {/* Badges Card */}
        <Card>
          <CardHeader>
            <CardTitle>Badge Components</CardTitle>
            <CardDescription>Status and label badges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
            <CardDescription>Input fields and labels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table and Export Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Table Component with Export</CardTitle>
                <CardDescription>Sample member data with CSV and PDF export functionality</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleExportCsv} variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={handleExportPdf} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>A list of sample gym members</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Membership End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.id}</TableCell>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'Active' ? 'default' : 'destructive'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{member.membershipEnd}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Export Instructions Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Export Functionality Test</CardTitle>
            <CardDescription className="text-blue-700">
              Click the export buttons above to test the PDF and CSV export features
            </CardDescription>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-2">
            <p><strong>CSV Export:</strong> Downloads the table data as a CSV file that can be opened in Excel or Google Sheets.</p>
            <p><strong>PDF Export:</strong> Generates a formatted PDF document with the table data.</p>
            <p className="text-sm text-blue-600 mt-4">
              These export functions are available in <code className="bg-blue-100 px-2 py-1 rounded">src/lib/exportHelpers.ts</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
