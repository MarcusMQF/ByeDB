import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedFileData {
  name: string;
  type: 'csv' | 'xlsx';
  size: string;
  rows: number;
  columns: number;
  data: any[][];
  headers: string[];
}

export function parseFile(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) {
          reject(new Error('Failed to read file'));
          return;
        }

        let data: any[][] = [];
        let headers: string[] = [];

        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const csvText = result as string;
          const parsed = Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
          });
          
          data = parsed.data as any[][];
          headers = data[0]?.map((header, index) => 
            header?.toString().trim() || `Column ${index + 1}`
          ) || [];
          
        } else if (file.name.endsWith('.xlsx')) {
          // Parse Excel
          const workbook = XLSX.read(result, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          data = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            raw: false,
            defval: ''
          }) as any[][];
          
          headers = data[0]?.map((header, index) => 
            header?.toString().trim() || `Column ${index + 1}`
          ) || [];
        }

        // Filter out empty rows
        const filteredData = data.filter(row => 
          row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );

        const parsedData: ParsedFileData = {
          name: file.name,
          type: file.name.endsWith('.csv') ? 'csv' : 'xlsx',
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          rows: Math.max(0, filteredData.length - 1), // Subtract header row
          columns: headers.length,
          data: filteredData,
          headers: headers
        };

        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx')) {
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Unsupported file type'));
    }
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
} 