// API client for connecting to FastAPI backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface QueryRequest {
  query: string;
  table_context?: string;
}

export interface QueryResponse {
  success: boolean;
  sql_query?: string;
  explanation?: string;
  data?: Record<string, unknown>[];
  error?: string;
}

export interface TableCreateRequest {
  table_name: string;
  columns: Record<string, string>;
}

export interface DataRequest {
  table_name: string;
  data: Record<string, unknown>;
  filters?: Record<string, unknown>;
}

export interface ApiResponse<T = Record<string, unknown>[]> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HealthResponse {
  status: string;
  database: string;
  message: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<HealthResponse> {
    return this.request('/api/health');
  }

  // Natural language query processing
  async processQuery(request: QueryRequest): Promise<QueryResponse> {
    return this.request('/api/query', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Table operations
  async createTable(request: TableCreateRequest): Promise<ApiResponse> {
    return this.request('/api/tables', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async listTables(): Promise<ApiResponse> {
    return this.request('/api/tables');
  }

  async getTableInfo(tableName: string): Promise<ApiResponse> {
    return this.request(`/api/tables/${tableName}`);
  }

  // Data operations
  async createData(request: DataRequest): Promise<ApiResponse> {
    return this.request('/api/data', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async readData(tableName: string, limit?: number): Promise<ApiResponse> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/api/data/${tableName}${params}`);
  }

  async updateData(request: DataRequest): Promise<ApiResponse> {
    return this.request('/api/data', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteData(request: DataRequest): Promise<ApiResponse> {
    return this.request('/api/data', {
      method: 'DELETE',
      body: JSON.stringify(request),
    });
  }

  // Custom SQL execution
  async executeSQL(sql: string): Promise<ApiResponse> {
    return this.request('/api/execute-sql', {
      method: 'POST',
      body: JSON.stringify({ sql }),
    });
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Export the class for custom instances if needed
export default ApiClient;
