"use client";

import { SettingsPanelTrigger } from "@/components/data_panel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/breadcrumb";
import { Button } from "@/components/button";
import { ScrollArea } from "@/components/scroll-area";
import { getApiHeaders } from "@/lib/user-session";
import {
  RiCloseLine,
  RiShining2Line,
  RiArrowUpSLine,
  RiRobot2Line,
  RiQuestionAnswerLine,
  RiKeyboardLine,
  RiLoader4Line,
  RiCheckLine,
  RiBookOpenLine,
  RiFileCopyLine,
  RiQuestionLine,
  RiDownloadLine
} from "@remixicon/react";
import { ChatMessage } from "@/components/chat-message";
import { useRef, useEffect, useState, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip";
import MarkdownResponse from "@/components/markdown-response";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import {
  Message,
  ChatMode,
  loadFromLocalStorage,
  saveToLocalStorage,
  clearChatStorage,
  CHAT_MESSAGES_KEY,
  CHAT_MODE_KEY,
  CHAT_INPUT_KEY
} from "@/lib/chat-storage";
import { useDatasetContext } from "@/lib/dataset-context";
import { SQLSyntaxHighlighter } from "@/components/sql-syntax-highlighter";
import { getApiConfig } from "@/lib/api-config";

// Helper function to format SQL queries by adding line breaks after semicolons
const formatSQLQuery = (sqlText: string): string => {
  return sqlText
    .split(';')
    .map(statement => statement.trim())
    .filter(statement => statement.length > 0)
    .join(';\n') + (sqlText.endsWith(';') ? '' : '');
};

// Enhanced Copy Button Component
interface CopyButtonProps {
  text: string;
  id: string;
  label: string;
  isCopied: boolean;
  onCopy: (id: string, text: string) => void;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, id, label, isCopied, onCopy }) => {
  return (
    <button
      onClick={() => onCopy(id, text)}
      className={`
        relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
        transition-all duration-200 ease-out overflow-hidden group
        ${isCopied
          ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-sm'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
        }
      `}
      disabled={isCopied}
    >
      <div className="relative flex items-center gap-1.5">
        {isCopied ? (
          <>
            <RiCheckLine className="size-3 animate-in zoom-in duration-200 text-green-600 dark:text-green-400" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <RiFileCopyLine className="size-3 transition-transform group-hover:scale-110" />
            <span>{label}</span>
          </>
        )}
      </div>

      {/* Subtle success shine effect */}
      {isCopied && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-green-100/40 dark:via-green-800/30 to-transparent animate-in slide-in-from-left duration-500"></div>
      )}
    </button>
  );
};

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { refreshAfterSQLOperation } = useDatasetContext();
  const { endpoints } = getApiConfig();
  const [messages, setMessages] = useState<Message[]>(() => 
    loadFromLocalStorage(CHAT_MESSAGES_KEY, [])
  );
  const [inputValue, setInputValue] = useState(() => 
    loadFromLocalStorage(CHAT_INPUT_KEY, "")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isConfirming, setIsConfirming] = useState<string | null>(null); // Track which message is being confirmed
  const [isRequestingExplanation, setIsRequestingExplanation] = useState(false); // Track explanation request loading
  const [chatMode, setChatMode] = useState<ChatMode>(() => 
    loadFromLocalStorage(CHAT_MODE_KEY, 'agent')
  );
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set()); // Track copied items by unique ID

  // PDF Export function - converts chat to properly formatted PDF
  const exportChatToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the PDF');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    // Function to strip markdown and format content nicely
    const formatMessageContent = (content: string, isUser: boolean) => {
      // Remove markdown syntax and clean up the content
      let cleanContent = content
        // Remove code block markers
        .replace(/```[\s\S]*?```/g, (match) => {
          const codeContent = match.replace(/```(\w+)?\n?/g, '').replace(/```/g, '');
          return `\n[CODE BLOCK]\n${codeContent}\n[/CODE BLOCK]\n`;
        })
        // Remove inline code markers
        .replace(/`([^`]+)`/g, '$1')
        // Remove markdown headers
        .replace(/#{1,6}\s*/g, '')
        // Remove markdown bold/italic
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        // Remove markdown links but keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Clean up extra whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // Convert to HTML with proper formatting
      return cleanContent
        .replace(/\[CODE BLOCK\]\n([\s\S]*?)\n\[\/CODE BLOCK\]/g, 
          '<div style="background: #f5f5f5; padding: 12px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 10px 0; font-family: monospace; white-space: pre-wrap;">$1</div>')
        .replace(/\n/g, '<br>')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    };
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ByeDB Chat Conversation - ${currentDate}</title>
          <meta charset="UTF-8">
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 40px;
              color: #1f2937;
              background: white;
              font-size: 14px;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 25px;
              margin-bottom: 35px;
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              margin: -20px -20px 35px -20px;
              padding: 30px 20px 25px 20px;
            }
            .header h1 {
              color: #1e40af;
              margin: 0 0 8px 0;
              font-size: 28px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .header .subtitle {
              color: #3b82f6;
              font-size: 16px;
              margin: 5px 0;
              font-weight: 500;
            }
            .header .meta {
              color: #6b7280;
              font-size: 13px;
              margin: 8px 0 0 0;
            }
            .conversation-stats {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              margin: 25px 0;
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 15px;
            }
            .stat-item {
              text-align: center;
            }
            .stat-number {
              font-size: 20px;
              font-weight: 700;
              color: #1e40af;
              display: block;
            }
            .stat-label {
              font-size: 11px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 2px;
            }
            .message {
              margin-bottom: 25px;
              page-break-inside: avoid;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .message-header {
              padding: 12px 18px;
              font-weight: 600;
              font-size: 13px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .message-content {
              padding: 18px;
              line-height: 1.7;
              word-wrap: break-word;
              hyphens: auto;
            }
            .user-message .message-header {
              background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
              color: #065f46;
              border-bottom: 1px solid #a7f3d0;
            }
            .user-message .message-content {
              background: #f0fdf4;
              color: #1f2937;
            }
            .ai-message .message-header {
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              color: #1e40af;
              border-bottom: 1px solid #93c5fd;
            }
            .ai-message .message-content {
              background: #f8fafc;
              color: #1f2937;
            }
            .timestamp {
              font-size: 11px;
              color: #6b7280;
              font-weight: 400;
              margin-left: auto;
            }
            .footer {
              margin-top: 40px;
              padding-top: 25px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
            }
            .footer-logo {
              color: #3b82f6;
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .footer-tagline {
              color: #6b7280;
              font-size: 13px;
              margin-bottom: 8px;
              font-style: italic;
            }
            .footer-copyright {
              color: #9ca3af;
              font-size: 11px;
            }
            @media print {
              body { 
                margin: 20px; 
                font-size: 12px;
              }
              .header { 
                page-break-after: avoid;
                margin: -10px -10px 25px -10px;
                padding: 20px 10px 15px 10px;
              }
              .message { 
                margin-bottom: 15px; 
                box-shadow: none;
                border: 1px solid #e5e7eb;
              }
              .conversation-stats {
                margin: 15px 0;
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ByeDB Chat Conversation</h1>
            <div class="subtitle">Natural Language to SQL Made Simple</div>
            <div class="meta">
              Exported on ${currentDate} at ${currentTime}
            </div>
          </div>
          
          <div class="conversation-stats">
            <div class="stat-item">
              <span class="stat-number">${messages.length}</span>
              <div class="stat-label">Total Messages</div>
            </div>
            <div class="stat-item">
              <span class="stat-number">${messages.filter(m => m.isUser).length}</span>
              <div class="stat-label">User Messages</div>
            </div>
            <div class="stat-item">
              <span class="stat-number">${messages.filter(m => !m.isUser).length}</span>
              <div class="stat-label">AI Responses</div>
            </div>
            <div class="stat-item">
              <span class="stat-number">${Math.round((messages.length > 0 ? (messages.filter(m => !m.isUser).length / messages.filter(m => m.isUser).length) * 100 : 0))}%</span>
              <div class="stat-label">Response Rate</div>
            </div>
          </div>
          
          ${messages.map((message, index) => `
            <div class="message ${message.isUser ? 'user-message' : 'ai-message'}">
              <div class="message-header">
                <span>${message.isUser ? '👤 You' : '🤖 ByeDB AI'}</span>
                <span class="timestamp">${new Date(message.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}</span>
              </div>
              <div class="message-content">
                ${formatMessageContent(message.content, message.isUser)}
              </div>
            </div>
          `).join('')}
          
          <div class="footer">
            <div class="footer-logo">ByeDB.AI</div>
            <div class="footer-tagline">Enterprise-grade multiagent AI platform for autonomous database intelligence</div>
            <div class="footer-copyright">© 2025 ByeDB. All rights reserved.</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    // Close the print window after printing
    printWindow.addEventListener('afterprint', () => {
      printWindow.close();
    });
  };

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage(CHAT_MESSAGES_KEY, messages);
  }, [messages]);

  // Persist chat mode to localStorage whenever it changes
  useEffect(() => {
    saveToLocalStorage(CHAT_MODE_KEY, chatMode);
  }, [chatMode]);

  // Persist input value to localStorage with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToLocalStorage(CHAT_INPUT_KEY, inputValue);
    }, 500); // Debounce input saving by 500ms

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  // Register keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+I for Agent mode
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        setChatMode('agent');
      }
      // Ctrl+L for Ask mode
      else if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        setChatMode('ask');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set minimum height
    const minHeight = 84;
    
    // Calculate the line height (assuming 1.5 line-height and 15px font size)
    const lineHeight = 22.5; // 15px * 1.5
    
    // Calculate max height (about 8 lines)
    const maxHeight = Math.max(minHeight, lineHeight * 8);
    
    // Set the height based on content, but within min/max bounds
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    // Use requestAnimationFrame for smooth height adjustment
    const frameId = requestAnimationFrame(() => {
      adjustTextareaHeight();
    });

    return () => cancelAnimationFrame(frameId);
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Disable all previous confirmation buttons when sending a new message
    setMessages(prev => prev.map(msg => {
      if (msg.requiresConfirmation && !msg.confirmationData?.executed) {
        return {
          ...msg,
          confirmationData: {
            ...msg.confirmationData,
            disabled: true
          }
        };
      }
      return msg;
    }));

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const question = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    
    // Reset textarea height after sending message
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = '84px';
      }
    }, 0);

    try {
      // Call the backend API
      const response = await fetch(endpoints.sqlQuestion, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          question: question,
          mode: chatMode // Include the current mode in the request
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      const requiresApproval = data.meta?.requires_approval === true || data.requires_approval === true;
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.success ? data.response : `Error: ${data.error}`,
        isUser: false,
        timestamp: new Date(),
        requiresConfirmation: requiresApproval,
        confirmationData: data.meta || data // Always store response data to access function_called
      };

      console.log('AI Response Message:', aiResponse); // Debug log

      setMessages(prev => [...prev, aiResponse]);

      // Refresh datasets after SQL operations (for non-confirmation responses)
      if (!requiresApproval && data.meta?.function_called && data.meta.function_called.length > 0) {
        // Get all SQL queries from function calls
        const sqlQueries = data.meta.function_called
          .filter((func: any) => func.args?.text)
          .map((func: any) => func.args.text);
        
        if (sqlQueries.length > 0) {
          // For multiple queries, we can combine them or just use the first one for refresh
          // The refresh function typically checks for data modifications, so any query should trigger it
          await refreshAfterSQLOperation(sqlQueries[0]);
        }
      }
    } catch (error) {
      console.error('Error calling API:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble connecting to the server. Please make sure the backend is running on http://localhost:8000",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmExecution = async (confirmationData: any, messageId: string) => {
    setIsConfirming(messageId); // Set loading state for this specific message
    try {
      const response = await fetch(endpoints.continueExecution, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          approve: true,
          context: "User confirmed execution"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update the original message to mark it as executed and add execution results
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            confirmationData: {
              ...msg.confirmationData,
              executed: true,
              executionResult: data.success ? data.response : `Error: ${data.error}`,
              function_called: data.function_called || msg.confirmationData?.function_called
            }
          };
        }
        return msg;
      }));

      // Refresh datasets after SQL execution
      if (data.function_called && data.function_called.length > 0) {
        // Get all SQL queries from function calls
        const sqlQueries = data.function_called
          .filter((func: any) => func.args?.text)
          .map((func: any) => func.args.text);
        
        if (sqlQueries.length > 0) {
          // For multiple queries, we can combine them or just use the first one for refresh
          // The refresh function typically checks for data modifications, so any query should trigger it
          await refreshAfterSQLOperation(sqlQueries[0]);
        }
      }
    } catch (error) {
      console.error('Error confirming execution:', error);
      const errorResponse: Message = {
        id: Date.now().toString() + '_confirm_error',
        content: "Sorry, I'm having trouble executing the confirmation. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsConfirming(null); // Clear loading state
    }
  };

  const handleRequestExplanation = async () => {
    const explanationMessage = "Please provide a detailed explanation of the SQL operations that were just executed.";
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: explanationMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsRequestingExplanation(true);

    try {
      // Call the backend API with ask mode to avoid SQL execution
      const response = await fetch(endpoints.sqlQuestion, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          question: explanationMessage,
          mode: 'agent'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.success ? data.response : `Error: ${data.error}`,
        isUser: false,
        timestamp: new Date(),
        confirmationData: data.meta || data // Store response data to access function_called
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error requesting explanation:', error);
      const errorResponse: Message = {
        id: Date.now().toString() + '_explanation_error',
        content: "Sorry, I'm having trouble getting an explanation. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsRequestingExplanation(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    try {
      // Clear memory on backend
      const response = await fetch(endpoints.clearMemory, {
        method: 'POST',
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        console.error('Failed to clear backend memory:', response.statusText);
      }
      
      // Refresh datasets after clearing memory as it might affect dataset state
      await refreshAfterSQLOperation();
    } catch (error) {
      console.error('Error clearing backend memory:', error);
    }

    // Clear frontend chat and localStorage
    setMessages([]);
    setInputValue("");
    clearChatStorage();
    setShowClearDialog(false);
  };

  // Enhanced copy handler with visual feedback
  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(id));
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedItems(prev => new Set(prev).add(id));
        setTimeout(() => {
          setCopiedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }, 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  const enhancePrompt = async () => {
    if (!inputValue.trim() || isEnhancing) return;
    
    setIsEnhancing(true);
    
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: inputValue.trim(),
        }),
      });

      if (!response.ok) {
        if (response.status === 408) {
          throw new Error('Request timeout - please try a shorter prompt');
        }
        throw new Error('Failed to enhance prompt');
      }

      const data = await response.json();
      const enhancedText = data.enhancedPrompt.replace(/\s+/g, ' ').trim();

      // Check if enhanced text is short enough for instant display
      const shouldUseInstantMode = enhancedText.length < 100;

      if (shouldUseInstantMode) {
        // Instant mode for short responses
        setInputValue(enhancedText);
        setIsEnhancing(false);
      } else {
        // Clear current input and start typing animation
        setInputValue("");
        
        // Typing animation effect for longer responses
        let currentIndex = 0;
        const typingInterval = setInterval(() => {
          if (currentIndex < enhancedText.length) {
            setInputValue(enhancedText.substring(0, currentIndex + 1));
            currentIndex++;
          } else {
            clearInterval(typingInterval);
            setIsEnhancing(false);
          }
        }, 15); // Faster typing speed (15ms per character)
      }

    } catch (error) {
      console.error('Error enhancing prompt:', error);
      setIsEnhancing(false);
      // Optionally show error message to user
    }
  };

  return (
    <div className="flex-1 w-full min-w-0 shadow-md md:rounded-s-[inherit] xl:rounded-e-3xl bg-background flex flex-col h-full overflow-hidden">
      {/* Confirmation Dialog for Clear Chat */}
      <ConfirmationDialog
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete your chat history and remove your data from our servers."
        confirmText="Continue"
        cancelText="Cancel"
        onConfirm={handleClearChat}
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
      />
      
      {/* Header */}
      <div className="py-3 sm:py-4 lg:py-5 px-3 sm:px-4 md:px-6 lg:px-8 bg-background sticky top-0 z-10 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06] shrink-0">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <Breadcrumb>
            <BreadcrumbList className="sm:gap-1.5">
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbLink href="#">Playground</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Chat</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="text-xs px-2 sm:px-3"
              disabled={messages.length === 0}
            >
              <span className="hidden sm:inline">Clear Chat</span>
              <span className="sm:hidden">Clear</span>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="size-8"
                    onClick={exportChatToPDF}
                    disabled={messages.length === 0}
                  >
                    <RiDownloadLine
                      className="text-muted-foreground/70"
                      size={16}
                      aria-hidden="true"
                    />
                    <span className="sr-only">Export to PDF</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export conversation to PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <SettingsPanelTrigger />
          </div>
        </div>
      </div>

      {/* Messages - Scrollable area */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 pb-4 h-full">
          <div className="max-w-4xl mx-auto mt-4 sm:mt-6 space-y-4 pb-6 min-w-0">{/* Responsive max-width and margins */}
            {messages.length === 0 ? (
              <div className="text-center my-8">
                <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-full border border-blue-200/60 dark:border-blue-800/40 shadow-sm text-xs font-medium py-1.5 px-3 text-blue-700 dark:text-blue-300">
                  <RiShining2Line
                    className="me-1.5 text-blue-600 dark:text-blue-400 animate-pulse"
                    size={14}
                    aria-hidden="true"
                  />
                  Start a conversation
                </div>

              </div>
            ) : (
              <>
                <div className="text-center my-8">
                  <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-full border border-blue-200/60 dark:border-blue-800/40 shadow-sm text-xs font-medium py-1.5 px-3 text-blue-700 dark:text-blue-300">
                    <RiShining2Line
                      className="me-1.5 text-blue-600 dark:text-blue-400 animate-pulse"
                      size={14}
                      aria-hidden="true"
                    />
                    Today
                  </div>
                </div>
                {messages.map((message, index) => (
                  <div key={message.id} className={`${index > 0 && messages[index-1].isUser !== message.isUser ? "mt-6" : ""} w-full min-w-0`}>
                    <ChatMessage isUser={message.isUser} content={message.content}>
                      {message.isUser ? (
                        <div className="break-words max-w-full">
                          <p>{message.content}</p>
                        </div>
                      ) : message.requiresConfirmation ? (
                        <div className="space-y-3">
                          {/* Original confirmation message */}
                          <p>I need your confirmation to execute {message.confirmationData?.function_called?.length > 1 ? 'these SQL queries' : 'this SQL query'}:</p>
                          {message.confirmationData?.function_called && message.confirmationData.function_called.length > 0 && (
                            <div className="space-y-3">
                              {message.confirmationData.function_called.map((func: any, funcIndex: number) => (
                                func.args?.text && (
                                  <div key={funcIndex} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border overflow-hidden">
                                    {message.confirmationData.function_called.length > 1 && (
                                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
                                        SQL Query {funcIndex + 1}:
                                      </div>
                                    )}
                                    <SQLSyntaxHighlighter 
                                      code={formatSQLQuery(func.args.text)}
                                    />
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                          
                          {/* Confirmation button or executed indicator */}
                          {message.confirmationData?.executed ? (
                            <div className="space-y-3">
                              <div className="relative inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm overflow-hidden group">
                                {/* Background glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-green-400/5 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                {/* Animated check icon */}
                                <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
                                  <RiCheckLine className="w-4 h-4 text-white animate-pulse" />
                                  {/* Icon glow */}
                                  <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-sm animate-pulse"></div>
                                </div>
                                
                                {/* Success text with enhanced typography */}
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
                                    Executed Successfully
                                  </span>
                                  <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">
                                    Query completed without errors
                                  </span>
                                </div>
                                
                                {/* Subtle shimmer effect */}
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                              </div>
                              
                            </div>
                          ) : message.confirmationData?.disabled ? (
                            <div className="relative inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-800/40 dark:via-gray-700/30 dark:to-gray-800/40 border border-gray-300/60 dark:border-gray-600/40 shadow-sm overflow-hidden">
                              {/* Disabled icon */}
                              <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-sm">
                                <RiCloseLine className="w-4 h-4 text-white" />
                              </div>
                              
                              {/* Disabled text */}
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wide">
                                  Confirmation Expired
                                </span>
                                <span className="text-xs text-gray-500/70 dark:text-gray-500/70 font-medium">
                                  Execution not confirmed by user
                                </span>
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleConfirmExecution(message.confirmationData, message.id)}
                              disabled={isConfirming === message.id}
                              className={`
                                relative overflow-hidden
                                bg-gradient-to-r from-gray-900 to-black 
                                hover:from-gray-800 hover:to-gray-900
                                text-white font-medium
                                border border-gray-700
                                shadow-lg hover:shadow-xl
                                transition-all duration-300 ease-out
                                focus:outline-none
                                disabled:opacity-70 disabled:cursor-not-allowed
                                group
                              `}
                              size="sm"
                            >
                              <div className="flex items-center gap-2">
                                {isConfirming === message.id ? (
                                  <>
                                    <RiLoader4Line className="size-4 animate-spin" />
                                    <span>Executing...</span>
                                  </>
                                ) : (
                                  <>
                                    <RiCheckLine className="size-4 transition-transform group-hover:scale-110" />
                                    <span>Confirm Execution</span>
                                  </>
                                )}
                              </div>
                              {/* Shine effect overlay */}
                              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out" />
                            </Button>
                          )}
                          
                          {/* Execution results section */}
                          {message.confirmationData?.executed && message.confirmationData?.executionResult && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                                Execution Results:
                              </div>
                              <div className="space-y-3 w-full min-w-0">
                                <MarkdownResponse content={message.confirmationData.executionResult} />
                              </div>
                              
                              {/* Need Explanation Button - After execution results */}
                              <div className="mt-4">
                                <Button
                                  onClick={handleRequestExplanation}
                                  disabled={isRequestingExplanation}
                                  className={`
                                    relative overflow-hidden
                                    bg-gradient-to-r from-gray-900 to-black 
                                    hover:from-gray-800 hover:to-gray-900
                                    text-white font-medium
                                    border border-gray-700
                                    shadow-lg hover:shadow-xl
                                    transition-all duration-300 ease-out
                                    focus:outline-none
                                    disabled:opacity-70 disabled:cursor-not-allowed
                                    group
                                  `}
                                  size="sm"
                                >
                                  <div className="flex items-center gap-2">
                                    {isRequestingExplanation ? (
                                      <>
                                        <RiLoader4Line className="size-4 animate-spin" />
                                        <span>Getting explanation...</span>
                                      </>
                                    ) : (
                                      <>
                                        <RiQuestionLine className="size-4 transition-transform group-hover:scale-110" />
                                        <span>Need Explanation</span>
                                      </>
                                    )}
                                  </div>
                                  {/* Shine effect overlay */}
                                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 w-full min-w-0">
                          {/* Display executed SQL queries for all responses (not just in agent mode) - ABOVE the response */}
                          {message.confirmationData?.function_called && message.confirmationData.function_called.length > 0 && (
                            <div className="space-y-3">
                              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                Executed SQL Queries:
                              </div>
                              {message.confirmationData.function_called.map((func: any, funcIndex: number) => (
                                func.args?.text && (
                                  <div key={funcIndex} className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    {/* SQL Query Header */}
                                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono text-gray-600 dark:text-gray-400">SQL Query {funcIndex + 1}</span>
                                        <CopyButton
                                          text={formatSQLQuery(func.args.text)}
                                          id={`query-${message.id}-${funcIndex}`}
                                          label="Copy Query"
                                          isCopied={copiedItems.has(`query-${message.id}-${funcIndex}`)}
                                          onCopy={handleCopy}
                                        />
                                      </div>
                                    </div>
                                    
                                    {/* SQL Query Code */}
                                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                      <SQLSyntaxHighlighter 
                                        code={formatSQLQuery(func.args.text)}
                                      />
                                    </div>
                                    
                                    {/* Query Result/Response */}
                                    {func.content && (
                                      <div className="bg-gray-25 dark:bg-gray-950">
                                        <div className="bg-gray-75 dark:bg-gray-825 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">Query Result</span>
                                            <CopyButton
                                              text={func.content}
                                              id={`result-${message.id}-${funcIndex}`}
                                              label="Copy Result"
                                              isCopied={copiedItems.has(`result-${message.id}-${funcIndex}`)}
                                              onCopy={handleCopy}
                                            />
                                          </div>
                                        </div>
                                        <div className="p-3 max-h-96 overflow-auto scrollbar-thin">
                                          <pre className="text-xs font-mono whitespace-pre-wrap text-gray-700 dark:text-gray-300 overflow-x-auto break-words max-w-full">
                                            {(() => {
                                              try {
                                                const parsed = JSON.parse(func.content);
                                                // Only display the 'data' field if it exists, otherwise show the full content
                                                const dataToShow = parsed.data !== undefined ? parsed.data : parsed;
                                                return JSON.stringify(dataToShow, null, 2);
                                              } catch (e) {
                                                // If parsing fails, show the raw content
                                                return func.content;
                                              }
                                            })()}
                                          </pre>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                          
                          <div className="w-full min-w-0">
                            <MarkdownResponse content={message.content} />
                          </div>
                          
                          {/* Add explanation button for AI responses in agent mode that have completed function calls */}
                          {chatMode === 'agent' && message.confirmationData?.function_called && message.confirmationData.function_called.length > 0 && message.confirmationData?.executed && (
                            <Button
                              onClick={handleRequestExplanation}
                              disabled={isRequestingExplanation}
                              className={`
                                relative overflow-hidden
                                bg-black
                                hover:bg-gray-800
                                text-white font-medium
                                border border-gray-700
                                shadow-lg hover:shadow-xl
                                transition-all duration-300 ease-out
                                focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900
                                disabled:opacity-70 disabled:cursor-not-allowed
                                group
                              `}
                              size="sm"
                            >
                              <div className="flex items-center gap-2">
                                {isRequestingExplanation ? (
                                  <>
                                    <RiLoader4Line className="size-4 animate-spin" />
                                    <span>Getting explanation...</span>
                                  </>
                                ) : (
                                  <>
                                    <RiBookOpenLine className="size-4 transition-transform group-hover:scale-110" />
                                    <span>Need Explanation?</span>
                                  </>
                                )}
                              </div>
                              {/* Shine effect overlay */}
                              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out" />
                            </Button>
                          )}
                        </div>
                      )}
                    </ChatMessage>
                  </div>
                ))}
                
                {isLoading && (
                  <ChatMessage isUser={false} content="Thinking...">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-muted-foreground/70">Thinking...</span>
                    </div>
                  </ChatMessage>
                )}
              </>
            )}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        </div>
      </ScrollArea>
      
      {/* Fixed Input Area */}
      <div className="shrink-0 py-4 sm:py-6 md:py-8 lg:py-12 px-3 sm:px-4 md:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-[20px] border border-transparent bg-muted transition-colors focus-within:bg-muted/50 focus-within:border-input">
            <textarea
              ref={textareaRef}
              className="flex w-full bg-transparent px-4 py-3 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none resize-none overflow-hidden transition-all duration-200"
              placeholder="Ask me anything..."
              aria-label="Enter your prompt"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ 
                height: '84px',
                minHeight: '84px'
              }}
            />
            {/* Textarea buttons */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 px-3 sm:px-4 pb-3">
              {/* Left buttons - Mode selector */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-1 bg-background/80 hover:bg-background border-muted-foreground/20 rounded-full px-3 transition-all hover:shadow-sm"
                    >
                      {chatMode === 'agent' ? (
                        <RiRobot2Line className="text-primary size-4 mr-1.5" />
                      ) : (
                        <RiQuestionAnswerLine className="text-primary size-4 mr-1.5" />
                      )}
                      <span className="text-sm font-medium hidden sm:inline">
                        {chatMode === 'agent' ? 'Agent' : 'Ask'}
                      </span>
                      <RiArrowUpSLine className="text-muted-foreground size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-[220px] p-2 rounded-xl border-muted-foreground/10 shadow-lg"
                  >
                    <DropdownMenuItem 
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${chatMode === 'agent' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/80'}`}
                      onClick={() => setChatMode('agent')}
                    >
                      <RiRobot2Line className={`size-5 ${chatMode === 'agent' ? 'text-primary' : ''}`} />
                      <div className="flex flex-col">
                        <span className="font-medium">Agent</span>
                        <span className="text-xs text-muted-foreground">Interactive SQL assistant</span>
                      </div>
                      <div className="ml-auto flex items-center rounded bg-muted/80 px-1.5 py-0.5 text-xs text-muted-foreground">
                        <RiKeyboardLine className="mr-1 size-3" />
                        Ctrl+I
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={`flex items-center gap-3 px-3 py-2.5 mt-1 rounded-lg transition-colors ${chatMode === 'ask' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/80'}`}
                      onClick={() => setChatMode('ask')}
                    >
                      <RiQuestionAnswerLine className={`size-5 ${chatMode === 'ask' ? 'text-primary' : ''}`} />
                      <div className="flex flex-col">
                        <span className="font-medium">Ask</span>
                        <span className="text-xs text-muted-foreground">Direct question answering</span>
                      </div>
                      <div className="ml-auto flex items-center rounded bg-muted/80 px-1.5 py-0.5 text-xs text-muted-foreground">
                        <RiKeyboardLine className="mr-1 size-3" />
                        Ctrl+L
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Right buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="icon"
                          className={`rounded-full size-8 border-none transition-[box-shadow] ${!inputValue.trim() || isEnhancing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-background hover:shadow-md'}`}
                          disabled={!inputValue.trim() || isEnhancing}
                          onDoubleClick={(e) => e.preventDefault()}
                          onClick={enhancePrompt}
                        >
                          <img
                            src={inputValue.trim() && !isEnhancing ? "/gemini.png" : "/gemini-disabled.png"}
                            alt={inputValue.trim() && !isEnhancing ? "Gemini" : ""}
                            className="w-5 h-5 object-contain select-none"
                            draggable={false}
                          />
                          <span className="sr-only">Generate</span>
                        </Button>
                        {isEnhancing && (
                          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin pointer-events-none"></div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="dark px-2 py-1 text-xs">
                      <p>Enhance Prompt</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button 
                  className="rounded-full h-8 px-3 sm:px-4" 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                >
                  <span className="hidden sm:inline">
                    {isLoading ? "Sending..." : `${chatMode === 'agent' ? 'Ask ByeDB' : 'Ask ByeDB'}`}
                  </span>
                  <span className="sm:hidden">
                    {isLoading ? "..." : 'Send'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
