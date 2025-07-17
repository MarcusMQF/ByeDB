"use client";

import React, { useState } from 'react';
import { Button } from './button';
import { RiFileCopyLine, RiCheckLine, RiDownloadLine, RiFileTextLine, RiFileExcelLine, RiTableLine } from '@remixicon/react';
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

  // Process inline formatting for table cells
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
        parts.push(restoreCodeBlocks(beforeText, `${key}-before-italic-${partIndex++}`, codeBlocks));
      }
      
      // Add italic text (subtle italic style)
      parts.push(
        <em key={`${key}-italic-${partIndex++}`} className="italic font-normal" style={{ fontStyle: 'italic', fontWeight: 'inherit' }}>
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
    
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="relative my-2 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-700 shadow-sm max-w-full">
      <div className="flex items-center justify-between px-4 py-2 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <RiTableLine size={16} className="text-slate-600 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Table ({data.length} rows)
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <RiDownloadLine size={16} />
              <span className="ml-1 text-xs">Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportAsMarkdown} className="gap-2">
              <RiFileTextLine size={14} />
              Export as Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportAsCSV} className="gap-2">
              <RiFileTextLine size={14} />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportAsXLSX} className="gap-2">
              <RiFileExcelLine size={14} />
              Export as XLSX
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-x-auto max-w-full">
        <table className="w-full table-fixed min-w-full">
          {headers && headers.length > 0 && (
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b dark:border-slate-700 break-words max-w-xs"
                  >
                    {processInlineFormatting(header)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100 break-words max-w-xs"
                  >
                    {processInlineFormatting(cell)}
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

  return (
    <div className="relative my-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
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
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-slate-800 dark:text-slate-200 font-mono">
          {code}
        </code>
      </pre>
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
    const bulletRegex = /^-\s+(.+)$/gm;
    const subBulletRegex = /^[\s]{2,}-\s+(.+)$/gm;
    const numberedRegex = /^(\d+)\.\s+(.+)$/gm;
    const tableRegex = /(?:^\|.*\|$(?:\n^\|.*\|$)*)/gm;
    
    // Find all special elements first
    const codeBlocks: { start: number; end: number; match: string; language?: string; code: string }[] = [];
    const headers: { start: number; end: number; match: string; level: number; text: string }[] = [];
    const hrs: { start: number; end: number; match: string }[] = [];
    const bullets: { start: number; end: number; match: string; text: string }[] = [];
    const subBullets: { start: number; end: number; match: string; text: string }[] = [];
    const numberedItems: { start: number; end: number; match: string; number: string; text: string }[] = [];
    const tables: { start: number; end: number; match: string; data: string[][]; headers?: string[] }[] = [];
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
    const tableBlockRegex = /(?:^[ \t]*\|.*\|[ \t]*$(?:\r?\n|$))+/gm;
    
    while ((match = tableBlockRegex.exec(text)) !== null) {
      const tableText = match[0].trim();
      const rows = tableText.split(/\r?\n/).filter(row => row.trim());
      
      if (rows.length >= 2) {
        // Parse table data
        const parsedRows = rows.map(row => 
          row.split('|')
            .slice(1, -1) // Remove empty first and last elements
            .map(cell => cell.trim())
        ).filter(row => row.length > 0); // Filter out empty rows
        
        // Check if second row is a separator (contains only dashes, spaces, and colons)
        const hasSeparator = parsedRows.length > 1 && parsedRows[1].every(cell => 
          /^[-:\s]*$/.test(cell) && cell.length > 0
        );
        
        let headers: string[] | undefined;
        let data: string[][];
        
        if (hasSeparator) {
          headers = parsedRows[0];
          data = parsedRows.slice(2); // Skip header and separator
        } else {
          data = parsedRows;
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
    
    // Process text, handling special elements
    type TextPart = {
      text: string;
      start: number;
      end: number;
      type: 'text' | 'code' | 'header' | 'hr' | 'bullet' | 'subBullet' | 'numbered' | 'table';
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
      ...tables.map(table => ({ ...table, type: 'table' as const }))
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
            case 1: return "text-3xl font-bold mb-0 mt-0 text-slate-900 dark:text-slate-100"; // # - Largest
            case 2: return "text-2xl font-bold mb-1 mt-2 text-slate-800 dark:text-slate-200"; // ## - Second largest
            case 3: return "text-xl font-semibold mb-1 mt-2 text-slate-700 dark:text-slate-300"; // ### - Third largest
            case 4: return "text-lg font-semibold mb-0.5 mt-1.5 text-slate-600 dark:text-slate-400"; // #### - Fourth largest
            case 5: return "text-base font-medium mb-0.5 mt-1.5 text-slate-600 dark:text-slate-400"; // ##### - Normal size
            case 6: return "text-sm font-medium mb-0.5 mt-1 text-slate-500 dark:text-slate-500"; // ###### - Smallest
            default: return "text-base font-normal mb-1 mt-1";
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
          <hr key={`hr-${elementIndex++}`} className="my-2 border-t border-gray-300 dark:border-gray-600" />
        );
      } else if (part.type === 'bullet' && part.bulletText !== undefined) {
        // Process bullet text for inline formatting (bold, inline code)
        const processBulletText = (text: string) => {
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
          <div key={`bullet-${elementIndex++}`} className="relative pl-6 mb-0.5 ml-4">
            <span className="absolute left-0 top-0 text-slate-600 dark:text-slate-400 font-bold leading-snug">•</span>
            <div className="leading-snug">
              {bulletContent}
            </div>
          </div>
        );
      } else if (part.type === 'subBullet' && part.subBulletText !== undefined) {
        // Simple formatting for sub-bullets
        const subBulletContent = part.subBulletText;
        elements.push(
          <div key={`subBullet-${elementIndex++}`} className="relative pl-6 mb-0.5 ml-8">
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
        
        const numberedContent = processNumberedText(part.numberedText);
        elements.push(
          <div key={`numbered-${elementIndex++}`} className="relative pl-6 mb-0.5 ml-4">
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
          <div key={`text-${elementIndex++}`} className="whitespace-pre-wrap mb-2">
            {formattedContent}
          </div>
        );
      }
    }
    
    return elements;
  };

  return (
    <div className="space-y-1.5">
      {parseMarkdown(content)}
    </div>
  );
};

export default MarkdownResponse; 