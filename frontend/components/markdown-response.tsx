"use client";

import React, { useState } from 'react';
import { Button } from './button';
import { RiFileCopyLine, RiCheckLine, RiDownloadLine, RiFileTextLine, RiFileExcelLine, RiTableLine } from '@remixicon/react';
import { SQLSyntaxHighlighter } from './sql-syntax-highlighter';
import { buildImageUrl } from '@/lib/api-config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface MarkdownResponseProps {
  content: string;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

interface TableProps {
  data: string[][];
  headers?: string[];
}

const TableComponent: React.FC<TableProps> = ({ data, headers }) => {
  const [copied, setCopied] = useState(false);

  // Determine if we need horizontal scrolling based on column count
  const columnCount = headers ? headers.length : (data.length > 0 ? data[0].length : 0);
  const needsHorizontalScroll = columnCount >= 8;
  
  // Calculate intelligent column widths based on content length
  const calculateColumnWidths = () => {
    if (needsHorizontalScroll) {
      // For many columns, use fixed min-width
      return Array(columnCount).fill('120px');
    }
    
    if (columnCount === 0) return [];
    
    // Calculate average content length for each column
    const columnStats = Array(columnCount).fill(0).map(() => ({
      totalLength: 0,
      maxLength: 0,
      avgLength: 0,
      samples: 0
    }));
    
    // Analyze headers if they exist
    if (headers) {
      headers.forEach((header, index) => {
        const length = header.length;
        columnStats[index].totalLength += length;
        columnStats[index].maxLength = Math.max(columnStats[index].maxLength, length);
        columnStats[index].samples += 1;
      });
    }
    
    // Analyze data content
    data.forEach(row => {
      row.forEach((cell, index) => {
        if (index < columnStats.length) {
          const length = cell.length;
          columnStats[index].totalLength += length;
          columnStats[index].maxLength = Math.max(columnStats[index].maxLength, length);
          columnStats[index].samples += 1;
        }
      });
    });
    
    // Calculate average lengths
    columnStats.forEach(stat => {
      stat.avgLength = stat.samples > 0 ? stat.totalLength / stat.samples : 0;
    });
    
    // Calculate base weights using a combination of average and max length
    const baseWeights = columnStats.map(stat => {
      // Use weighted combination of average and max, with more emphasis on average
      const weight = (stat.avgLength * 0.7) + (stat.maxLength * 0.3);
      return Math.max(weight, 3); // Minimum weight to ensure visibility
    });
    
    const totalWeight = baseWeights.reduce((sum, weight) => sum + weight, 0);
    
    // Convert to percentages with constraints
    const minWidthPercent = 8; // Minimum 8% width for any column
    const maxWidthPercent = 50; // Maximum 50% width for any column
    
    let percentages = baseWeights.map(weight => (weight / totalWeight) * 100);
    
    // Apply constraints
    let redistributeTotal = 0;
    let redistributeCount = 0;
    
    // First pass: handle columns that are too small
    percentages = percentages.map(percent => {
      if (percent < minWidthPercent) {
        redistributeTotal += (minWidthPercent - percent);
        return minWidthPercent;
      }
      return percent;
    });
    
    // Second pass: handle columns that are too large and redistribute
    const adjustableColumns: number[] = [];
    percentages = percentages.map((percent, index) => {
      if (percent > maxWidthPercent) {
        redistributeTotal += (percent - maxWidthPercent);
        return maxWidthPercent;
      } else if (percent > minWidthPercent && percent < maxWidthPercent) {
        adjustableColumns.push(index);
      }
      return percent;
    });
    
    // Redistribute excess width to adjustable columns
    if (redistributeTotal > 0 && adjustableColumns.length > 0) {
      const redistributePerColumn = redistributeTotal / adjustableColumns.length;
      adjustableColumns.forEach(index => {
        const newPercent = percentages[index] + redistributePerColumn;
        percentages[index] = Math.min(newPercent, maxWidthPercent);
      });
    }
    
    // Ensure total is 100%
    const currentTotal = percentages.reduce((sum, percent) => sum + percent, 0);
    const adjustmentFactor = 100 / currentTotal;
    percentages = percentages.map(percent => percent * adjustmentFactor);
    
    return percentages.map(percent => `${percent.toFixed(1)}%`);
  };
  
  const columnWidths = calculateColumnWidths();
  
  // Process inline formatting for table cells
  const processInlineFormatting = (text: string) => {
    // Step 1: Protect code blocks with placeholders
    const codeBlocks: string[] = [];
    const inlineCodeRegex = /`([^`]+)`/g;
    const textWithCodePlaceholders = text.replace(inlineCodeRegex, (match, code) => {
      const index = codeBlocks.length;
      codeBlocks.push(code);
      return `__CODE_PLACEHOLDER_${index}__`;
    });

    // Step 2: Process bold text
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let partIndex = 0;
    
    const boldMatches = Array.from(textWithCodePlaceholders.matchAll(boldRegex));
    for (const match of boldMatches) {
      // Add text before bold
      if (match.index! > lastIndex) {
        const beforeText = textWithCodePlaceholders.slice(lastIndex, match.index);
        parts.push(processItalicAndCode(beforeText, `table-before-bold-${partIndex++}`, codeBlocks));
      }
      
      // Add bold text (process italic inside bold)
      parts.push(
        <strong key={`table-bold-${partIndex++}`} className="font-semibold">
          {processItalicAndCode(match[1], `table-inside-bold-${partIndex}`, codeBlocks)}
        </strong>
      );
      
      lastIndex = match.index! + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < textWithCodePlaceholders.length) {
      const remainingText = textWithCodePlaceholders.slice(lastIndex);
      parts.push(processItalicAndCode(remainingText, `table-remaining-${partIndex++}`, codeBlocks));
    }
    
    return parts.length > 0 ? parts : [processItalicAndCode(textWithCodePlaceholders, `table-full-${partIndex++}`, codeBlocks)];
  };

  const processItalicAndCode = (text: string, key: string, codeBlocks: string[]) => {
    // Step 3: Process italic text
    const italicRegex = /\*([^*]+)\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let partIndex = 0;
    
    const italicMatches = Array.from(text.matchAll(italicRegex));
    for (const match of italicMatches) {
      // Add text before italic
      if (match.index! > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(restoreCodeBlocks(beforeText, `${key}-before-italic-${partIndex++}`, codeBlocks));
      }
      
      // Add italic text
      parts.push(
        <em key={`table-italic-${key}-${partIndex++}`} className="italic">
          {restoreCodeBlocks(match[1], `${key}-inside-italic-${partIndex}`, codeBlocks)}
        </em>
      );
      
      lastIndex = match.index! + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(restoreCodeBlocks(remainingText, `${key}-remaining-${partIndex++}`, codeBlocks));
    }
    
    return parts.length > 0 ? parts : [restoreCodeBlocks(text, `${key}-full-${partIndex++}`, codeBlocks)];
  };

  const restoreCodeBlocks = (text: string, key: string, codeBlocks: string[]) => {
    // Step 4: Restore code blocks from placeholders
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let partIndex = 0;
    
    const placeholderRegex = /__CODE_PLACEHOLDER_(\d+)__/g;
    const placeholderMatches = Array.from(text.matchAll(placeholderRegex));
    
    for (const match of placeholderMatches) {
      // Add text before code
      if (match.index! > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText.trim()) {
          parts.push(beforeText);
        }
      }
      
      // Add code block
      const codeIndex = parseInt(match[1]);
      if (codeIndex < codeBlocks.length) {
        parts.push(
          <code 
            key={`${key}-code-${partIndex++}`}
            className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono"
          >
            {codeBlocks[codeIndex]}
          </code>
        );
      }
      
      lastIndex = match.index! + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText.trim()) {
        parts.push(remainingText);
      }
    }
    
    return parts.length > 0 ? parts : [text];
  };

  const processInlineCode = (text: string, key: string) => {
    const inlineCodeRegex = /`([^`]+)`/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let partIndex = 0;
    
    const inlineMatches = Array.from(text.matchAll(inlineCodeRegex));
    for (const match of inlineMatches) {
      // Add text before inline code
      if (match.index! > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // Add inline code
      parts.push(
        <code 
          key={`table-inline-code-${key}-${partIndex++}`}
          className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono"
        >
          {match[1]}
        </code>
      );
      
      lastIndex = match.index! + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : [text];
  };

  const exportAsMarkdown = () => {
    let markdown = '';
    
    if (headers && headers.length > 0) {
      // Add headers
      markdown += '| ' + headers.join(' | ') + ' |\n';
      // Add separator
      markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    }
    
    // Add data rows
    data.forEach(row => {
      markdown += '| ' + row.join(' | ') + ' |\n';
    });
    
    // Create and download the markdown file
    const blob = new Blob([markdown], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-data.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    let csv = '';
    
    if (headers && headers.length > 0) {
      csv += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
    }
    
    data.forEach(row => {
      csv += row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsXLSX = () => {
    // For XLSX export, we'll create a simple tab-separated format that Excel can open
    let content = '';
    
    if (headers && headers.length > 0) {
      content += headers.join('\t') + '\n';
    }
    
    data.forEach(row => {
      content += row.join('\t') + '\n';
    });
    
    const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-data.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative my-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 w-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700">
            <RiTableLine size={16} className="text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Data Table
            </span>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {data.length} rows • {columnCount} columns
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 shadow-sm"
            >
              <RiDownloadLine size={14} />
              <span className="ml-1.5 text-xs font-medium">Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={exportAsMarkdown} className="py-1.5">
              <div className="font-medium">Markdown</div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportAsCSV} className="py-1.5">
              <div className="font-medium">CSV</div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportAsXLSX} className="py-1.5">
              <div className="font-medium">Excel</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div 
        className={`w-full ${needsHorizontalScroll ? 'overflow-x-auto custom-scrollbar' : 'overflow-x-visible'}`}
      >
        <table className={`intelligent-table border-collapse ${needsHorizontalScroll ? 'min-w-full' : 'w-full'}`}>
          {headers && headers.length > 0 && (
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className={`px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-600 ${needsHorizontalScroll ? 'whitespace-nowrap' : 'break-words'}`}
                    style={needsHorizontalScroll ? { minWidth: '120px' } : { width: columnWidths[index] }}
                  >
                    <div className={`font-semibold ${needsHorizontalScroll ? '' : 'text-left'}`} title={header}>
                      {processInlineFormatting(header)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="group">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-3 py-3 text-sm text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${needsHorizontalScroll ? '' : 'break-words'}`}
                    style={needsHorizontalScroll ? { minWidth: '120px' } : { width: columnWidths[cellIndex] }}
                  >
                    <div className={`${needsHorizontalScroll ? 'break-words' : 'break-words text-left'} leading-relaxed`} title={cell}>
                      {processInlineFormatting(cell)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'sql' }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Format SQL code with proper line breaks
  const formatSqlCode = (sqlCode: string) => {
    if (language === 'sql') {
      // Split on semicolons and trim whitespace, then join with line breaks
      return sqlCode
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0)
        .join(';\n') + (sqlCode.trim().endsWith(';') ? '' : '');
    }
    return sqlCode;
  };

  const formattedCode = formatSqlCode(code);

  return (
    <div className="relative my-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b dark:border-slate-700">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase">
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 px-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          {copied ? (
            <RiCheckLine size={16} className="text-green-600" />
          ) : (
            <RiFileCopyLine size={16} />
          )}
          <span className="ml-1 text-xs">
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </Button>
      </div>
      <div className="p-4">
        {language === 'sql' ? (
          <SQLSyntaxHighlighter 
            code={formattedCode}
          />
        ) : (
          <pre className="overflow-x-auto text-sm max-w-full custom-scrollbar">
            <code className="text-slate-800 dark:text-slate-200 font-mono break-words">
              {formattedCode}
            </code>
          </pre>
        )}
      </div>
    </div>
  );
};

const MarkdownResponse: React.FC<MarkdownResponseProps> = ({ content }) => {
  const parseMarkdown = (text: string) => {
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    // Regular expressions for different markdown elements
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    const hrRegex = /^---$/gm;
    const bulletRegex = /^[-*]\s+(.+)$/gm; // Updated to match both - and * for bullets
    const subBulletRegex = /^[\s]{2,}[-*]\s+(.+)$/gm; // Updated to match both - and * for sub-bullets
    const numberedRegex = /^(\d+)\.\s+(.+)$/gm;
    const tableRegex = /(?:^\|.*\|$(?:\n^\|.*\|$)*)/gm;
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g; // New: Regex for images ![](alt_text)(url)

    // Find all special elements first
    const codeBlocks: { start: number; end: number; match: string; language?: string; code: string }[] = [];
    const headers: { start: number; end: number; match: string; level: number; text: string }[] = [];
    const hrs: { start: number; end: number; match: string }[] = [];
    const bullets: { start: number; end: number; match: string; text: string }[] = [];
    const subBullets: { start: number; end: number; match: string; text: string }[] = [];
    const numberedItems: { start: number; end: number; match: string; number: string; text: string }[] = [];
    const tables: { start: number; end: number; match: string; data: string[][]; headers?: string[] }[] = [];
    const images: { start: number; end: number; match: string; alt: string; src: string }[] = []; // New: Array to store image matches
    let match;


    
    // Find code blocks
    while ((match = codeBlockRegex.exec(text)) !== null) {
      codeBlocks.push({
        start: match.index,
        end: match.index + match[0].length,
        match: match[0],
        language: match[1] || 'sql',
        code: match[2].trim()
      });
    }
    
    // Find headers
    while ((match = headerRegex.exec(text)) !== null) {
      headers.push({
        start: match.index,
        end: match.index + match[0].length,
        match: match[0],
        level: match[1].length,
        text: match[2].trim()
      });
    }
    
    // Find horizontal rules
    while ((match = hrRegex.exec(text)) !== null) {
      hrs.push({
        start: match.index,
        end: match.index + match[0].length,
        match: match[0]
      });
    }
    
    // Find bullet points
    while ((match = bulletRegex.exec(text)) !== null) {
      bullets.push({
        start: match.index,
        end: match.index + match[0].length,
        match: match[0],
        text: match[1].trim()
      });
    }
    
    // Find sub-bullet points (indented with spaces)
    while ((match = subBulletRegex.exec(text)) !== null) {
      subBullets.push({
        start: match.index,
        end: match.index + match[0].length,
        match: match[0],
        text: match[1].trim()
      });
    }

    // Find numbered list items
    while ((match = numberedRegex.exec(text)) !== null) {
      numberedItems.push({
        start: match.index,
        end: match.index + match[0].length,
        match: match[0],
        number: match[1],
        text: match[2].trim()
      });
    }
    
    // Find tables using a more robust regex that captures complete table blocks
    const tableBlockRegex = /(?:^[ \t]*\|.*\|[ \t]*(?:\r?\n|$))+/gm;
    
    while ((match = tableBlockRegex.exec(text)) !== null) {
      const tableText = match[0].trim();
      const rows = tableText.split(/\r?\n/).filter(row => row.trim() && row.includes('|'));
      
      if (rows.length >= 1) { // Allow tables with just headers or just data
        // Parse table data
        const parsedRows = rows.map(row => {
          // Handle rows that start and end with |
          const cells = row.split('|');
          // Remove empty first and last elements if they exist
          if (cells.length > 0 && cells[0].trim() === '') cells.shift();
          if (cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop();
          return cells.map(cell => cell.trim());
        }).filter(row => row.length > 0); // Filter out empty rows
        
        // Check if any row is a separator (contains only dashes, spaces, and colons)
        let separatorIndex = -1;
        for (let i = 0; i < parsedRows.length; i++) {
          if (parsedRows[i].every(cell => /^[-:\s]*$/.test(cell) && cell.length > 0)) {
            separatorIndex = i;
            break;
          }
        }
        
        let headers: string[] | undefined;
        let data: string[][];
        
        if (separatorIndex >= 0) {
          // If there's a separator, everything before it is headers, everything after is data
          if (separatorIndex > 0) {
            headers = parsedRows[0];
          }
          data = parsedRows.slice(separatorIndex + 1);
        } else {
          // No separator found - treat first row as headers if it looks like headers
          // or treat all rows as data
          if (parsedRows.length > 1) {
            headers = parsedRows[0];
            data = parsedRows.slice(1);
          } else {
            data = parsedRows;
          }
        }
        
        if (data.length > 0) {
          tables.push({
            start: match.index,
            end: match.index + match[0].length,
            match: match[0],
            data,
            headers
          });
        }
      }
    }

    // New: Find images
    while ((match = imageRegex.exec(text)) !== null) {
      images.push({
        start: match.index,
        end: match.index + match[0].length,
        match: match[0],
        alt: match[1],
        src: match[2],
      });
    }

    // Process text, handling special elements
    type TextPart = {
      text: string;
      start: number;
      end: number;
      type: 'text' | 'code' | 'header' | 'hr' | 'bullet' | 'subBullet' | 'numbered' | 'table' | 'image'; // New: Add 'image' type
      language?: string;
      code?: string;
      headerLevel?: number;
      headerText?: string;
      bulletText?: string;
      subBulletText?: string;
      number?: string;
      numberedText?: string;
      tableData?: string[][];
      tableHeaders?: string[];
      imageAlt?: string; // New: Alt text for image
      imageSrc?: string; // New: Source for image
    };

    let textParts: TextPart[] = [{ text, start: 0, end: text.length, type: 'text' }];

    // Combine all special elements and sort by position
    const allElements = [
      ...codeBlocks.map(block => ({ ...block, type: 'code' as const })),
      ...headers.map(header => ({ ...header, type: 'header' as const })),
      ...hrs.map(hr => ({ ...hr, type: 'hr' as const })),
      ...bullets.map(bullet => ({ ...bullet, type: 'bullet' as const })),
      ...subBullets.map(subBullet => ({ ...subBullet, type: 'subBullet' as const })),
      ...numberedItems.map(item => ({ ...item, type: 'numbered' as const })),
      ...tables.map(table => ({ ...table, type: 'table' as const })),
      ...images.map(image => ({ ...image, type: 'image' as const })), // New: Add images to allElements
    ].sort((a, b) => b.start - a.start); // Reverse order for processing

    // Split text around all special elements
    for (const element of allElements) {
      const newParts: TextPart[] = [];
      for (const part of textParts) {
        if (part.type !== 'text') {
          newParts.push(part);
          continue;
        }

        if (element.start >= part.start && element.end <= part.end) {
          // Add text before element
          if (element.start > part.start) {
            newParts.push({
              text: text.slice(part.start, element.start),
              start: part.start,
              end: element.start,
              type: 'text'
            });
          }

          // Add the special element
          if (element.type === 'code') {
            newParts.push({
              text: element.match,
              start: element.start,
              end: element.end,
              type: 'code',
              language: element.language,
              code: element.code
            });
          } else if (element.type === 'header') {
            newParts.push({
              text: element.match,
              start: element.start,
              end: element.end,
              type: 'header',
              headerLevel: element.level,
              headerText: element.text
            });
          } else if (element.type === 'hr') {
            newParts.push({
              text: element.match,
              start: element.start,
              end: element.end,
              type: 'hr'
            });
          } else if (element.type === 'bullet') {
            newParts.push({
              text: element.match,
              start: element.start,
              end: element.end,
              type: 'bullet',
              bulletText: element.text
            });
          } else if (element.type === 'subBullet') {
            newParts.push({
              text: element.match,
              start: element.start,
              end: element.end,
              type: 'subBullet',
              subBulletText: element.text
            });
          } else if (element.type === 'numbered') {
            newParts.push({
              text: element.match,
              start: element.start,
              end: element.end,
              type: 'numbered',
              number: element.number,
              numberedText: element.text
            });
          } else if (element.type === 'table') {
            newParts.push({
              text: element.match,
              start: element.start,
              end: element.end,
              type: 'table',
              tableData: element.data,
              tableHeaders: element.headers
            });
          } else if (element.type === 'image') { // New: Handle image type
            const finalSrc = buildImageUrl(element.src);
            newParts.push({
              text: element.match,
              start: element.start,
              end: element.end,
              type: 'image',
              imageAlt: element.alt,
              imageSrc: finalSrc
            });
          }

          // Add text after element
          if (element.end < part.end) {
            newParts.push({
              text: text.slice(element.end, part.end),
              start: element.end,
              end: part.end,
              type: 'text'
            });
          }
        } else {
          newParts.push(part);
        }
      }
      textParts = newParts;
    }

    // Process each part
    let elementIndex = 0;
    for (const part of textParts) {
      if (part.type === 'code' && part.code !== undefined && part.language !== undefined) {
        elements.push(
          <CodeBlock
            key={`code-${elementIndex++}`}
            code={part.code}
            language={part.language}
          />
        );
      } else if (part.type === 'header' && part.headerText !== undefined && part.headerLevel !== undefined) {
        // Professional typography hierarchy
        const getHeaderClass = (level: number) => {
          switch (level) {
            case 1: return "text-3xl font-bold mb-0.5 mt-0 text-slate-900 dark:text-slate-100"; // # - Largest
            case 2: return "text-2xl font-bold mb-0.5 mt-0 text-slate-800 dark:text-slate-200"; // ## - Second largest
            case 3: return "text-xl font-semibold mb-0.5 mt-0 text-slate-700 dark:text-slate-300"; // ### - Third largest
            case 4: return "text-lg font-semibold mb-0.5 mt-0 text-slate-600 dark:text-slate-400"; // #### - Fourth largest
            case 5: return "text-base font-medium mb-0.5 mt-0 text-slate-600 dark:text-slate-400"; // ##### - Normal size
            case 6: return "text-sm font-medium mb-0.5 mt-0 text-slate-500 dark:text-slate-500"; // ###### - Smallest
            default: return "text-base font-normal mb-1 mt-0";
          }
        };
        
        const headerClass = getHeaderClass(part.headerLevel);
        const headerTag = `h${Math.min(part.headerLevel, 6)}`;
        
          elements.push(
          React.createElement(
            headerTag,
            {
              key: `header-${elementIndex++}`,
              className: headerClass
            },
            part.headerText
          )
          );
      } else if (part.type === 'hr') {
        elements.push(
          <hr key={`hr-${elementIndex++}`} className="mt-0 mb-1 border-t border-gray-300 dark:border-gray-600" />
        );
      } else if (part.type === 'bullet' && part.bulletText !== undefined) {
        // Process bullet text for inline formatting (bold, inline code)
        const processBulletText = (text: string) => {
          // Step 1: Protect code blocks with placeholders
          const codeBlocks: string[] = [];
          const inlineCodeRegex = /`([^`]+)`/g;
          const textWithCodePlaceholders = text.replace(inlineCodeRegex, (match, code) => {
            const index = codeBlocks.length;
            codeBlocks.push(code);
            return `__CODE_PLACEHOLDER_${index}__`;
          });

          // Step 2: Process bold text
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const boldMatches = Array.from(textWithCodePlaceholders.matchAll(boldRegex));
          for (const match of boldMatches) {
            // Add text before bold
            if (match.index! > lastIndex) {
              const beforeText = textWithCodePlaceholders.slice(lastIndex, match.index);
              parts.push(processBulletItalicAndCode(beforeText, `bullet-before-bold-${partIndex++}`, codeBlocks));
            }
            
            // Add bold text (process italic inside bold)
            parts.push(
              <strong key={`bullet-bold-${partIndex++}`} className="font-semibold">
                {processBulletItalicAndCode(match[1], `bullet-inside-bold-${partIndex}`, codeBlocks)}
              </strong>
            );
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < textWithCodePlaceholders.length) {
            const remainingText = textWithCodePlaceholders.slice(lastIndex);
            parts.push(processBulletItalicAndCode(remainingText, `bullet-remaining-${partIndex++}`, codeBlocks));
          }
          
          return parts.length > 0 ? parts : [processBulletItalicAndCode(textWithCodePlaceholders, `bullet-full-${partIndex++}`, codeBlocks)];
        };
        
        const processBulletItalicAndCode = (text: string, key: string, codeBlocks: string[]) => {
          // Step 3: Process italic text (single asterisks, but not double, and not at start of line for bullets)
          const italicRegex = /(?<!\*|^[\s]*)\*([^*\n]+)\*(?!\*)/g;
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const italicMatches = Array.from(text.matchAll(italicRegex));
          for (const match of italicMatches) {
            // Add text before italic
            if (match.index! > lastIndex) {
              const beforeText = text.slice(lastIndex, match.index);
              parts.push(restoreBulletCodeBlocks(beforeText, `${key}-before-italic-${partIndex++}`, codeBlocks));
            }
            
            // Add italic text (subtle italic style)
            parts.push(
              <em key={`${key}-italic-${partIndex++}`} className="italic font-normal" style={{ fontStyle: 'italic', fontWeight: 'inherit' }}>
                {restoreBulletCodeBlocks(match[1], `${key}-inside-italic-${partIndex}`, codeBlocks)}
              </em>
            );
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            parts.push(restoreBulletCodeBlocks(remainingText, `${key}-remaining-${partIndex++}`, codeBlocks));
          }
          
          return parts.length > 0 ? parts : [restoreBulletCodeBlocks(text, `${key}-full-${partIndex++}`, codeBlocks)];
        };
        
        const restoreBulletCodeBlocks = (text: string, key: string, codeBlocks: string[]) => {
          // Step 4: Restore code blocks from placeholders
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const placeholderRegex = /__CODE_PLACEHOLDER_(\d+)__/g;
          const placeholderMatches = Array.from(text.matchAll(placeholderRegex));
          
          for (const match of placeholderMatches) {
            // Add text before code
            if (match.index! > lastIndex) {
              const beforeText = text.slice(lastIndex, match.index);
              if (beforeText.length > 0) {
                parts.push(beforeText);
              }
            }
            
            // Add code block
            const codeIndex = parseInt(match[1]);
            if (codeIndex < codeBlocks.length) {
              parts.push(
                <code 
                  key={`${key}-code-${partIndex++}`}
                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono"
                >
                  {codeBlocks[codeIndex]}
                </code>
              );
            }
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            if (remainingText.length > 0) {
              parts.push(remainingText);
            }
          }
          
          return parts.length > 0 ? parts : [text];
        };
        
        const processInlineCode = (text: string, key: string) => {
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const inlineMatches = Array.from(text.matchAll(inlineCodeRegex));
          for (const match of inlineMatches) {
            // Add text before inline code
            if (match.index! > lastIndex) {
              parts.push(text.slice(lastIndex, match.index));
            }
            
            // Add inline code
            parts.push(
              <code 
                key={`bullet-inline-code-${key}-${partIndex++}`}
                className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono"
              >
                {match[1]}
              </code>
            );
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
          }
          
          return parts.length > 0 ? parts : [text];
        };
        
        const bulletContent = processBulletText(part.bulletText);
        elements.push(
          <div key={`bullet-${elementIndex++}`} className="relative pl-6 mb-0 mt-1 ml-4">
            <span className="absolute left-0 top-0 text-slate-600 dark:text-slate-400 font-bold leading-snug">•</span>
            <div className="leading-snug">
              {bulletContent}
            </div>
          </div>
        );
      } else if (part.type === 'subBullet' && part.subBulletText !== undefined) {
        // Process sub-bullet text for inline formatting (bold, inline code)
        const processSubBulletText = (text: string) => {
          // Step 1: Protect code blocks with placeholders
          const codeBlocks: string[] = [];
          const inlineCodeRegex = /`([^`]+)`/g;
          let textWithCodePlaceholders = text.replace(inlineCodeRegex, (match, code) => {
            const index = codeBlocks.length;
            codeBlocks.push(code);
            return `__CODE_PLACEHOLDER_${index}__`;
          });

          // Step 2: Process bold text
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const boldMatches = Array.from(textWithCodePlaceholders.matchAll(boldRegex));
          for (const match of boldMatches) {
            // Add text before bold
            if (match.index! > lastIndex) {
              const beforeText = textWithCodePlaceholders.slice(lastIndex, match.index);
              parts.push(processSubBulletItalicAndCode(beforeText, `subbullet-before-bold-${partIndex++}`, codeBlocks));
            }
            
            // Add bold text (process italic inside bold)
            parts.push(
              <strong key={`subbullet-bold-${partIndex++}`} className="font-semibold">
                {processSubBulletItalicAndCode(match[1], `subbullet-inside-bold-${partIndex}`, codeBlocks)}
              </strong>
            );
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < textWithCodePlaceholders.length) {
            const remainingText = textWithCodePlaceholders.slice(lastIndex);
            parts.push(processSubBulletItalicAndCode(remainingText, `subbullet-remaining-${partIndex++}`, codeBlocks));
          }
          
          return parts.length > 0 ? parts : [processSubBulletItalicAndCode(textWithCodePlaceholders, `subbullet-full-${partIndex++}`, codeBlocks)];
        };
        
        const processSubBulletItalicAndCode = (text: string, key: string, codeBlocks: string[]) => {
          // Step 3: Process italic text (single asterisks, but not double, and not at start of line for bullets)
          const italicRegex = /(?<!\*|^[\s]*)\*([^*\n]+)\*(?!\*)/g;
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const italicMatches = Array.from(text.matchAll(italicRegex));
          for (const match of italicMatches) {
            // Add text before italic
            if (match.index! > lastIndex) {
              const beforeText = text.slice(lastIndex, match.index);
              parts.push(restoreSubBulletCodeBlocks(beforeText, `${key}-before-italic-${partIndex++}`, codeBlocks));
            }
            
            // Add italic text (subtle italic style)
            parts.push(
              <em key={`${key}-italic-${partIndex++}`} className="italic font-normal" style={{ fontStyle: 'italic', fontWeight: 'inherit' }}>
                {restoreSubBulletCodeBlocks(match[1], `${key}-inside-italic-${partIndex}`, codeBlocks)}
              </em>
            );
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            parts.push(restoreSubBulletCodeBlocks(remainingText, `${key}-remaining-${partIndex++}`, codeBlocks));
          }
          
          return parts.length > 0 ? parts : [restoreSubBulletCodeBlocks(text, `${key}-full-${partIndex++}`, codeBlocks)];
        };
        
        const restoreSubBulletCodeBlocks = (text: string, key: string, codeBlocks: string[]) => {
          // Step 4: Restore code blocks from placeholders
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const placeholderRegex = /__CODE_PLACEHOLDER_(\d+)__/g;
          const placeholderMatches = Array.from(text.matchAll(placeholderRegex));
          
          for (const match of placeholderMatches) {
            // Add text before code
            if (match.index! > lastIndex) {
              const beforeText = text.slice(lastIndex, match.index);
              if (beforeText.length > 0) {
                parts.push(beforeText);
              }
            }
            
            // Add code block
            const codeIndex = parseInt(match[1]);
            if (codeIndex < codeBlocks.length) {
              parts.push(
                <code 
                  key={`${key}-code-${partIndex++}`}
                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono"
                >
                  {codeBlocks[codeIndex]}
                </code>
              );
            }
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            if (remainingText.length > 0) {
              parts.push(remainingText);
            }
          }
          
          return parts.length > 0 ? parts : [text];
        };
        
        const subBulletContent = processSubBulletText(part.subBulletText);
        elements.push(
          <div key={`subBullet-${elementIndex++}`} className="relative pl-6 mb-0 mt-0.5 ml-8">
            <span className="absolute left-0 top-0 text-slate-600 dark:text-slate-400 font-bold leading-relaxed">◦</span>
            <div className="leading-relaxed">
              {subBulletContent}
            </div>
          </div>
        );
      } else if (part.type === 'numbered' && part.numberedText !== undefined) {
        // Process numbered text for inline formatting (bold, inline code)
        const processNumberedText = (text: string) => {
          // Step 1: Protect code blocks with placeholders
          const codeBlocks: string[] = [];
          const inlineCodeRegex = /`([^`]+)`/g;
          let textWithCodePlaceholders = text.replace(inlineCodeRegex, (match, code) => {
            const index = codeBlocks.length;
            codeBlocks.push(code);
            return `__CODE_PLACEHOLDER_${index}__`;
          });

          // Step 2: Process bold text
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const boldMatches = Array.from(textWithCodePlaceholders.matchAll(boldRegex));
          for (const match of boldMatches) {
            // Add text before bold
            if (match.index! > lastIndex) {
              const beforeText = textWithCodePlaceholders.slice(lastIndex, match.index);
              parts.push(processNumberedItalicAndCode(beforeText, `numbered-before-bold-${partIndex++}`, codeBlocks));
            }
            
            // Add bold text (process italic inside bold)
            parts.push(
              <strong key={`numbered-bold-${partIndex++}`} className="font-semibold">
                {processNumberedItalicAndCode(match[1], `numbered-inside-bold-${partIndex}`, codeBlocks)}
              </strong>
            );
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < textWithCodePlaceholders.length) {
            const remainingText = textWithCodePlaceholders.slice(lastIndex);
            parts.push(processNumberedItalicAndCode(remainingText, `numbered-remaining-${partIndex++}`, codeBlocks));
          }
          
          return parts.length > 0 ? parts : [processNumberedItalicAndCode(textWithCodePlaceholders, `numbered-full-${partIndex++}`, codeBlocks)];
        };
        
        const processNumberedItalicAndCode = (text: string, key: string, codeBlocks: string[]) => {
          // Step 3: Process italic text (single asterisks, but not double, and not at start of line for bullets)
          const italicRegex = /(?<!\*|^[\s]*)\*([^*\n]+)\*(?!\*)/g;
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const italicMatches = Array.from(text.matchAll(italicRegex));
          for (const match of italicMatches) {
            // Add text before italic
            if (match.index! > lastIndex) {
              const beforeText = text.slice(lastIndex, match.index);
              parts.push(restoreNumberedCodeBlocks(beforeText, `${key}-before-italic-${partIndex++}`, codeBlocks));
            }
            
            // Add italic text (subtle italic style)
            parts.push(
              <em key={`${key}-italic-${partIndex++}`} className="italic font-normal" style={{ fontStyle: 'italic', fontWeight: 'inherit' }}>
                {restoreNumberedCodeBlocks(match[1], `${key}-inside-italic-${partIndex}`, codeBlocks)}
              </em>
            );
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            parts.push(restoreNumberedCodeBlocks(remainingText, `${key}-remaining-${partIndex++}`, codeBlocks));
          }
          
          return parts.length > 0 ? parts : [restoreNumberedCodeBlocks(text, `${key}-full-${partIndex++}`, codeBlocks)];
        };
        
        const restoreNumberedCodeBlocks = (text: string, key: string, codeBlocks: string[]) => {
          // Step 4: Restore code blocks from placeholders
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const placeholderRegex = /__CODE_PLACEHOLDER_(\d+)__/g;
          const placeholderMatches = Array.from(text.matchAll(placeholderRegex));
          
          for (const match of placeholderMatches) {
            // Add text before code
            if (match.index! > lastIndex) {
              const beforeText = text.slice(lastIndex, match.index);
              if (beforeText.length > 0) {
                parts.push(beforeText);
              }
            }
            
            // Add code block
            const codeIndex = parseInt(match[1]);
            if (codeIndex < codeBlocks.length) {
              parts.push(
                <code 
                  key={`${key}-code-${partIndex++}`}
                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono"
                >
                  {codeBlocks[codeIndex]}
                </code>
              );
            }
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            if (remainingText.length > 0) {
              parts.push(remainingText);
            }
          }
          
          return parts.length > 0 ? parts : [text];
        };
        
        const numberedContent = processNumberedText(part.numberedText);
        elements.push(
          <div key={`numbered-${elementIndex++}`} className="relative pl-6 mb-0 mt-1 ml-4">
            <span className="absolute left-0 top-0 text-slate-600 dark:text-slate-400 font-bold leading-snug">{part.number}.</span>
            <div className="leading-snug">
              {numberedContent}
            </div>
          </div>
        );
      } else if (part.type === 'table' && part.tableData !== undefined) {
        elements.push(
          <TableComponent 
            key={`table-${elementIndex++}`} 
            data={part.tableData}
            headers={part.tableHeaders}
          />
        );
      } else if (part.type === 'image' && part.imageSrc !== undefined) { // New: Render images
        elements.push(
          <img
            key={`image-${elementIndex++}`}
            src={part.imageSrc}
            alt={part.imageAlt || ''}
            className="my-2 max-w-full h-auto max-h-[50vh] object-contain"
          />
        );
      } else if (part.type === 'text') {
        // Process regular text for inline formatting
        const processInlineFormatting = (text: string) => {
          // Step 1: Protect code blocks with placeholders
          const codeBlocks: string[] = [];
          const inlineCodeRegex = /`([^`]+)`/g;
          let textWithCodePlaceholders = text.replace(inlineCodeRegex, (match, code) => {
            const index = codeBlocks.length;
            codeBlocks.push(code);
            return `__CODE_PLACEHOLDER_${index}__`;
          });

          // Step 2: Process bold text
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const boldMatches = Array.from(textWithCodePlaceholders.matchAll(boldRegex));
          for (const match of boldMatches) {
            // Add text before bold
            if (match.index! > lastIndex) {
              const beforeText = textWithCodePlaceholders.slice(lastIndex, match.index);
              parts.push(processTextItalicAndCode(beforeText, `before-bold-${partIndex++}`, codeBlocks));
            }
            
            // Add bold text (process italic inside bold)
            parts.push(
              <strong key={`bold-${partIndex++}`} className="font-semibold">
                {processTextItalicAndCode(match[1], `inside-bold-${partIndex}`, codeBlocks)}
              </strong>
            );
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < textWithCodePlaceholders.length) {
            const remainingText = textWithCodePlaceholders.slice(lastIndex);
            parts.push(processTextItalicAndCode(remainingText, `remaining-${partIndex++}`, codeBlocks));
          }
          
          return parts.length > 0 ? parts : [processTextItalicAndCode(textWithCodePlaceholders, `full-${partIndex++}`, codeBlocks)];
        };
        
        const processTextItalicAndCode = (text: string, key: string, codeBlocks: string[]) => {
          // Step 3: Process italic text (single asterisks, but not double)
          const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g;
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const italicMatches = Array.from(text.matchAll(italicRegex));
          for (const match of italicMatches) {
            // Add text before italic
            if (match.index! > lastIndex) {
              const beforeText = text.slice(lastIndex, match.index);
              parts.push(restoreTextCodeBlocks(beforeText, `${key}-before-italic-${partIndex++}`, codeBlocks));
            }
            
            // Add italic text (subtle italic style)
            parts.push(
              <em key={`${key}-italic-${partIndex++}`} className="italic font-normal" style={{ fontStyle: 'italic', fontWeight: 'inherit' }}>
                {restoreTextCodeBlocks(match[1], `${key}-inside-italic-${partIndex}`, codeBlocks)}
              </em>
            );
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            parts.push(restoreTextCodeBlocks(remainingText, `${key}-remaining-${partIndex++}`, codeBlocks));
          }
          
          return parts.length > 0 ? parts : [restoreTextCodeBlocks(text, `${key}-full-${partIndex++}`, codeBlocks)];
        };
        
        const restoreTextCodeBlocks = (text: string, key: string, codeBlocks: string[]) => {
          // Step 4: Restore code blocks from placeholders
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const placeholderRegex = /__CODE_PLACEHOLDER_(\d+)__/g;
          const placeholderMatches = Array.from(text.matchAll(placeholderRegex));
          
          for (const match of placeholderMatches) {
            // Add text before code
            if (match.index! > lastIndex) {
              const beforeText = text.slice(lastIndex, match.index);
              if (beforeText.length > 0) {
                parts.push(beforeText);
              }
            }
            
            // Add code block
            const codeIndex = parseInt(match[1]);
            if (codeIndex < codeBlocks.length) {
              parts.push(
                <code 
                  key={`${key}-code-${partIndex++}`}
                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono"
                >
                  {codeBlocks[codeIndex]}
                </code>
              );
            }
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            if (remainingText.length > 0) {
              parts.push(remainingText);
            }
          }
          
          return parts.length > 0 ? parts : [text];
        };
        
        const processInlineCode = (text: string, key: string) => {
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          const inlineMatches = Array.from(text.matchAll(inlineCodeRegex));
          for (const match of inlineMatches) {
            // Add text before inline code
            if (match.index! > lastIndex) {
              parts.push(text.slice(lastIndex, match.index));
            }
            
            // Add inline code
            parts.push(
              <code 
                key={`inline-code-${key}-${partIndex++}`}
                className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono"
              >
                {match[1]}
              </code>
            );
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
          }
          
          return parts.length > 0 ? parts : [text];
        };
        
        const formattedContent = processInlineFormatting(part.text);
        elements.push(
          <div key={`text-${elementIndex++}`} className="whitespace-pre-wrap mb-1 mt-0 break-words max-w-full overflow-hidden">
            {formattedContent}
          </div>
        );
      }
    }
    
    return elements;
  };

  return (
    <div className="space-y-0.5 w-full min-w-0">
      {parseMarkdown(content)}
    </div>
  );
};

export default MarkdownResponse;