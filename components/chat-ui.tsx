"use client";

import React from "react";
import { Textarea } from "./ui/textarea";
import ToolTipButton from "./ui/tooltip-button";
import { Loader2 } from "lucide-react";
import {
  RiArrowUpLine,
  RiCheckLine,
  RiCloseLine,
  RiGitRepositoryCommitsLine,
} from "@remixicon/react";

import {
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useConvexAction, useUserQuery } from "@/lib/convex-functions";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "./ui/badge";
import { useRouter } from "next/navigation";
import { useCustomer } from "autumn-js/react";
import { toast } from "sonner";
import LinkButton from "./ui/link-button";

export const MAX_CONTEXT_FREE = 2;
export const MAX_CONTEXT_PRO = 10;

type ChatUIProps = {
  isFrontPage?: boolean;
  defaultSelectedDocumentationIds?: Id<"documentation">[];
  threadId?: Id<"thread">;
};

const ChatUI = ({
  isFrontPage,
  defaultSelectedDocumentationIds,
  threadId,
}: ChatUIProps) => {
  const router = useRouter();
  const { customer } = useCustomer();
  const [selectedDoc, setSelectedDoc] = React.useState<Id<"documentation">[]>(
    defaultSelectedDocumentationIds || [],
  );
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const allDocumentationOption = useUserQuery(
    api.v1.documentation.getDocumentationOptions,
  );
  const { runAction: createThread, isPending: isCreating } = useConvexAction(
    api.v1.chat.createThreadAction,
  );
  const { runAction: sendingChat, isPending: isSending } = useConvexAction(
    api.v1.chat.sendMessageAction,
  );

  const isDisabled = isCreating || isSending;
  const isLoadingCustomer = !customer;
  const isChatReachedLimit =
    customer &&
    !customer?.features?.chats?.unlimited &&
    (customer?.features?.chats?.balance || 0) <= 0
      ? true
      : false;

  const sendChat = async () => {
    const message = textAreaRef.current?.value;
    if (
      isCreating ||
      !message ||
      message.trim() === "" ||
      isLoadingCustomer ||
      isChatReachedLimit
    )
      return;

    if (isFrontPage) {
      //create thread
      createThread(
        {
          documentationIds: selectedDoc,
          message,
        },
        {
          onSuccess: (threadId) => {
            router.push(`/chat/${threadId}`);
          },
          onError: (e) => {
            console.log("chat error", e);
            toast.error(e.data);
          },
        },
      );
    } else {
      //ai chat
      if (!threadId) return;
      sendingChat(
        {
          threadId,
          content: message,
          documentationIds: selectedDoc,
        },
        {
          onSuccess: () => {
            formRef.current?.reset();
          },
          onError: (e) => {
            console.log("chat error", e);
            toast.error(e.data);
          },
        },
      );

      textAreaRef.current!.value = "";
    }
  };

  const selectDocumentation = (id: Id<"documentation">) => {
    if (
      (!customer || !customer.features.documentation_limit) &&
      selectedDoc.length >= MAX_CONTEXT_FREE
    ) {
      toast.error("You have reached the maximum number of context");
      return;
    }
    if (
      customer?.features.documentation_limit &&
      selectedDoc.length >= MAX_CONTEXT_PRO
    ) {
      toast.error("You have reached the maximum number of context");
      return;
    }

    setSelectedDoc((prev) => [...prev, id]);
  };

  const submitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    sendChat();
  };

  return (
    <div
      className={cn(
        "relative w-full max-w-3xl mx-auto group p-4 bg-input/75 rounded-md shadow-2xl ",
      )}
    >
      <form onSubmit={submitHandler} ref={formRef} id="form">
        <Textarea
          className={cn(
            "peer !h-max max-h-[50vh] text-base field-sizing-content resize-none bg-transparent !ring-0 !border-0 p-0 ",
            !isFrontPage && "!min-h-8 h-8",
          )}
          placeholder={
            isChatReachedLimit
              ? "You've reached your daily chat limit. "
              : "Ask a question..."
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendChat();
            }
          }}
          ref={textAreaRef}
          disabled={isDisabled || isChatReachedLimit}
        ></Textarea>
        <div className="flex items-end justify-between w-full pt-2">
          <div className="flex gap-2 items-end">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <ToolTipButton
                  size="iconSm"
                  tooltip="Add Documentation"
                  disabled={!allDocumentationOption}
                >
                  <RiGitRepositoryCommitsLine />
                </ToolTipButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  Selected : {selectedDoc.length} /{" "}
                  {customer?.features.documentation_limit
                    ? MAX_CONTEXT_PRO
                    : MAX_CONTEXT_FREE}
                </DropdownMenuLabel>
                {allDocumentationOption?.length === 0 && (
                  <DropdownMenuItem asChild>
                    <LinkButton href="/documentations/new">
                      Add new Documentation
                    </LinkButton>
                  </DropdownMenuItem>
                )}
                {allDocumentationOption &&
                  allDocumentationOption.map((doc) => {
                    const checked = selectedDoc.includes(doc.id);
                    return (
                      <DropdownMenuItem
                        key={doc.id}
                        onSelect={(e) => e.preventDefault()}
                        onClick={() => selectDocumentation(doc.id)}
                        disabled={checked}
                      >
                        <Badge>{doc.type}</Badge>

                        {checked && <RiCheckLine />}
                        <span>{doc.name}</span>
                      </DropdownMenuItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* <ToolTipButton
              className="w-8 h-8 min-w-8 min-h-8"
              size="icon"
              tooltip="More"
              variant="outline"
            >
              {<Plus />}
            </ToolTipButton> */}
            <div className="flex flex-wrap gap-1 max-w-full">
              {selectedDoc.map((doc) => {
                const docData = allDocumentationOption?.find(
                  (d) => d.id === doc,
                );
                if (!docData) return null;
                return (
                  <div
                    className="h-8 w-max max-w-40 p-2 flex items-center gap-2 bg-input rounded-md text-sm"
                    key={doc}
                  >
                    <RiCloseLine
                      onClick={() =>
                        setSelectedDoc((prev) =>
                          prev.filter((id) => id !== doc),
                        )
                      }
                      className="hover:text-destructive cursor-pointer min-w-6 min-h-6"
                    />
                    <p className="truncate">{docData.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            {/* <ToolTipButton
              className=" w-8 h-8"
              size="icon"
              tooltip="Voice"
              variant="ghost"
            >
              {<RiVoiceprintLine />}
            </ToolTipButton> */}
            <ToolTipButton
              className=" w-8 h-8 group-has-[textarea:placeholder-shown]:disabled"
              size="icon"
              tooltip="Send"
              disabled={isDisabled || isLoadingCustomer || isChatReachedLimit}
              onClick={sendChat}
            >
              {isDisabled ? (
                <Loader2 className="animate-spin" />
              ) : (
                <RiArrowUpLine />
              )}
            </ToolTipButton>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatUI;
