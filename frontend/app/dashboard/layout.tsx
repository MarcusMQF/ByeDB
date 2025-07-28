import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ByeDB Dashboard",
  icons: {
    icon: [
      { url: "/icons/crop.png", type: "image/png" }
    ],
    apple: "/icons/crop.png",
  },
};

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/sidebar";
import UserDropdown from "@/components/user-dropdown";
import { SettingsPanelProvider } from "@/components/data_panel";
import { DatasetProvider } from "@/lib/dataset-context";
import { DashboardContent } from "@/components/dashboard-content";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-sidebar group/sidebar-inset">
        <header className="dark flex h-16 shrink-0 items-center gap-2 px-4 md:px-6 lg:px-8 bg-sidebar text-sidebar-foreground relative before:absolute before:inset-y-3 before:-left-px before:w-px before:bg-gradient-to-b before:from-white/5 before:via-white/15 before:to-white/5 before:z-50">
          <SidebarTrigger className="-ms-2" />
          <div className="flex items-center gap-8 ml-auto">
            <nav className="flex items-center text-sm font-medium max-sm:hidden">
              <a
                className="text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors [&[aria-current]]:text-sidebar-foreground before:content-['/'] before:px-4 before:text-sidebar-foreground/30 first:before:hidden"
                href="#"
                aria-current
              >
                Playground
              </a>
              <a
                className="text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors [&[aria-current]]:text-sidebar-foreground before:content-['/'] before:px-4 before:text-sidebar-foreground/30 first:before:hidden"
                href="https://deepwiki.com/MarcusMQF/ByeDB/1-overview"
                target="_blank"
                rel="noopener noreferrer"
              >
                Docs
              </a>
              <a
                className="text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors [&[aria-current]]:text-sidebar-foreground before:content-['/'] before:px-4 before:text-sidebar-foreground/30 first:before:hidden"
                href="#"
              >
                API Reference
              </a>
            </nav>
            <UserDropdown />
          </div>
        </header>
        <SettingsPanelProvider>
          <DatasetProvider>
            <DashboardContent>
              {children}
            </DashboardContent>
          </DatasetProvider>
        </SettingsPanelProvider>
      </SidebarInset>
    </SidebarProvider>
  );
} 