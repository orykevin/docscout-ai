import React from "react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useConvexMutation, useUserQuery } from "@/lib/convex-functions";
import { usePathname } from "next/navigation";
import { Skeleton } from "./ui/skeleton";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "./ui/button";
import { RiDeleteBin2Line } from "@remixicon/react";
import DialogBase from "./dialog-base";
import { toast } from "sonner";

const ThreadListSidebar = () => {
  const threadList = useUserQuery(api.v1.chat.getThreadList);
  const pathname = usePathname();
  const paths = pathname.split("/");
  const [selectedThreadId, setSelectedThreadId] =
    React.useState<Id<"thread"> | null>(null);

  const { mutate, isPending } = useConvexMutation(api.v1.chat.deleteThread);

  const handleDeleteThread = () => {
    if (isPending) return;
    if (selectedThreadId) {
      mutate({ threadId: selectedThreadId }).then(() => {
        setSelectedThreadId(null);
        toast.success("Thread deleted");
      });
    }
  };

  if (!threadList) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton className="min-h-10"></Skeleton>
        ))}
      </div>
    );
  }

  return (
    <>
      <SidebarMenu>
        {threadList.map((thread) => {
          return (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="group/menu-button font-medium gap-3 h-9 rounded-md data-[active=true]:hover:opacity-95 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-[0_1px_2px_0_rgb(0_0_0/.05),inset_0_1px_0_0_rgb(255_255_255/.12)] [&>svg]:size-auto"
                isActive={paths[2] === thread._id}
              >
                <div className="flex items-center max-w-[240px] justify-between">
                  <Link
                    href={`/chat/${thread._id}`}
                    className="w-full max-w-[85%]"
                  >
                    <span className="block truncate overflow-hidden text-ellipsis w-full">
                      {thread.name}
                    </span>
                  </Link>
                  <Button
                    size="iconSm"
                    variant="ghost"
                    className="min-w-max opacity-0 group-hover/menu-button:opacity-100 cursor-pointer !bg-none hover:text-red-500"
                    onClick={() => setSelectedThreadId(thread._id)}
                  >
                    <RiDeleteBin2Line />
                  </Button>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
      <DialogBase
        open={selectedThreadId !== null}
        openChangeAction={() => setSelectedThreadId(null)}
        header="Delete thread?"
      >
        <div>
          <p className="mb-4">
            Are you sure you want to delete this thread? This action cannot be
            undone.
          </p>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => setSelectedThreadId(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleDeleteThread}
              variant={"destructive"}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </DialogBase>
    </>
  );
};

export default ThreadListSidebar;
