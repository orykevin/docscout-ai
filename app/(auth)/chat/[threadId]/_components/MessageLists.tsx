"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { usePaginatedQuery } from "convex/react";
import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import { StreamId } from "@convex-dev/persistent-text-streaming";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";

type MessageListsProps = {
  threadId: Id<"thread">;
};

interface Message {
  _id: Id<"messages">;
  threadId: Id<"thread">;
  role: "user" | "assistant";
  content: string;
  streamId?: string;
  isStreaming?: boolean;
  _creationTime: number;
}

function StreamingMessage({
  message,
  isLastChat,
}: {
  message: Message;
  isLastChat: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Convex site URL for HTTP actions - convert .cloud to .site
  const convexApiUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
  const convexSiteUrl =
    convexApiUrl?.replace(".convex.cloud", ".convex.site") ||
    window.location.origin;

  // For newly created streaming messages, this component should drive the stream
  const isDriven = message.isStreaming === true;

  const { text, status } = useStream(
    api.v1.chat.getStreamBody,
    new URL(`${convexSiteUrl}/chat-stream`),
    isDriven, // Drive the stream if the message is actively streaming
    message.streamId as StreamId,
  );

  // Use streamed text if available and streaming, otherwise use message content
  const displayText = status === "streaming" && text ? text : message.content;
  const isActive = status === "streaming" || message.isStreaming;

  useEffect(() => {
    if (!isLastChat) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [text, isLastChat]);

  return (
    <div>
      <div className="space-y-3 markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {displayText}
        </ReactMarkdown>
      </div>

      {isActive && (
        <span className="inline-block w-2 h-5 bg-current opacity-75 animate-pulse ml-1" />
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

const MessageLists = ({ threadId }: MessageListsProps) => {
  const user = useQuery(api.auth.getCurrentUser);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    results: paginateData,
    // isLoading,
    // status,
  } = usePaginatedQuery(api.v1.chat.getMessages, user ? { threadId } : "skip", {
    initialNumItems: 15,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [paginateData]);

  return (
    <div className="p-2 space-y-4">
      {paginateData
        ?.map((message, i) => {
          const isAssistant = message.role === "assistant";
          const isLastChat = i === 0;

          if (isAssistant)
            return (
              <div key={message._id}>
                {message.role === "assistant" && message.streamId ? (
                  <StreamingMessage
                    key={message._id}
                    message={message}
                    isLastChat={isLastChat}
                  />
                ) : (
                  <div
                    key={message._id}
                    className="whitespace-pre-wrap break-words"
                  >
                    {message.content}
                  </div>
                )}

                {message.role === "assistant" &&
                  message.isStreaming &&
                  !message.streamId && (
                    <div className="flex items-center gap-1 mt-2 text-slate-500">
                      <div className="flex gap-1">
                        <div
                          className="w-1 h-1 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-1 h-1 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-1 h-1 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                      <span className="text-xs">AI is typing...</span>
                    </div>
                  )}
              </div>
            );
          else
            return (
              <div
                className="p-2 px-4 w-max max-w-[90%] bg-muted rounded-md text-right ml-auto"
                key={message._id}
              >
                <p>{message.content}</p>
              </div>
            );
        })
        .reverse()}
      <span id={"messages-end"} ref={messagesEndRef} />
    </div>
  );
};

export default MessageLists;
