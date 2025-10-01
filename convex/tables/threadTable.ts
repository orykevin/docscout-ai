import { defineTable } from "convex/server";
import { v } from "convex/values";

export const threadSchema = {
    selectedDocumentation: v.optional(v.array(v.id("documentation"))),
    name: v.optional(v.string()),
    userId: v.string(),
}

export const messagesSchema = {
    threadId: v.id("thread"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    streamId: v.optional(v.string()),
    isStreaming: v.optional(v.boolean()),
    streamingComplete: v.optional(v.boolean()),
}

export const threadTable = defineTable(threadSchema).index("byUser", ["userId"]);
export const messagesTable = defineTable(messagesSchema).index("byThreadId", ["threadId"]);