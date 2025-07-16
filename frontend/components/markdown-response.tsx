"use client";

import React, { useState } from 'react';
import { Button } from './button';
import { RiFileCopyLine, RiCheckLine } from '@remixicon/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface MarkdownResponseProps {
  content: string;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

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
    <div className="relative my-4 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-center justify-between px-4 py-2 border-b dark:border-slate-700">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase">
          {language}
        </span>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent side="top" className="dark px-2 py-1 text-xs">
              <p>{copied ? 'Copied to clipboard!' : 'Copy code'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
    
    // Find all code blocks first
    const codeBlocks: { start: number; end: number; match: string; language?: string; code: string }[] = [];
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      codeBlocks.push({
        start: match.index,
        end: match.index + match[0].length,
        match: match[0],
        language: match[1] || 'sql',
        code: match[2].trim()
      });
    }
    
    // Process text, handling code blocks specially
    type TextPart = {
      text: string;
      start: number;
      end: number;
      isCode: boolean;
      language?: string;
      code?: string;
    };

    let textParts: TextPart[] = [{ text, start: 0, end: text.length, isCode: false }];
    
    // Split text around code blocks
    for (const block of codeBlocks.reverse()) {
      const newParts: TextPart[] = [];
      for (const part of textParts) {
        if (part.isCode) {
          newParts.push(part);
          continue;
        }
        
        if (block.start >= part.start && block.end <= part.end) {
          // Add text before code block
          if (block.start > part.start) {
            newParts.push({
              text: text.slice(part.start, block.start),
              start: part.start,
              end: block.start,
              isCode: false
            });
          }
          
          // Add code block
          newParts.push({
            text: block.match,
            start: block.start,
            end: block.end,
            isCode: true,
            language: block.language,
            code: block.code
          });
          
          // Add text after code block
          if (block.end < part.end) {
            newParts.push({
              text: text.slice(block.end, part.end),
              start: block.end,
              end: part.end,
              isCode: false
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
      if (part.isCode && part.code !== undefined && part.language !== undefined) {
        elements.push(
          <CodeBlock 
            key={`code-${elementIndex++}`} 
            code={part.code} 
            language={part.language} 
          />
        );
      } else {
        // Process regular text for inline formatting
        const processInlineFormatting = (text: string) => {
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let partIndex = 0;
          
          // Process bold text
          const boldMatches = Array.from(text.matchAll(boldRegex));
          for (const match of boldMatches) {
            // Add text before bold
            if (match.index! > lastIndex) {
              const beforeText = text.slice(lastIndex, match.index);
              parts.push(processInlineCode(beforeText, `before-bold-${partIndex++}`));
            }
            
            // Add bold text
            parts.push(
              <strong key={`bold-${partIndex++}`} className="font-semibold">
                {match[1]}
              </strong>
            );
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            parts.push(processInlineCode(remainingText, `remaining-${partIndex++}`));
          }
          
          return parts.length > 0 ? parts : [processInlineCode(text, `full-${partIndex++}`)];
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
          <div key={`text-${elementIndex++}`} className="whitespace-pre-wrap">
            {formattedContent}
          </div>
        );
      }
    }
    
    return elements;
  };

  return (
    <div className="space-y-2">
      {parseMarkdown(content)}
    </div>
  );
};

export default MarkdownResponse; 