"use client";

import { useSidebar } from "@/components/sidebar";
import { SettingsPanel } from "@/components/data_panel";

interface DashboardContentProps {
  children: React.ReactNode;
}

export function DashboardContent({ children }: DashboardContentProps) {
  const { state } = useSidebar();
  
  return (
    <div 
      className={`flex h-[calc(100svh-4rem)] overflow-hidden bg-[hsl(240_5%_92.16%)] transition-all ease-in-out duration-300 min-w-0 ${
        state === "expanded" ? "md:rounded-tl-[1.5rem]" : ""
      }`}
    >
      {children}
      <SettingsPanel />
    </div>
  );
} 