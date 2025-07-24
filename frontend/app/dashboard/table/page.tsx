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
import { useState, useCallback, useMemo } from "react";
import { RiSearchLine, RiRefreshLine, RiDownloadLine, RiExpandUpDownLine, RiTableLine, RiShareLine, RiShareCircleLine, RiLoader4Line } from "@remixicon/react";
import { Input } from "@/components/input";
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
import { useDatasetContext } from "@/lib/dataset-context";
import { Badge } from "@/components/badge";
import { useEffect } from "react";

// Progressive loading configuration
const INITIAL_BATCH_SIZE = 100;
const LOAD_MORE_BATCH_SIZE = 200;
const LOAD_MORE_THRESHOLD = 10; // Load more when user is within 10 rows of the bottom

interface ProgressiveTableState {
  isLoading: boolean;
  displayedRows: number;
  hasMore: boolean;
}

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
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  
  // Progressive loading state for each table
  const [progressiveStates, setProgressiveStates] = useState<Record<string, ProgressiveTableState>>({});
  
  // Refresh datasets when component mounts or when user navigates to this page
  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);
  
  // Filter datasets based on search term
  const filteredDatasets = datasets.filter(dataset => 
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize progressive state for a table
  const initializeProgressiveState = useCallback((tableId: string, totalRows: number) => {
    setProgressiveStates(prev => ({
      ...prev,
      [tableId]: {
        isLoading: false,
        displayedRows: Math.min(INITIAL_BATCH_SIZE, totalRows),
        hasMore: totalRows > INITIAL_BATCH_SIZE
      }
    }));
  }, []);

  // Load more rows for a specific table
  const loadMoreRows = useCallback((tableId: string, totalRows: number) => {
    setProgressiveStates(prev => {
      const currentState = prev[tableId];
      if (!currentState || currentState.isLoading || !currentState.hasMore) {
        return prev;
      }

      const newDisplayedRows = Math.min(
        currentState.displayedRows + LOAD_MORE_BATCH_SIZE,
        totalRows
      );

      return {
        ...prev,
        [tableId]: {
          ...currentState,
          isLoading: true,
          displayedRows: newDisplayedRows,
          hasMore: newDisplayedRows < totalRows
        }
      };
    });

    // Simulate async loading with setTimeout to prevent UI blocking
    setTimeout(() => {
      setProgressiveStates(prev => ({
        ...prev,
        [tableId]: {
          ...prev[tableId],
          isLoading: false
        }
      }));
    }, 100);
  }, []);

  // Toggle table expansion
  const toggleTableExpansion = (tableId: string) => {
    const newExpanded = new Set(expandedTables);
    const dataset = datasets.find(d => d.id === tableId);
    
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId);
      // Clear progressive state when collapsing
      setProgressiveStates(prev => {
        const newState = { ...prev };
        delete newState[tableId];
        return newState;
      });
    } else {
      newExpanded.add(tableId);
      // Initialize progressive loading when expanding
      if (dataset && dataset.data) {
        initializeProgressiveState(tableId, dataset.data.length);
      }
    }
    setExpandedTables(newExpanded);
  };


  
  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshDatasets();
      // Clear progressive states on refresh
      setProgressiveStates({});
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

  // Render table content (preview or progressive loading for full view)
  const renderTableContent = (dataset: any, isExpanded: boolean) => {
    if (!dataset.data || !Array.isArray(dataset.data) || dataset.data.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded">
          No data available
        </div>
      );
    }

    const headers = Object.keys(dataset.data[0]);
    const totalRows = dataset.data.length;
    
    if (!isExpanded) {
      // Preview mode - show first 5 rows
      const displayData = dataset.data.slice(0, 5);
      
      return (
        <div className="mt-4 border rounded-lg bg-white overflow-hidden max-w-full">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Table Content Preview</h4>
              <Badge variant="secondary" className="text-xs select-none">
                {Math.min(5, totalRows)} of {totalRows} rows
              </Badge>
            </div>
          </div>
          <div className="overflow-x-auto max-w-full custom-scrollbar">
            <table className="text-sm" style={{minWidth: '100%', width: 'max-content'}}>
              <thead>
                <tr className="bg-gray-50 border-b">
                  {headers.map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap min-w-[120px]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayData.map((row: Record<string, unknown>, index: number) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    {headers.map((header: string) => (
                      <td key={header} className="px-4 py-3 text-sm border-r last:border-r-0 min-w-[120px]">
                        <div className="whitespace-nowrap">
                          {row[header] !== null && row[header] !== undefined ? String(row[header]) : '-'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600 border-t select-none">
            Showing 5 of {totalRows} rows
          </div>
        </div>
      );
    }

    // Expanded mode - progressive loading
    const progressiveState = progressiveStates[dataset.id];
    const displayedRowCount = progressiveState?.displayedRows || INITIAL_BATCH_SIZE;
    const displayData = dataset.data.slice(0, displayedRowCount);
    const hasMore = progressiveState?.hasMore ?? (totalRows > INITIAL_BATCH_SIZE);
    const isLoadingMore = progressiveState?.isLoading ?? false;

    return (
      <div className="mt-4 border rounded-lg bg-white overflow-hidden max-w-full">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Complete Table Data</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs select-none">
                {displayedRowCount} of {totalRows} rows loaded
              </Badge>
              {isLoadingMore && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <RiLoader4Line className="w-3 h-3 animate-spin" />
                  Loading...
                </div>
              )}
            </div>
          </div>
        </div>
                          <div className="overflow-x-auto max-w-full custom-scrollbar">
           <table className="text-sm" style={{minWidth: '100%', width: 'max-content'}}>
             <thead className="bg-gray-50">
              <tr className="border-b">
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap min-w-[120px]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row: Record<string, unknown>, index: number) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  {headers.map((header: string) => (
                    <td key={header} className="px-4 py-3 text-sm border-r last:border-r-0 min-w-[120px]">
                      <div className="whitespace-nowrap">
                        {row[header] !== null && row[header] !== undefined ? String(row[header]) : '-'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Loading indicator at bottom */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-4 bg-gray-50 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RiLoader4Line className="w-4 h-4 animate-spin" />
                Loading more rows...
              </div>
            </div>
          )}
          
          {/* Load more button for manual loading */}
          {hasMore && !isLoadingMore && (
            <div className="flex items-center justify-center py-4 bg-gray-50 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMoreRows(dataset.id, totalRows)}
                className="text-xs"
              >
                Load More Rows ({Math.min(LOAD_MORE_BATCH_SIZE, totalRows - displayedRowCount)} more)
              </Button>
            </div>
          )}
          
          {/* End indicator */}
          {!hasMore && !isLoadingMore && displayedRowCount === totalRows && (
            <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600 border-t select-none">
              Showing all {totalRows} rows
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex-1 w-0 shadow-md md:rounded-s-[inherit] min-[1024px]:rounded-e-3xl bg-background flex flex-col h-full overflow-hidden">
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
        
        <div className="max-w-full mx-auto min-w-0">
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
              filteredDatasets.map((dataset) => {
                const progressiveState = progressiveStates[dataset.id];
                const isExpanded = expandedTables.has(dataset.id);
                const displayInfo = isExpanded && progressiveState 
                  ? `${progressiveState.displayedRows} of ${dataset.rows.toLocaleString()} loaded`
                  : `${dataset.rows.toLocaleString()} records`;

                return (
                  <div key={dataset.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 min-w-0 max-w-full">
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
                              <span className="text-sm text-gray-500 select-none">{dataset.rows.toLocaleString()} rows</span>
                              <span className="text-sm text-gray-500">Last modified: {dataset.lastModified}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs select-none">
                            {displayInfo}
                          </Badge>
                          {isExpanded && progressiveState?.isLoading && (
                            <RiLoader4Line className="w-4 h-4 animate-spin text-blue-600" />
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-500 select-none">
                            {isExpanded ? 'Click to collapse' : 'Click to view all rows'}
                          </div>
                          <RiExpandUpDownLine 
                            className={`w-4 h-4 text-gray-600 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`} 
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Single Table - Preview or Progressive Loading based on expansion state */}
                    <div className="border-t">
                      <div className="p-4 min-w-0 max-w-full overflow-hidden">
                        {isExpanded && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 text-blue-800">
                              <RiTableLine className="w-4 h-4" />
                              <span className="text-sm font-medium">Full Dataset View</span>
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 select-none">
                                {progressiveState?.displayedRows || INITIAL_BATCH_SIZE} of {dataset.data?.length || 0} rows loaded
                              </Badge>
                                                             {dataset.data && dataset.data.length > 1000 && (
                                 <span className="text-xs text-blue-600">
                                   • Click "Load More" to view additional rows
                                 </span>
                               )}
                            </div>
                          </div>
                        )}
                        {renderTableContent(dataset, isExpanded)}
                      </div>
                    </div>
                  </div>
                );
              })
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