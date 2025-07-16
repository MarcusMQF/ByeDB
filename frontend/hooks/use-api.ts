import { useState, useCallback } from 'react';
import { apiClient, QueryRequest, QueryResponse, DataRequest, ApiResponse } from '@/lib/api-client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useApi = () => {
  const [queryState, setQueryState] = useState<UseApiState<QueryResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const [tablesState, setTablesState] = useState<UseApiState<ApiResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const [healthState, setHealthState] = useState<UseApiState<{ status: string; database: string }>>({
    data: null,
    loading: false,
    error: null,
  });

  // Health check
  const checkHealth = useCallback(async () => {
    setHealthState({ data: null, loading: true, error: null });
    try {
      const response = await apiClient.healthCheck();
      setHealthState({ data: response, loading: false, error: null });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setHealthState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  // Process natural language query
  const processQuery = useCallback(async (request: QueryRequest) => {
    setQueryState({ data: null, loading: true, error: null });
    try {
      const response = await apiClient.processQuery(request);
      setQueryState({ data: response, loading: false, error: null });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setQueryState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  // List tables
  const listTables = useCallback(async () => {
    setTablesState({ data: null, loading: true, error: null });
    try {
      const response = await apiClient.listTables();
      setTablesState({ data: response, loading: false, error: null });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTablesState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  // Create table
  const createTable = useCallback(async (tableName: string, columns: Record<string, string>) => {
    try {
      const response = await apiClient.createTable({ table_name: tableName, columns });
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // CRUD operations
  const createData = useCallback(async (request: DataRequest) => {
    try {
      const response = await apiClient.createData(request);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const readData = useCallback(async (tableName: string, limit?: number) => {
    try {
      const response = await apiClient.readData(tableName, limit);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateData = useCallback(async (request: DataRequest) => {
    try {
      const response = await apiClient.updateData(request);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteData = useCallback(async (request: DataRequest) => {
    try {
      const response = await apiClient.deleteData(request);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Execute custom SQL
  const executeSQL = useCallback(async (sql: string) => {
    try {
      const response = await apiClient.executeSQL(sql);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  return {
    // States
    queryState,
    tablesState,
    healthState,
    
    // Methods
    checkHealth,
    processQuery,
    listTables,
    createTable,
    createData,
    readData,
    updateData,
    deleteData,
    executeSQL,
  };
};
