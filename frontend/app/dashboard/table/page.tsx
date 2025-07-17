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
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useDatasets } from "@/hooks/use-datasets";
import { Badge } from "@/components/badge";

export default function TablePage() {
  // Use the datasets hook instead of mock data
  const { 
    datasets, 
    isLoading, 
    error, 
    refreshDatasets, 
    clearAllDatasets, 
    exportDatabase 
  } = useDatasets();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  
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
  
  // Handle clear all datasets
  const handleClearAllDatasets = async () => {
    try {
      await clearAllDatasets();
      setShowClearDialog(false);
    } catch (error) {
      console.error('Failed to clear datasets:', error);
    }
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

  // Render table content preview (first 5 rows)
  const renderTablePreview = (dataset: any) => {
    if (!dataset.data || !Array.isArray(dataset.data) || dataset.data.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded">
          No data available
        </div>
      );
    }

    const headers = Object.keys(dataset.data[0]);
    const previewData = dataset.data.slice(0, 5); // Show first 5 rows

    return (
      <div className="mt-4 border rounded-lg overflow-hidden bg-white">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Table Content Preview</h4>
            <Badge variant="secondary" className="text-xs">
              {dataset.data.length} rows
            </Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-50">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
                {previewData.map((row: Record<string, unknown>, index: number) => (
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
        {dataset.data.length > 5 && (
          <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600 border-t">
            Showing 5 of {dataset.data.length} rows
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col flex-1 relative">
      {/* Confirmation Dialog for Clear Dataset */}
      <ConfirmationDialog
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete your datasets and remove your data from our servers."
        confirmText="Continue"
        cancelText="Cancel"
        onConfirm={handleClearAllDatasets}
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
      />
      
      {/* Page header - matching chat page header */}
      <div className="py-5 px-4 md:px-6 lg:px-8 bg-background sticky top-0 z-10 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06] shrink-0">
        <div className="flex items-center justify-between gap-2">
          <Breadcrumb>
            <BreadcrumbList className="sm:gap-1.5">
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Playground</BreadcrumbLink>
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-xs"
              disabled={datasets.length === 0 || isLoading}
            >
              <RiDownloadLine className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="text-xs"
              disabled={datasets.length === 0 || isLoading}
            >
              Clear Dataset
            </Button>
            <Button variant="outline" size="icon" className="size-8">
              <RiShareLine
                className="text-muted-foreground/70"
                size={16}
                aria-hidden="true"
              />
              <span className="sr-only">Share</span>
            </Button>
            <Button variant="outline" size="icon" className="size-8">
              <RiShareCircleLine
                className="text-muted-foreground/70"
                size={16}
                aria-hidden="true"
              />
              <span className="sr-only">Share publicly</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-8 bg-[#f7f7f8] relative">
        {/* Shadow on the right edge */}
        <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></div>
        
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">Datasets</h1>
          </div>
          
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
                <div key={dataset.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {/* Dataset Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
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
                        <RiExpandUpDownLine 
                          className={`w-4 h-4 text-gray-600 transition-transform ${
                            expandedTables.has(dataset.id) ? 'rotate-180' : ''
                          }`} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {expandedTables.has(dataset.id) && (
                    <div className="border-t bg-gray-50/50">
                      <div className="p-4">
                        {renderTablePreview(dataset)}
                      </div>
                    </div>
                  )}
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