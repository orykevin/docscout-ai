import React, { use } from "react";
import ThreadUI from "./_components/ThreadUI";
import { Id } from "@/convex/_generated/dataModel";

function ThreadChatPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params);

  console.log(threadId);

  return (
    <div>{threadId && <ThreadUI threadId={threadId as Id<"thread">} />}</div>
  );
}

export default ThreadChatPage;
