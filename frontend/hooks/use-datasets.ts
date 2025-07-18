"use client";

import { useState, useEffect, useCallback } from 'react';
import { getUserId, getApiHeaders, getApiHeadersForFormData } from '@/lib/user-session';

export interface Dataset {
  id: string;
  name: string;
  rows: number;
  columns: number;
  lastModified: string;
  data?: any[];
}

export interface UseDatasets {
  datasets: Dataset[];
  isLoading: boolean;
  error: string | null;
  refreshDatasets: () => Promise<void>;
  uploadFile: (file: File, truncate?: boolean) => Promise<void>;
  clearAllDatasets: () => Promise<void>;
  exportDatabase: () => Promise<void>;
}

const API_BASE_URL = 'http://localhost:8000';

export const useDatasets = (): UseDatasets => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert backend export data to dataset format
  const convertExportDataToDatasets = (exportData: Record<string, any[]>): Dataset[] => {
    return Object.entries(exportData).map(([tableName, tableData]) => {
      const rows = Array.isArray(tableData) ? tableData.length : 0;
      const columns = Array.isArray(tableData) && tableData.length > 0 
        ? Object.keys(tableData[0]).length 
        : 0;
      
      return {
        id: tableName,
        name: tableName,
        rows,
        columns,
        lastModified: new Date().toISOString().split('T')[0],
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
        const convertedDatasets = convertExportDataToDatasets(result.data);
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
      const response = await fetch(`${API_BASE_URL}/api/clear-database`, {
        method: 'POST',
        headers: getApiHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear database: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to clear database');
      }
      
      // Clear frontend state
      setDatasets([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear datasets';
      setError(errorMessage);
      console.error('Error clearing datasets:', err);
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

  return {
    datasets,
    isLoading,
    error,
    refreshDatasets,
    uploadFile,
    clearAllDatasets,
    exportDatabase,
  };
};
