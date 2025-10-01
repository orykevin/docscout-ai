"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { RiSettings3Line, RiBook2Line, RiChatNewLine } from "@remixicon/react";
import DocuScoutIcon from "./icons/docuscout-icon";
import { usePathname } from "next/navigation";
import Link from "next/link";
import ThreadListSidebar from "./thread-list-sidebar";

// This is sample data.
const data = {
  teams: [
    {
      name: "ArkDigital",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/logo-01_upxvqe.png",
    },
    {
      name: "Acme Corp.",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/logo-01_upxvqe.png",
    },
    {
      name: "Evil Corp.",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/logo-01_upxvqe.png",
    },
  ],
  navMain: [
    {
      title: "Menu",
      url: "#",
      items: [
        {
          title: "New Chat",
          url: "/chat",
          icon: RiChatNewLine,
        },
        {
          title: "Documentations",
          url: "/documentations",
          icon: RiBook2Line,
        },
      ],
    },
    {
      title: "More",
      url: "#",
      items: [
        {
          title: "Settings",
          url: "/settings",
          icon: RiSettings3Line,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const paths = pathname.split("/");

  return (
    <Sidebar {...props} className=" !border-none">
      <div className="flex items-center gap-2 p-4">
        <DocuScoutIcon className="w-8 h-8" />
        <p className="font-semibold text-lg">DocScout AI</p>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase px-1">
            {data.navMain[0]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain[0]?.items.map((item) => {
                const isNewChat =
                  paths.length === 2 &&
                  paths[1] === "chat" &&
                  item.url === "/chat";
                const isDocumentation =
                  paths[1] === item.url.replace("/", "") &&
                  item.url === "/documentations";
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="group/menu-button font-medium gap-3 h-9 rounded-md data-[active=true]:hover:opacity-95 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-[0_1px_2px_0_rgb(0_0_0/.05),inset_0_1px_0_0_rgb(255_255_255/.12)] [&>svg]:size-auto"
                      isActive={isDocumentation || isNewChat}
                    >
                      <Link href={item.url}>
                        {item.icon && (
                          <item.icon
                            className="text-sidebar-foreground/50 group-data-[active=true]/menu-button:text-primary-foreground"
                            size={22}
                            aria-hidden="true"
                          />
                        )}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase px-1">
            Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ThreadListSidebar />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain[1]?.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="group/menu-button font-medium gap-3 h-9 rounded-md [&>svg]:size-auto"
                  >
                    <Link href={item.url}>
                      {item.icon && (
                        <item.icon
                          className="text-sidebar-foreground/50 group-data-[active=true]/menu-button:text-primary"
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
      </SidebarFooter>
    </Sidebar>
  );
}
