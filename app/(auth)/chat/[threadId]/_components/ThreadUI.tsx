"use client";

import ChatUI from "@/components/chat-ui";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserQuery } from "@/lib/convex-functions";
import React from "react";
import MessageLists from "./MessageLists";
import { useRouter } from "next/navigation";

const ThreadUI = ({ threadId }: { threadId: Id<"thread"> }) => {
  const router = useRouter();
  const threadData = useUserQuery(api.v1.chat.getThreadData, { threadId });

  if (threadData === null) {
    router.push("/chat");
  }

  if (!threadData) return null;

  return (
    <div className="max-w-3xl w-full mx-auto">
      <div className="flex flex-col justify-between h-[calc(100vh-6rem)] gap-3">
        <div id="messages-container" className="h-full overflow-auto">
          <MessageLists threadId={threadId} />
        </div>
        <div className="h-max">
          {threadData ? (
            <ChatUI
              defaultSelectedDocumentationIds={
                threadData?.selectedDocumentation
              }
              threadId={threadData._id}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ThreadUI;
