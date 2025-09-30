"use client";

import React, { useEffect } from "react";
import { Textarea } from "./ui/textarea";
import ToolTipButton from "./ui/tooltip-button";
import { Loader2, Plus } from "lucide-react";
import {
  RiArrowUpLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiCloseLine,
  RiGitRepositoryCommitsFill,
  RiGitRepositoryCommitsLine,
  RiVoiceprintLine,
} from "@remixicon/react";

import {
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useConvexMutation, useUserQuery } from "@/lib/convex-functions";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "./ui/badge";
import { useRouter } from "next/navigation";

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
  const [selectedDoc, setSelectedDoc] = React.useState<Id<"documentation">[]>(
    defaultSelectedDocumentationIds || [],
  );
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const allDocumentationOption = useUserQuery(
    api.v1.documentation.getDocumentationOptions,
  );
  const { mutate: createThread, isPending: isCreating } = useConvexMutation(
    api.v1.chat.createThread,
  );
  const { mutate: sendingChat, isPending: isSending } = useConvexMutation(
    api.v1.chat.sendMessage,
  );

  const isDisabled = isCreating || isSending;

  const sendChat = () => {
    const message = textAreaRef.current?.value;
    console.log("message");
    if (isCreating || !message || message.trim() === "") return;

    console.log("submited");
    if (isFrontPage) {
      //create thread
      createThread({
        documentationIds: selectedDoc,
        message,
      }).then((threadId) => {
        router.push(`/chat/${threadId}`);
      });
    } else {
      //ai chat
      if (!threadId) return;
      sendingChat({
        threadId,
        content: message,
        documentationIds: selectedDoc,
      });
      textAreaRef.current!.value = "";
    }
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
          placeholder="Ask a question..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendChat();
            }
          }}
          ref={textAreaRef}
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
                {allDocumentationOption &&
                  allDocumentationOption.map((doc) => {
                    const checked = selectedDoc.includes(doc.id);
                    return (
                      <DropdownMenuItem
                        key={doc.id}
                        onSelect={(e) => e.preventDefault()}
                        onClick={() =>
                          setSelectedDoc((prev) => [...prev, doc.id])
                        }
                        disabled={checked}
                      >
                        {checked && <RiCheckLine />}
                        <span>{doc.name}</span>
                        <Badge>{doc.type}</Badge>
                      </DropdownMenuItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <ToolTipButton
              className="w-8 h-8 min-w-8 min-h-8"
              size="icon"
              tooltip="More"
              variant="outline"
            >
              {<Plus />}
            </ToolTipButton>
            <div className="flex flex-wrap gap-1 max-w-full">
              {selectedDoc.map((doc) => {
                const docData = allDocumentationOption?.find(
                  (d) => d.id === doc,
                );
                if (!docData) return null;
                return (
                  <div className="h-8 w-max max-w-40 p-2 flex items-center gap-2 bg-input rounded-md text-sm">
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
            <ToolTipButton
              className=" w-8 h-8"
              size="icon"
              tooltip="Voice"
              variant="ghost"
            >
              {<RiVoiceprintLine />}
            </ToolTipButton>
            <ToolTipButton
              className=" w-8 h-8 group-has-[textarea:placeholder-shown]:disabled"
              size="icon"
              tooltip="Send"
              disabled={isDisabled}
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
