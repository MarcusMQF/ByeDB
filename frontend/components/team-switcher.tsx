"use client";

import * as React from "react";
import Image from "next/image";
import { RiDatabase2Line } from "@remixicon/react";

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
  const [imageError, setImageError] = React.useState(false);

  if (!teams.length) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-3 px-2 py-2">
          {activeTeam && !imageError ? (
            <Image
              src={activeTeam.logo.startsWith('http') ? activeTeam.logo : `/${activeTeam.logo}`}
              width={36}
              height={36}
              alt={activeTeam.name}
              className="object-contain size-9"
              priority
              onError={() => setImageError(true)}
            />
          ) : (
            <RiDatabase2Line className="size-9" />
          )}
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
