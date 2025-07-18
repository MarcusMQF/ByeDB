"use client";

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useDatasets, UseDatasets } from '@/hooks/use-datasets';

interface DatasetContextValue extends UseDatasets {
  refreshAfterSQLOperation: (sqlQuery?: string) => Promise<void>;
  scheduleRefresh: () => void;
  lastRefreshTime: Date | null;
  getDatasetLastUpdated: (datasetId: string) => Date | null;
  isDatasetRecentlyUpdated: (datasetId: string) => boolean;
}

const DatasetContext = createContext<DatasetContextValue | null>(null);

export const useDatasetContext = () => {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDatasetContext must be used within a DatasetProvider');
  }
  return context;
};

interface DatasetProviderProps {
  children: React.ReactNode;
}

export const DatasetProvider: React.FC<DatasetProviderProps> = ({ children }) => {
  const datasetsHook = useDatasets();
  const { refreshDatasets, datasets } = datasetsHook;
  const [lastRefreshTime, setLastRefreshTime] = React.useState<Date | null>(null);
  const [datasetUpdateTimes, setDatasetUpdateTimes] = React.useState<Map<string, Date>>(new Map());
  
  // Keep track of previous dataset state for change detection
  const previousDatasetStateRef = React.useRef<string>('');

  // Create a hash of the current dataset state for comparison
  const createDatasetHash = useCallback((datasets: any[]) => {
    return JSON.stringify(datasets.map(d => ({
      id: d.id,
      rows: d.rows,
      columns: d.columns,
      lastModified: d.lastModified
    })));
  }, []);

  // Check if datasets have actually changed
  const hasDatasetChanged = useCallback(() => {
    const currentHash = createDatasetHash(datasets);
    const hasChanged = currentHash !== previousDatasetStateRef.current;
    if (hasChanged) {
      previousDatasetStateRef.current = currentHash;
      // Update individual dataset timestamps
      const now = new Date();
      const newUpdateTimes = new Map(datasetUpdateTimes);
      datasets.forEach(dataset => {
        newUpdateTimes.set(dataset.id, now);
      });
      setDatasetUpdateTimes(newUpdateTimes);
    }
    return hasChanged;
  }, [datasets, createDatasetHash, datasetUpdateTimes]);

  // Get last updated time for a specific dataset
  const getDatasetLastUpdated = useCallback((datasetId: string): Date | null => {
    return datasetUpdateTimes.get(datasetId) || null;
  }, [datasetUpdateTimes]);

  // Check if dataset was updated within the last 5 seconds (for highlighting)
  const isDatasetRecentlyUpdated = useCallback((datasetId: string): boolean => {
    const lastUpdated = datasetUpdateTimes.get(datasetId);
    if (!lastUpdated) return false;
    
    const now = new Date();
    const timeDiff = now.getTime() - lastUpdated.getTime();
    return timeDiff <= 5000; // 5 seconds
  }, [datasetUpdateTimes]);

  // Refresh after SQL operations that might modify data
  const refreshAfterSQLOperation = useCallback(async (sqlQuery?: string) => {
    if (!sqlQuery) {
      await refreshDatasets();
      return;
    }

    // Check if the SQL query might modify data
    const modifyingOperations = [
      'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 
      'TRUNCATE', 'REPLACE', 'MERGE', 'UPSERT'
    ];
    
    const queryUpper = sqlQuery.toUpperCase();
    const mightModifyData = modifyingOperations.some(op => 
      queryUpper.includes(op)
    );

    if (mightModifyData) {
      // Add a small delay to ensure backend has processed the changes
      setTimeout(async () => {
        const previousHash = previousDatasetStateRef.current;
        await refreshDatasets();
        
        // Log if datasets actually changed
        if (hasDatasetChanged()) {
          console.log('Datasets updated after SQL operation:', sqlQuery.substring(0, 100));
          setLastRefreshTime(new Date());
          
          // Try to identify which specific datasets were affected
          const affectedDatasets = datasets.filter(dataset => {
            const tableReferences = [
              `FROM ${dataset.name}`,
              `INTO ${dataset.name}`,
              `UPDATE ${dataset.name}`,
              `TABLE ${dataset.name}`,
              `${dataset.name} SET`,
              `DELETE FROM ${dataset.name}`
            ];
            return tableReferences.some(ref => queryUpper.includes(ref.toUpperCase()));
          });
          
          if (affectedDatasets.length > 0) {
            const now = new Date();
            const newUpdateTimes = new Map(datasetUpdateTimes);
            affectedDatasets.forEach(dataset => {
              newUpdateTimes.set(dataset.id, now);
            });
            setDatasetUpdateTimes(newUpdateTimes);
          }
        }
      }, 500);
    }
  }, [refreshDatasets, hasDatasetChanged]);

  // Schedule a refresh (useful for debouncing multiple operations)
  const scheduleRefresh = useCallback(() => {
    // Debounced refresh
    const timeoutId = setTimeout(async () => {
      await refreshDatasets();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [refreshDatasets]);

  // Update dataset timestamps when datasets change
  React.useEffect(() => {
    if (datasets.length > 0) {
      const now = new Date();
      const newUpdateTimes = new Map(datasetUpdateTimes);
      
      // Initialize timestamps for datasets that don't have them yet
      datasets.forEach(dataset => {
        if (!newUpdateTimes.has(dataset.id)) {
          newUpdateTimes.set(dataset.id, dataset.lastUpdated || now);
        }
      });
      
      // Remove timestamps for datasets that no longer exist
      const currentDatasetIds = new Set(datasets.map(d => d.id));
      for (const [datasetId] of newUpdateTimes) {
        if (!currentDatasetIds.has(datasetId)) {
          newUpdateTimes.delete(datasetId);
        }
      }
      
      if (newUpdateTimes.size !== datasetUpdateTimes.size || 
          ![...newUpdateTimes.keys()].every(key => datasetUpdateTimes.has(key))) {
        setDatasetUpdateTimes(newUpdateTimes);
      }
    }
  }, [datasets, datasetUpdateTimes]);
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let isUserActive = true;

    const handleUserActivity = () => {
      isUserActive = true;
    };

    const handleUserInactive = () => {
      isUserActive = false;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh when user returns to the tab
        refreshDatasets().then(() => {
          setLastRefreshTime(new Date());
        });
      }
    };

    // Listen for user activity
    document.addEventListener('mousedown', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up periodic refresh
    intervalId = setInterval(async () => {
      if (isUserActive && document.visibilityState === 'visible') {
        await refreshDatasets();
        setLastRefreshTime(new Date());
        isUserActive = false; // Reset activity flag
      }
    }, 30000); // 30 seconds

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('mousedown', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDatasets]);

  const value: DatasetContextValue = {
    ...datasetsHook,
    refreshAfterSQLOperation,
    scheduleRefresh,
    lastRefreshTime,
    getDatasetLastUpdated,
    isDatasetRecentlyUpdated,
  };

  return (
    <DatasetContext.Provider value={value}>
      {children}
    </DatasetContext.Provider>
  );
};
