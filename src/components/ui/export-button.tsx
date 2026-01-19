import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { downloadCsv, downloadXls } from '@/lib/exportHelpers';

export interface ExportColumn {
    key: string;
    label: string;
    format?: (value: any, row: any) => string;
}

export interface ExportButtonProps {
    data: Array<Record<string, any>>;
    filename?: string;
    columns?: ExportColumn[];
    className?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    disabled?: boolean;
}

/**
 * Reusable Export Button Component
 * Supports CSV and XLS file downloads
 * 
 * Usage:
 * <ExportButton 
 *   data={members} 
 *   filename="members" 
 *   columns={[
 *     { key: 'firstName', label: 'First Name' },
 *     { key: 'lastName', label: 'Last Name' },
 *     { key: 'email', label: 'Email' },
 *     { key: 'phone', label: 'Phone' },
 *     { key: 'finalFees', label: 'Final Fees', format: (v) => `₹${v}` }
 *   ]}
 * />
 */
export function ExportButton({
    data,
    filename = 'export',
    columns,
    className,
    variant = 'outline',
    size = 'sm',
    disabled = false,
}: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const prepareExportData = () => {
        if (!data || data.length === 0) return [];

        // If columns are specified, use them to format data
        if (columns && columns.length > 0) {
            return data.map((row) => {
                const exportRow: Record<string, any> = {};
                columns.forEach((col) => {
                    const value = row[col.key];
                    exportRow[col.label] = col.format ? col.format(value, row) : value;
                });
                return exportRow;
            });
        }

        // Otherwise, export all fields
        return data;
    };

    const handleExport = async (type: 'csv' | 'xls') => {
        setIsExporting(true);
        try {
            const exportData = prepareExportData();
            const timestamp = new Date().toISOString().split('T')[0];
            const fullFilename = `${filename}_${timestamp}`;

            if (type === 'csv') {
                downloadCsv(exportData, `${fullFilename}.csv`);
            } else {
                downloadXls(exportData, `${fullFilename}.xls`);
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const hasData = data && data.length > 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className={cn('gap-1', className)}
                    disabled={disabled || isExporting || !hasData}
                >
                    <Download className="h-4 w-4" />
                    {size !== 'icon' && (
                        <>
                            <span>Export</span>
                            <ChevronDown className="h-3 w-3" />
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span>Download CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xls')} className="gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    <span>Download Excel</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
