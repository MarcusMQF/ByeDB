"use client";

import { useState, useEffect, useCallback } from 'react';
import { getUserId, getApiHeaders, getApiHeadersForFormData } from '@/lib/user-session';

export interface Dataset {
  id: string;
  name: string;
  rows: number;
  columns: number;
  lastModified: string;
  lastUpdated?: Date; // New field for tracking real-time updates
  source: 'uploaded' | 'created'; // Track how the dataset was created
  data?: any[];
}

export interface UseDatasets {
  datasets: Dataset[];
  isLoading: boolean;
  error: string | null;
  refreshDatasets: () => Promise<void>;
  uploadFile: (file: File, truncate?: boolean) => Promise<void>;
  clearAllDatasets: () => Promise<void>;
  clearMemory: () => Promise<void>;
  exportDatabase: () => Promise<void>;
  getDatasetSummary: () => { totalRows: number; totalColumns: number; totalDatasets: number };
}

const API_BASE_URL = 'http://localhost:8000';

export const useDatasets = (): UseDatasets => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedTableNames, setUploadedTableNames] = useState<Set<string>>(new Set());

  // Convert backend export data to dataset format
  const convertExportDataToDatasets = (exportData: Record<string, any[]>, uploadedTableNames: Set<string> = new Set()): Dataset[] => {
    return Object.entries(exportData).map(([tableName, tableData]) => {
      const rows = Array.isArray(tableData) ? tableData.length : 0;
      const columns = Array.isArray(tableData) && tableData.length > 0 
        ? Object.keys(tableData[0]).length 
        : 0;
      
      // Determine source: system tables are neither uploaded nor created by user
      let source: 'uploaded' | 'created' = 'created';
      if (uploadedTableNames.has(tableName)) {
        source = 'uploaded';
      }
      
      return {
        id: tableName,
        name: tableName,
        rows,
        columns,
        lastModified: new Date().toISOString().split('T')[0],
        lastUpdated: new Date(), // Set current time as last updated
        source,
        data: tableData
      };
    });
  };

  // Fetch all datasets from backend
  const refreshDatasets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/export-db`, {
        headers: getApiHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch datasets: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const convertedDatasets = convertExportDataToDatasets(result.data, uploadedTableNames);
        setDatasets(convertedDatasets);
      } else {
        throw new Error(result.error || 'Failed to export database');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching datasets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Upload file to backend
  const uploadFile = useCallback(async (file: File, truncate: boolean = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('truncate', truncate.toString());

      console.log('Uploading file:', file.name, 'Size:', file.size);
      console.log('Using user ID:', getUserId());

      const response = await fetch(`${API_BASE_URL}/api/upload-db`, {
        method: 'POST',
        headers: getApiHeadersForFormData(),
        body: formData,
      });

      console.log('Upload response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.message || 'Upload failed';
        } catch {
          errorMessage = errorText || `Upload failed: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      if (!result.success) {
        throw new Error(result.error || result.message || 'Upload failed');
      }

      // Track the uploaded table name (file name without extension)
      const tableName = file.name.replace(/\.[^/.]+$/, "").toLowerCase();
      setUploadedTableNames(prev => new Set([...prev, tableName]));

      // After successful upload, refresh datasets
      await refreshDatasets();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload error:', err);
      setError(errorMessage);
      throw err; // Re-throw to handle in component
    } finally {
      setIsLoading(false);
    }
  }, [refreshDatasets]);

  // Clear all datasets
  const clearAllDatasets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call backend to clear database
      const dbResponse = await fetch(`${API_BASE_URL}/api/clear-database`, {
        method: 'POST',
        headers: getApiHeaders(),
      });
      
      if (!dbResponse.ok) {
        throw new Error(`Failed to clear database: ${dbResponse.statusText}`);
      }
      
      const dbResult = await dbResponse.json();
      if (!dbResult.success) {
        throw new Error(dbResult.message || 'Failed to clear database');
      }

      // Call backend to clear memory
      const memoryResponse = await fetch(`${API_BASE_URL}/api/clear-memory`, {
        method: 'POST',
        headers: getApiHeaders(),
      });
      
      if (!memoryResponse.ok) {
        throw new Error(`Failed to clear memory: ${memoryResponse.statusText}`);
      }
      
      const memoryResult = await memoryResponse.json();
      if (!memoryResult.success) {
        throw new Error(memoryResult.message || 'Failed to clear memory');
      }
      
      // Clear frontend state
      setDatasets([]);
      setUploadedTableNames(new Set());
      console.log('Database and memory cleared successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear datasets';
      setError(errorMessage);
      console.error('Error clearing datasets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear memory only
  const clearMemory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/clear-memory`, {
        method: 'POST',
        headers: getApiHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear memory: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to clear memory');
      }
      
      console.log('Memory cleared successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear memory';
      setError(errorMessage);
      console.error('Error clearing memory:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Export database
  const exportDatabase = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/export-db`, {
        headers: getApiHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
      console.error('Error exporting database:', err);
    }
  }, []);

  // Load datasets on mount
  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  // Get summary statistics
  const getDatasetSummary = useCallback(() => {
    const totalRows = datasets.reduce((sum, dataset) => sum + dataset.rows, 0);
    const totalColumns = datasets.reduce((sum, dataset) => sum + dataset.columns, 0);
    const totalDatasets = datasets.length;
    
    return { totalRows, totalColumns, totalDatasets };
  }, [datasets]);

  return {
    datasets,
    isLoading,
    error,
    refreshDatasets,
    uploadFile,
    clearAllDatasets,
    clearMemory,
    exportDatabase,
    getDatasetSummary,
  };
};
