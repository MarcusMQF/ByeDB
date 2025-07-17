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
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiSearchLine, RiShareLine, RiRefreshLine } from "@remixicon/react";
import { Input } from "@/components/input";
import Link from "next/link";

// Mock data for the table
const mockData = [
  { id: 1, name: "Sales Data 2023", rows: 1250, columns: 8, lastModified: "2023-12-10" },
  { id: 2, name: "Customer Analytics", rows: 3420, columns: 12, lastModified: "2023-11-28" },
  { id: 3, name: "Product Inventory", rows: 876, columns: 6, lastModified: "2023-12-05" },
  { id: 4, name: "Marketing Campaign Results", rows: 542, columns: 9, lastModified: "2023-12-01" },
  { id: 5, name: "Financial Report Q4", rows: 1890, columns: 15, lastModified: "2023-12-08" },
];

export default function TablePage() {
  // State management
  const [datasets, setDatasets] = useState(mockData);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter datasets based on search term
  const filteredDatasets = datasets.filter(dataset => 
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle dataset deletion
  const handleDelete = (id: number) => {
    setDatasets(datasets.filter(dataset => dataset.id !== id));
  };
  
  return (
    <div className="flex flex-col flex-1 relative">
      {/* Page header - exact match to chat page */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
        <div className="flex items-center">
          <Link href="/playground" className="text-gray-600 hover:text-gray-800 text-sm">
            Playground
          </Link>
          <span className="mx-2 text-gray-400">›</span>
          <span className="text-sm">Dataset</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm rounded border-gray-200 bg-white hover:bg-gray-50"
          >
            Clear Dataset
          </Button>
          <Button variant="ghost" size="icon" className="w-9 h-9 text-gray-500 hover:text-gray-700">
            <RiShareLine className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-9 h-9 text-gray-500 hover:text-gray-700">
            <RiRefreshLine className="size-4" />
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-8 bg-[#f7f7f8] relative">
        {/* Shadow on the right edge */}
        <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></div>
        
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">Datasets</h1>
            <Button className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white h-9 px-4">
              <RiAddLine className="size-4 mr-1" />
              <span>New Dataset</span>
            </Button>
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
                {filteredDatasets.length > 0 ? (
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
                      No datasets found
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