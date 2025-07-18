"use client";

import { Button } from "@/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { useState } from "react";
import { RiSearchLine, RiRefreshLine, RiDownloadLine, RiExpandUpDownLine, RiTableLine, RiShareLine, RiShareCircleLine } from "@remixicon/react";
import { Input } from "@/components/input";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { useDatasets } from "@/hooks/use-datasets";
import { useDatasetContext } from "@/lib/dataset-context";
import { Badge } from "@/components/badge";
import { useEffect } from "react";

export default function TablePage() {
  // Use the datasets context instead of hook directly
  const { 
    datasets, 
    isLoading, 
    error, 
    refreshDatasets, 
    exportDatabase 
  } = useDatasetContext();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  
  // Refresh datasets when component mounts or when user navigates to this page
  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);
  
  // Filter datasets based on search term
  const filteredDatasets = datasets.filter(dataset => 
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get the selected dataset for detailed view
  const selectedDataset = datasets.find(d => d.id === selectedTable);
  
  // Toggle table expansion
  const toggleTableExpansion = (tableId: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId);
    } else {
      newExpanded.add(tableId);
    }
    setExpandedTables(newExpanded);
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshDatasets();
    } catch (error) {
      console.error('Failed to refresh datasets:', error);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      await exportDatabase();
    } catch (error) {
      console.error('Failed to export database:', error);
    }
  };

  // Handle export with specific format
  const handleExportFormat = async (format: 'csv' | 'json' | 'db' | 'xlsx') => {
    try {
      if (format === 'json') {
        // Use existing JSON export
        await exportDatabase();
        return;
      }

      // For other formats, we'll convert the JSON data
      if (datasets.length === 0) {
        console.error('No datasets to export');
        return;
      }

      switch (format) {
        case 'csv':
          await exportAsCSV();
          break;
        case 'xlsx':
          await exportAsXLSX();
          break;
        case 'db':
          await exportAsDB();
          break;
      }
    } catch (error) {
      console.error(`Failed to export as ${format}:`, error);
    }
  };

  // Export as CSV
  const exportAsCSV = async () => {
    let csvContent = '';
    
    datasets.forEach((dataset, datasetIndex) => {
      if (datasetIndex > 0) csvContent += '\n\n';
      csvContent += `# Dataset: ${dataset.name}\n`;
      
      if (dataset.data && dataset.data.length > 0) {
        const headers = Object.keys(dataset.data[0]);
        csvContent += headers.join(',') + '\n';
        
        dataset.data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          });
          csvContent += values.join(',') + '\n';
        });
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `datasets_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export as XLSX (we'll create a simple tab-separated format that Excel can open)
  const exportAsXLSX = async () => {
    let xlsxContent = '';
    
    datasets.forEach((dataset, datasetIndex) => {
      if (datasetIndex > 0) xlsxContent += '\n\n';
      xlsxContent += `Dataset: ${dataset.name}\n`;
      
      if (dataset.data && dataset.data.length > 0) {
        const headers = Object.keys(dataset.data[0]);
        xlsxContent += headers.join('\t') + '\n';
        
        dataset.data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            return value === null || value === undefined ? '' : String(value);
          });
          xlsxContent += values.join('\t') + '\n';
        });
      }
    });

    const blob = new Blob([xlsxContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `datasets_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
  };

  // Export as DB (SQL format)
  const exportAsDB = async () => {
    let sqlContent = '-- Database Export\n-- Generated on ' + new Date().toISOString() + '\n\n';
    
    datasets.forEach(dataset => {
      sqlContent += `-- Table: ${dataset.name}\n`;
      sqlContent += `DROP TABLE IF EXISTS \`${dataset.name}\`;\n`;
      
      if (dataset.data && dataset.data.length > 0) {
        const headers = Object.keys(dataset.data[0]);
        
        // Create table
        sqlContent += `CREATE TABLE \`${dataset.name}\` (\n`;
        const columnDefinitions = headers.map(header => `  \`${header}\` TEXT`);
        sqlContent += columnDefinitions.join(',\n');
        sqlContent += '\n);\n\n';
        
        // Insert data
        dataset.data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return 'NULL';
            const stringValue = String(value);
            return `'${stringValue.replace(/'/g, "''")}'`;
          });
          sqlContent += `INSERT INTO \`${dataset.name}\` (${headers.map(h => `\`${h}\``).join(', ')}) VALUES (${values.join(', ')});\n`;
        });
        
        sqlContent += '\n';
      }
    });

    const blob = new Blob([sqlContent], { type: 'application/sql;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `datasets_export_${new Date().toISOString().split('T')[0]}.sql`;
    link.click();
  };

  // Render table content (preview or full view)
  const renderTableContent = (dataset: any, isExpanded: boolean) => {
    if (!dataset.data || !Array.isArray(dataset.data) || dataset.data.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded">
          No data available
        </div>
      );
    }

    const headers = Object.keys(dataset.data[0]);
    const displayData = isExpanded ? dataset.data : dataset.data.slice(0, 5);

    return (
      <div className="mt-4 border rounded-lg overflow-hidden bg-white">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              {isExpanded ? 'Complete Table Data' : 'Table Content Preview'}
            </h4>
            <Badge variant="secondary" className="text-xs">
              {isExpanded ? `${dataset.data.length} rows` : `${Math.min(5, dataset.data.length)} of ${dataset.data.length} rows`}
            </Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {headers.map((header) => (
                  <TableHead key={header} className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-50">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
                {displayData.map((row: Record<string, unknown>, index: number) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  {headers.map((header: string) => (
                  <TableCell key={header} className="px-4 py-2 text-sm border-r last:border-r-0">
                    {row[header] !== null && row[header] !== undefined ? String(row[header]) : '-'}
                  </TableCell>
                  ))}
                </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        {!isExpanded && dataset.data.length > 5 && (
          <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600 border-t">
            Showing 5 of {dataset.data.length} rows
          </div>
        )}
        {isExpanded && (
          <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600 border-t">
            Showing all {dataset.data.length} rows
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col flex-1 relative">
      {/* Page header - matching chat page header */}
      <div className="py-5 px-4 md:px-6 lg:px-8 bg-background sticky top-0 z-10 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06] shrink-0">
        <div className="flex items-center justify-between gap-2">
          <Breadcrumb>
            <BreadcrumbList className="sm:gap-1.5">
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Playground</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Dataset</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="text-xs"
              disabled={isLoading}
            >
              <RiRefreshLine className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={datasets.length === 0 || isLoading}
                >
                  <RiDownloadLine className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportFormat('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportFormat('json')}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportFormat('xlsx')}>
                  Export as XLSX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportFormat('db')}>
                  Export as SQL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 py-8 px-4 md:px-6 lg:px-8 bg-background relative overflow-auto scrollbar-thin">
        {/* Shadow on the right edge */}
        <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></div>
        
        <div className="max-w-[1400px] mx-auto">
          <div className="relative w-full max-w-md mb-6">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4" />
            <Input 
              className="pl-9 h-9 w-full border-gray-200" 
              placeholder="Search datasets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  Loading datasets...
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500">
                  Error: {error}
                  <br />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : filteredDatasets.length > 0 ? (
              filteredDatasets.map((dataset) => (
                <div key={dataset.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-200">
                  {/* Dataset Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                    onClick={() => toggleTableExpansion(dataset.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <RiTableLine className="w-5 h-5 text-gray-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{dataset.name}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-500">{dataset.rows.toLocaleString()} rows</span>
                            <span className="text-sm text-gray-500">Last modified: {dataset.lastModified}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {dataset.rows.toLocaleString()} records
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {expandedTables.has(dataset.id) ? 'Click to collapse' : 'Click to view all rows'}
                        </div>
                        <RiExpandUpDownLine 
                          className={`w-4 h-4 text-gray-600 transition-transform ${
                            expandedTables.has(dataset.id) ? 'rotate-180' : ''
                          }`} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Single Table - Preview or Full based on expansion state */}
                  <div className="border-t">
                    <div className="p-4">
                      {expandedTables.has(dataset.id) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 text-blue-800">
                            <RiTableLine className="w-4 h-4" />
                            <span className="text-sm font-medium">Full Dataset View</span>
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              {dataset.data?.length || 0} total rows
                            </Badge>
                          </div>
                        </div>
                      )}
                      {renderTableContent(dataset, expandedTables.has(dataset.id))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  No datasets found
                  {searchTerm && (
                    <div className="mt-1 text-sm">
                      Try adjusting your search terms
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 