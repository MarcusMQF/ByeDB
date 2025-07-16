"use client";

import * as React from "react";

import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/sidebar";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: string;
  }[];
}) {
  const activeTeam = teams[0] ?? null;

  if (!teams.length) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex aspect-square size-9 items-center justify-center rounded-md overflow-hidden bg-sidebar-primary text-sidebar-primary-foreground relative after:rounded-[inherit] after:absolute after:inset-0 after:shadow-[0_1px_2px_0_rgb(0_0_0/.05),inset_0_1px_0_0_rgb(255_255_255/.12)] after:pointer-events-none">
            {activeTeam && (
              <img
                src={activeTeam.logo}
                width={36}
                height={36}
                alt={activeTeam.name}
              />
            )}
          </div>
          <div className="grid flex-1 text-left text-base leading-tight">
            <span className="truncate font-medium">
              {activeTeam?.name ?? "ByeDB.AI"}
            </span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
