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
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiSearchLine, RiShareLine, RiRefreshLine, RiShareCircleLine, RiDownloadLine } from "@remixicon/react";
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
  
  // Filter datasets based on search term
  const filteredDatasets = datasets.filter(dataset => 
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle dataset deletion (individual table deletion would need backend implementation)
  const handleDelete = (id: string) => {
    // TODO: Implement individual table deletion on backend
    console.log('Delete dataset:', id);
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
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="py-3 font-medium text-gray-600">Name</TableHead>
                  <TableHead className="py-3 w-[100px] text-right font-medium text-gray-600">Rows</TableHead>
                  <TableHead className="py-3 w-[100px] text-right font-medium text-gray-600">Columns</TableHead>
                  <TableHead className="py-3 w-[150px] font-medium text-gray-600">Last Modified</TableHead>
                  <TableHead className="py-3 w-[100px] text-right font-medium text-gray-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        Loading datasets...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
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
                    </TableCell>
                  </TableRow>
                ) : filteredDatasets.length > 0 ? (
                  filteredDatasets.map((dataset) => (
                    <TableRow key={dataset.id} className="border-b hover:bg-gray-50">
                      <TableCell className="py-4 font-medium">{dataset.name}</TableCell>
                      <TableCell className="py-4 text-right">{dataset.rows.toLocaleString()}</TableCell>
                      <TableCell className="py-4 text-right">{dataset.columns}</TableCell>
                      <TableCell className="py-4">{dataset.lastModified}</TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="size-8 text-gray-500 hover:text-gray-800">
                            <RiEditLine className="size-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 text-gray-500 hover:text-red-500"
                            onClick={() => handleDelete(dataset.id)}
                          >
                            <RiDeleteBinLine className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="text-gray-500">
                        No datasets found
                        {searchTerm && (
                          <div className="mt-1 text-sm">
                            Try adjusting your search terms
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                A list of your datasets
              </div>
              <div className="text-sm text-gray-500">
                {filteredDatasets.length} {filteredDatasets.length === 1 ? 'record' : 'records'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 