"use client";

import { cn } from "@/lib/utils";
import { userConfig } from "@/lib/user-config";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/tooltip";
import {
  RiLoopRightFill,
  RiFileCopyLine,
  RiCheckLine,
} from "@remixicon/react";
import { useState } from "react";
import MarkdownResponse from "./markdown-response";

type ChatMessageProps = {
  isUser?: boolean;
  children: React.ReactNode;
  content?: string;
  showActions?: boolean;
};

export function ChatMessage({ isUser, children, content, showActions = true }: ChatMessageProps) {
  return (
    <article
      className={cn(
        "flex items-start gap-4 text-[15px] leading-relaxed w-full min-w-0",
        isUser && "justify-end",
      )}
    >
      <img
        className={cn(
          "rounded-full w-10 h-10 object-cover flex-shrink-0",
          isUser ? "order-1 shadow-sm border border-black/[0.08]" : "border border-black/[0.08] shadow-sm",
        )}
        src={
          isUser
            ? userConfig.avatar
            : "/icons/chat.png"
        }
        alt={isUser ? "User profile" : "ByeDB logo"}
        width={40}
        height={40}
      />
      <div
        className={cn(
          isUser 
            ? "bg-muted px-4 py-3 rounded-xl max-w-[80%] min-w-0"
            : "space-y-2 flex-1 min-w-0 pt-2" // compact spacing with slight top offset
        )}
      >
        <div className="flex flex-col gap-3">
          <p className="sr-only">{isUser ? "You" : "ByeDB"} said:</p>
          {children}
        </div>
        {!isUser && showActions && <MessageActions rawContent={content} />}
      </div>
    </article>
  );
}

type ActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
};

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          className="relative text-muted-foreground/80 hover:text-foreground transition-colors size-8 flex items-center justify-center before:absolute before:inset-y-1.5 before:left-0 before:w-px before:bg-border first:before:hidden first-of-type:rounded-s-lg last-of-type:rounded-e-lg focus-visible:z-10 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring/70"
          onClick={onClick}
        >
          {icon}
          <span className="sr-only">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="px-2 py-1">
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function MessageActions({ rawContent }: { rawContent?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      if (rawContent) {
        await navigator.clipboard.writeText(rawContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Hide actions if there's no meaningful content yet (e.g., placeholder "Thinking...")
  const hasRenderableContent = !!rawContent && rawContent.trim().length > 0 && rawContent.trim().toLowerCase() !== 'thinking...';
  if (!hasRenderableContent) return null;

  return (
    <div className="relative inline-flex bg-white dark:bg-slate-800 rounded-md border border-black/[0.08] dark:border-slate-700 shadow-sm -space-x-px mt-1">
      <TooltipProvider delayDuration={0}>
        <ActionButton icon={<RiLoopRightFill size={16} />} label="Refresh" />
        <ActionButton 
          icon={copied ? 
            <RiCheckLine size={16} className="text-green-600 transition-all" /> : 
            <RiFileCopyLine size={16} />
          } 
          label={copied ? "Copied!" : "Copy"} 
          onClick={copyToClipboard}
        />
      </TooltipProvider>
    </div>
  );
}
