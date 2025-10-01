"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { RiLogoutCircleLine, RiScan2Line, RiUserLine } from "@remixicon/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { Skeleton } from "./ui/skeleton";
import { useCustomer } from "autumn-js/react";
import { Tooltip, TooltipContent } from "./ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useRouter } from "next/navigation";

export default function UserDropdown() {
  const router = useRouter();
  const user = useQuery(api.auth.getCurrentUser);
  const { customer } = useCustomer();

  const handleSignout = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  console.log(customer);
  return (
    <div className="flex items-center gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex gap-2 items-center">
            <RiScan2Line />
            {customer ? (
              <p className="text-sm font-semibold">
                {customer?.features?.scans?.balance}
              </p>
            ) : (
              <Skeleton className="h-6 w-10" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Scans usage left</p>
        </TooltipContent>
      </Tooltip>

      {!user ? (
        <Skeleton className="h-8 w-8 rounded-full" />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
              <Avatar className="size-8">
                <AvatarImage
                  src={user.image || ""}
                  width={32}
                  height={32}
                  alt="Profile image"
                />
                <AvatarFallback className="border border-muted-foreground">
                  <RiUserLine />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-64 p-2" align="end">
            <DropdownMenuLabel className="flex min-w-0 flex-col py-0 px-1 mb-2">
              <span className="truncate text-sm font-medium text-foreground mb-0.5">
                {user.name}
              </span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuItem className="gap-3 px-1" onClick={handleSignout}>
              <RiLogoutCircleLine
                size={20}
                className="text-muted-foreground/70"
                aria-hidden="true"
              />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
