"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { TeamSwitcher } from "@/components/team-switcher";
import { getVersionInfo, getShortVersion } from "@/lib/version";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/sidebar";
import {
  RiChat1Line,
  RiBracesLine,
  RiHistoryLine,
  RiPlanetLine,
  RiSeedlingLine,
  RiSettings3Line,
  RiDatabase2Line,
} from "@remixicon/react";

// This is sample data.
const data = {
  teams: [
    {
      name: "ByeDB.AI",
      logo: "icons/icon.png",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      items: [
        {
          title: "Chat",
          url: "/dashboard",
          icon: RiChat1Line,
        },
        {
          title: "Dataset",
          url: "/dashboard/table",
          icon: RiDatabase2Line,
        },
        {
          title: "History",
          url: "#",
          icon: RiHistoryLine,
        },
      ],
    },
    // Removed secondary "More" section per request
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const versionInfo = getVersionInfo();
  const shortVersion = getShortVersion(versionInfo);

  return (
    <Sidebar {...props} className="dark !border-none">
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        {/* We only show the first parent group */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-sidebar-foreground/50">
            {data.navMain[0]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {data.navMain[0]?.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="group/menu-button font-medium gap-3 h-9 rounded-md data-[active=true]:hover:bg-transparent data-[active=true]:bg-gradient-to-b data-[active=true]:from-sidebar-primary data-[active=true]:to-sidebar-primary/70 data-[active=true]:shadow-[0_1px_2px_0_rgb(0_0_0/.05),inset_0_1px_0_0_rgb(255_255_255/.12)] [&>a]:flex [&>a]:items-center [&>a]:w-full [&>svg]:size-auto"
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      {item.icon && (
                        <item.icon
                          className="text-sidebar-foreground/50 group-data-[active=true]/menu-button:text-sidebar-foreground"
                          size={22}
                          aria-hidden="true"
                        />
                      )}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* Version Display */}
        <div className="px-4 py-2 border-t border-sidebar-border/50">
          <div className="flex items-center justify-between text-xs text-sidebar-foreground/60">
            <span>VERSION</span>
            <span className="font-mono font-medium">{shortVersion}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
