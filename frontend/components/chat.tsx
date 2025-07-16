"use client";

import { SettingsPanelTrigger } from "@/components/settings-panel";
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
import {
  RiCloseLine,
  RiShareLine,
  RiShareCircleLine,
  RiShining2Line,
  RiAttachment2,
  RiMicLine,
} from "@remixicon/react";
import { ChatMessage } from "@/components/chat-message";
import { useRef, useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip";

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "How can I help you?",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleFileUpload = () => {
    if (uploadedFile) return; // Don't allow upload if file already exists
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      alert('Only CSV and Excel files are allowed.');
      return;
    }

    setUploadedFile(file);
    // Clear the input value so the same file can be selected again if needed
    event.target.value = '';
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (extension === '.csv') {
      return '/csv-file.png';
    } else if (extension === '.xls' || extension === '.xlsx') {
      return '/xlsx-file.png';
    }
    return '/csv-file.png'; // fallback
  };

  const getFileTypeLabel = (file: File) => {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (extension === '.csv') {
      return 'CSV File';
    } else if (extension === '.xls' || extension === '.xlsx') {
      return 'Excel File';
    }
    return 'Spreadsheet File';
  };

  return (
    <ScrollArea className="flex-1 [&>div>div]:h-full w-full shadow-md md:rounded-s-[inherit] min-[1024px]:rounded-e-3xl bg-background">
      <div className="h-full flex flex-col px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="py-5 bg-background sticky top-0 z-10 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-gradient-to-r before:from-black/[0.06] before:via-black/10 before:to-black/[0.06]">
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
            <div className="flex items-center gap-1 -my-2 -me-2">
              <Button variant="ghost" className="px-2" onClick={handleClearChat}>
                <RiCloseLine
                  className="text-muted-foreground sm:text-muted-foreground/70 size-5"
                  size={20}
                  aria-hidden="true"
                />
                <span className="max-sm:sr-only">Clear</span>
              </Button>
              <Button variant="ghost" className="px-2">
                <RiShareLine
                  className="text-muted-foreground sm:text-muted-foreground/70 size-5"
                  size={20}
                  aria-hidden="true"
                />
                <span className="max-sm:sr-only">Share</span>
              </Button>
              <Button variant="ghost" className="px-2">
                <RiShareCircleLine
                  className="text-muted-foreground sm:text-muted-foreground/70 size-5"
                  size={20}
                  aria-hidden="true"
                />
                <span className="max-sm:sr-only">Export</span>
              </Button>
              <SettingsPanelTrigger />
            </div>
          </div>
        </div>
        
        {/* Chat */}
        <div className="relative grow">
          <div className="max-w-3xl mx-auto mt-6 space-y-6">
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
                {messages.map((message) => (
                  <ChatMessage key={message.id} isUser={message.isUser}>
                    <p>{message.content}</p>
                  </ChatMessage>
                ))}
                {isLoading && (
                  <ChatMessage isUser={false}>
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
        
        {/* Footer */}
        <div className="sticky bottom-0 pt-4 md:pt-8 z-50">
          <div className="max-w-3xl mx-auto bg-background rounded-[20px] pb-4 md:pb-8">
            <div className="relative rounded-[20px] border border-transparent bg-muted transition-colors focus-within:bg-muted/50 focus-within:border-input">
              {uploadedFile && (
                <div className="px-4 pt-3 pb-2">
                  <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-700/50 dark:border-slate-600/50 shadow-lg backdrop-blur-sm max-w-full" style={{ backgroundColor: '#262626' }}>
                    <img
                      src={getFileIcon(uploadedFile)}
                      alt={getFileTypeLabel(uploadedFile)}
                      className="w-8 h-8 object-contain flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white dark:text-slate-100 whitespace-nowrap tracking-wide">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-slate-300 dark:text-slate-400 mt-1 font-medium whitespace-nowrap">
                        {getFileTypeLabel(uploadedFile)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-slate-300 hover:text-white dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-all duration-200 border border-transparent hover:border-white/20 dark:hover:border-white/10 flex-shrink-0"
                      onClick={() => setUploadedFile(null)}
                    >
                      <RiCloseLine size={18} />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  </div>
                </div>
              )}
              <textarea
                ref={textareaRef}
                className={`flex w-full bg-transparent px-4 py-3 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none [resize:none] ${uploadedFile ? 'min-h-[60px]' : 'sm:min-h-[84px]'}`}
                placeholder={uploadedFile ? "What do you want to know?" : "Ask me anything..."}
                aria-label="Enter your prompt"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {/* Textarea buttons */}
              <div className="flex items-center justify-between gap-2 p-3">
                {/* Left buttons */}
                <div className="flex items-center gap-2">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="icon"
                            className={`rounded-full size-8 border-none hover:bg-background hover:shadow-md transition-[box-shadow] ${uploadedFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleFileUpload}
                            disabled={!!uploadedFile}
                          >
                            <RiAttachment2
                              className="text-muted-foreground/70 size-5"
                              size={20}
                              aria-hidden="true"
                            />
                            <span className="sr-only">Attach</span>
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="dark px-2 py-1 text-xs">
                        <p>{uploadedFile ? 'Only 1 file available to upload' : 'Attach file'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full size-8 border-none hover:bg-background hover:shadow-md transition-[box-shadow]"
                      >
                        <RiMicLine
                          className="text-muted-foreground/70 size-5"
                          size={20}
                          aria-hidden="true"
                        />
                        <span className="sr-only">Audio</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="dark px-2 py-1 text-xs">
                      <p>Speech to Text</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {/* Right buttons */}
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full size-8 border-none hover:bg-background hover:shadow-md transition-[box-shadow]"
                      >
                        <img
                          src="/gemini.png"
                          alt="Gemini"
                          className="w-5 h-5 object-contain"
                        />
                        <span className="sr-only">Generate</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="dark px-2 py-1 text-xs">
                      <p>Enhance Prompt</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button 
                    className="rounded-full h-8" 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                  >
                    {isLoading ? "Sending..." : "Ask ByeDB"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
