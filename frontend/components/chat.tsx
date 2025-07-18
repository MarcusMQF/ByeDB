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
  RiShareLine,
  RiShareCircleLine,
  RiShining2Line,
  RiArrowUpSLine,
  RiRobot2Line,
  RiQuestionAnswerLine,
  RiKeyboardLine,
  RiLoader4Line,
  RiCheckLine,
  RiBookOpenLine
} from "@remixicon/react";
import { ChatMessage } from "@/components/chat-message";
import { useRef, useEffect, useState } from "react";
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

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<Message[]>(() => 
    loadFromLocalStorage(CHAT_MESSAGES_KEY, [])
  );
  const [inputValue, setInputValue] = useState(() => 
    loadFromLocalStorage(CHAT_INPUT_KEY, "")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isConfirming, setIsConfirming] = useState<string | null>(null); // Track which message is being confirmed
  const [chatMode, setChatMode] = useState<ChatMode>(() => 
    loadFromLocalStorage(CHAT_MODE_KEY, 'agent')
  );
  const [showClearDialog, setShowClearDialog] = useState(false);

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
    adjustTextareaHeight();
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

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
      const response = await fetch('http://localhost:8000/api/sql-question', {
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
      const response = await fetch('http://localhost:8000/api/continue-execution', {
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
      
      // Update the original message to remove confirmation and add the result
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            content: data.success ? data.response : `Error: ${data.error}`,
            requiresConfirmation: false,
            confirmationData: {
              ...msg.confirmationData,
              executed: true,
              function_called: data.function_called || msg.confirmationData?.function_called
            }
          };
        }
        return msg;
      }));
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
    const explanationMessage = "Explain in detail what you did, including all commands used, with clear step-by-step descriptions and explanations for each step.";
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: explanationMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call the backend API
      const response = await fetch('http://localhost:8000/api/sql-question', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          question: explanationMessage,
          mode: chatMode
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
      setIsLoading(false);
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
      const response = await fetch('http://localhost:8000/api/clear-memory', {
        method: 'POST',
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        console.error('Failed to clear backend memory:', response.statusText);
      }
    } catch (error) {
      console.error('Error clearing backend memory:', error);
    }

    // Clear frontend chat and localStorage
    setMessages([]);
    setInputValue("");
    clearChatStorage();
    setShowClearDialog(false);
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
        throw new Error('Failed to enhance prompt');
      }

      const data = await response.json();
      const enhancedText = data.enhancedPrompt.replace(/\s+/g, ' ').trim();

      // Clear current input and start typing animation
      setInputValue("");
      
      // Typing animation effect
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < enhancedText.length) {
          setInputValue(enhancedText.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setIsEnhancing(false);
        }
      }, 30); // Adjust speed as needed (30ms per character)

    } catch (error) {
      console.error('Error enhancing prompt:', error);
      setIsEnhancing(false);
      // Optionally show error message to user
    }
  };

  return (
    <div className="flex-1 w-full shadow-md md:rounded-s-[inherit] min-[1024px]:rounded-e-3xl bg-background flex flex-col h-full overflow-hidden">
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
      <div className="py-5 px-4 md:px-6 lg:px-8 bg-background sticky top-0 z-10 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06] shrink-0">
        <div className="flex items-center justify-between gap-2">
          <Breadcrumb>
            <BreadcrumbList className="sm:gap-1.5">
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Playground</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Chat</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="text-xs"
              disabled={messages.length === 0}
            >
              Clear Chat
            </Button>
            <Button variant="outline" size="icon" className="size-8">
              <RiShareLine
                className="text-muted-foreground/70"
                size={16}
                aria-hidden="true"
              />
              <span className="sr-only">Share</span>
            </Button>
            <Button variant="outline" size="icon" className="size-8">
              <RiShareCircleLine
                className="text-muted-foreground/70"
                size={16}
                aria-hidden="true"
              />
              <span className="sr-only">Share publicly</span>
            </Button>
            <SettingsPanelTrigger />
          </div>
        </div>
      </div>

      {/* Messages - Scrollable area */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="px-4 md:px-6 lg:px-8 pb-4 h-full">
          <div className="max-w-3xl mx-auto mt-6 space-y-4 pb-6 min-w-0">{/* Added min-w-0 for proper flex shrinking */}
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
                          <p>I need your confirmation to execute this SQL query:</p>
                          {message.confirmationData?.function_called && message.confirmationData.function_called.length > 0 && (
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border overflow-hidden">
                              <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800 dark:text-gray-200 overflow-x-auto break-words max-w-full">
                                {message.confirmationData.function_called[0]?.args?.text || 'No SQL command found'}
                              </pre>
                            </div>
                          )}
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
                              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
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
                                func.call === 'query_sql' && func.args?.text && (
                                  <div key={funcIndex} className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    {/* SQL Query Header */}
                                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono text-gray-600 dark:text-gray-400">SQL Query {funcIndex + 1}</span>
                                        <button
                                          onClick={() => navigator.clipboard.writeText(func.args.text)}
                                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                        >
                                          Copy Query
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {/* SQL Query Code */}
                                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                      <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800 dark:text-gray-200 overflow-x-auto break-words max-w-full">
                                        {func.args.text}
                                      </pre>
                                    </div>
                                    
                                    {/* Query Result/Response */}
                                    {func.content && (
                                      <div className="bg-gray-25 dark:bg-gray-950">
                                        <div className="bg-gray-75 dark:bg-gray-825 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">Query Result</span>
                                            <button
                                              onClick={() => navigator.clipboard.writeText(func.content)}
                                              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                            >
                                              Copy Result
                                            </button>
                                          </div>
                                        </div>
                                        <div className="p-3 max-h-96 overflow-auto">
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
                          
                          <div className="max-w-full overflow-hidden">
                            <MarkdownResponse content={message.content} />
                          </div>
                          
                          {/* Add explanation button for AI responses in agent mode that have completed function calls */}
                          {chatMode === 'agent' && message.confirmationData?.function_called && message.confirmationData.function_called.length > 0 && message.confirmationData?.executed && (
                            <Button
                              onClick={handleRequestExplanation}
                              disabled={isLoading}
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
                                {isLoading ? (
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
      <div className="shrink-0 py-6 md:py-12 px-4 md:px-6 lg:px-8 bg-background">
        <div className="max-w-3xl mx-auto">
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
            <div className="flex items-center justify-between gap-2 px-4 pb-3">
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
                      <span className="text-sm font-medium">
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
              <div className="flex items-center gap-2">
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
                  className="rounded-full h-8" 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                >
                  {isLoading ? "Sending..." : `${chatMode === 'agent' ? 'Ask ByeDB' : 'Ask ByeDB'}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
