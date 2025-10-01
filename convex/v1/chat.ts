import { ConvexError, v } from "convex/values";
import { query, mutation, httpAction, ActionCtx, action } from "../_generated/server";
import { api } from "../_generated/api";
import { PersistentTextStreaming } from "@convex-dev/persistent-text-streaming";
import { components } from "../_generated/api";
import { StreamId, StreamIdValidator } from "@convex-dev/persistent-text-streaming";
import { isAuthenticated } from "../middleware";
import { paginationOptsValidator } from "convex/server";
import { Doc, Id } from "../_generated/dataModel";
import { openai } from "@ai-sdk/openai";
import { embed, generateText, streamText } from 'ai';
import { autumn } from "../autumn";

const persistentTextStreaming = new PersistentTextStreaming(
    components.persistentTextStreaming
);

export const getThreadList = query({
    args: {},
    handler: async (ctx) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new Error("Not authenticated");
        const userId = user.subject

        return await ctx.db
            .query("thread")
            .withIndex("byUser", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
    },
});

export const getThreadData = query({
    args: {
        threadId: v.id("thread")
    },
    handler: async (ctx, { threadId }) => {
        const userId = await isAuthenticated(ctx);
        const thread = await ctx.db.get(threadId);

        if (!thread || thread.userId !== userId) return null

        return thread
    },
})

export const getMessages = query({
    args: { threadId: v.id("thread"), paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new Error("Not authenticated");
        const userId = user.subject

        const thread = await ctx.db.get(args.threadId);
        if (!thread || thread.userId !== userId) {
            throw new Error("Conversation not found");
        }

        return await ctx.db
            .query("messages")
            .withIndex("byThreadId", (q) => q.eq("threadId", args.threadId))
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

export const deleteThread = mutation({
    args: { threadId: v.id("thread") },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new Error("Not authenticated");
        const userId = user.subject

        const thread = await ctx.db.get(args.threadId);
        if (!thread || thread.userId !== userId) {
            throw new Error("Conversation not found");
        }

        const allMessages = await ctx.db.query("messages").withIndex("byThreadId", (q) => q.eq("threadId", thread._id)).collect();

        await Promise.all(allMessages.map(async (message) => {
            await ctx.db.delete(message._id)
        }))

        await ctx.db.delete(thread._id);

        return "succsess"
    },
})

// Internal version for HTTP actions (bypasses auth)
export const getMessagesInternal = query({
    args: { threadId: v.id("thread") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("byThreadId", (q) => q.eq("threadId", args.threadId))
            .collect();
    },
});

export const createThreadAction = action({
    args: { message: v.string(), documentationIds: v.array(v.id("documentation")) },
    handler: async (ctx, { message, documentationIds }) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new ConvexError("Unauthenticated");

        const { data: chat } = await autumn.check(ctx, { featureId: "chats" })
        if (!chat?.unlimited && (chat?.balance || 0) <= 0) {
            throw new ConvexError("You've reached your daily chat limit.")
        }

        await autumn.track(ctx, {
            featureId: "chats",
            value: 1
        })

        const threadId: Id<"thread"> = await ctx.runMutation(api.v1.chat.createThread, {
            userId: user.subject,
            message,
            documentationIds
        })

        return threadId;
    },
});

export const sendMessageAction = action({
    args: {
        threadId: v.id("thread"),
        content: v.string(),
        documentationIds: v.optional(v.array(v.id("documentation"))),
    },
    handler: async (ctx, { threadId, content, documentationIds }) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new ConvexError("Unauthenticated");

        const { data: chat } = await autumn.check(ctx, { featureId: "chats" })
        if (!chat?.unlimited && (chat?.balance || 0) <= 0) {
            throw new ConvexError("You've reached your daily chat limit.")
        }

        await autumn.track(ctx, {
            featureId: "chats",
            value: 1
        })

        await ctx.runMutation(api.v1.chat.sendMessage, {
            userId: user.subject,
            threadId,
            content,
            documentationIds
        })

        return true;
    },
})

export const createThread = mutation({
    args: { userId: v.string(), message: v.string(), documentationIds: v.array(v.id("documentation")) },
    handler: async (ctx, { userId, ...args }) => {

        const threadId = await ctx.db.insert("thread", {
            userId,
            name: "New Chat",
            selectedDocumentation: args.documentationIds
        });

        await ctx.scheduler.runAfter(0, api.v1.chat.generateThreadTitle, { message: args.message, threadId });

        await ctx.runMutation(api.v1.chat.sendMessage, {
            userId,
            threadId,
            content: args.message,
        })

        return threadId;
    },
});

export const sendMessage = mutation({
    args: {
        userId: v.string(),
        threadId: v.id("thread"),
        content: v.string(),
        documentationIds: v.optional(v.array(v.id("documentation"))),
    },
    handler: async (ctx, { userId, ...args }) => {

        const thread = await ctx.db.get(args.threadId);
        if (!thread || thread.userId !== userId) {
            throw new Error("thread not found");
        }
        if (args.documentationIds) {
            await ctx.db.patch(thread._id, {
                selectedDocumentation: args.documentationIds,
            })
        }

        // Insert user message
        const userMessageId = await ctx.db.insert("messages", {
            threadId: args.threadId,
            role: "user",
            content: args.content,
        });

        // Create a stream for the AI response
        const streamId = await persistentTextStreaming.createStream(ctx);

        // Create the AI message with streaming enabled
        const aiMessageId = await ctx.db.insert("messages", {
            threadId: args.threadId,
            role: "assistant",
            content: "", // Start with empty content
            streamId: streamId,
            isStreaming: true,
        });

        // Update conversation timestamp
        // await ctx.db.patch(args.threadId, {
        //   lastMessageAt: Date.now(),
        // });

        return {
            userMessageId,
            aiMessageId,
            streamingMessageId: aiMessageId,
            streamId: streamId
        };
    },
});

export const getStreamBody = query({
    args: {
        streamId: StreamIdValidator,
    },
    handler: async (ctx, args) => {
        return await persistentTextStreaming.getStreamBody(
            ctx,
            args.streamId as StreamId
        );
    },
});

export const markStreamComplete = mutation({
    args: {
        messageId: v.id("messages"),
        finalContent: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            isStreaming: false,
            content: args.finalContent,
        });
    },
});

export const streamChat = httpAction(async (ctx, request) => {
    const body = (await request.json()) as {
        streamId: string;
        threadId: string;
        userMessage: string;
        messages?: any[];
    };

    const generateChat = async (ctx: any, request: any, streamId: StreamId, chunkAppender: any) => {
        try {
            console.log("Generate chat called with streamId:", streamId);

            // Get the message that we're streaming to
            const message = await ctx.runQuery(api.v1.chat.getMessageByStreamId, { streamId });
            if (!message) {
                console.error("No message found for streamId:", streamId);
                await chunkAppender("Error: Message not found");
                return;
            }

            // Get conversation history from the conversation
            const allMessages = await ctx.runQuery(api.v1.chat.getMessagesInternal, {
                threadId: message.threadId
            });

            // Get the user's latest message (the one that triggered this response)
            const userMessages = allMessages.filter((m: any) => m.role === "user");
            const latestUserMessage = userMessages[userMessages.length - 1];

            // if (!latestUserMessage) {
            //     await chunkAppender("Hello! How can I help you today?");
            //     await ctx.runMutation(api.v1.chat.markStreamComplete, {
            //         messageId: message._id,
            //         finalContent: "Hello! How can I help you today?",
            //     });
            //     return;
            // }

            const response = await aiChatHandler(ctx, chunkAppender, {
                messages: allMessages.slice(-10).map((m: Doc<"messages">) => m.content).join("\n"),
                threadId: message.threadId,
                userMessage: latestUserMessage?.content || ""
            })

            // Simple echo response for testing
            // const userContent = latestUserMessage.content;
            // const response = `Hello! You said "${userContent}". I'm an AI assistant. How can I help you?`;

            // Stream the response character by character for testing
            // for (let i = 0; i < response.length; i++) {
            //     await chunkAppender(response[i]);
            //     // Add a small delay to see the streaming effect
            //     await new Promise(resolve => setTimeout(resolve, 50));
            // }

            // Mark the message as complete
            await ctx.runMutation(api.v1.chat.markStreamComplete, {
                messageId: message._id,
                finalContent: response,
            });

            console.log("Stream completed successfully");

        } catch (error) {
            console.error("Chat generation error:", error);
            const errorMessage = "Sorry, an error occurred while generating the response.";
            await chunkAppender(errorMessage);

            // Try to mark the message as complete even on error
            try {
                const message = await ctx.runQuery(api.v1.chat.getMessageByStreamId, { streamId });
                if (message) {
                    await ctx.runMutation(api.v1.chat.markStreamComplete, {
                        messageId: message._id,
                        finalContent: errorMessage,
                    });
                }
            } catch (e) {
                console.error("Failed to mark message as complete on error:", e);
            }
        }
    };

    const response = await persistentTextStreaming.stream(
        ctx,
        request,
        body.streamId as StreamId,
        generateChat
    );

    // Set CORS headers appropriately.
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Vary", "Origin");
    return response;
});

// Helper queries for the HTTP action
export const getMessageByStreamId = query({
    args: { streamId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .filter((q) => q.eq(q.field("streamId"), args.streamId))
            .first();
    },
});

export const getThreadById = query({
    args: { threadId: v.id("thread"), withDocumentationData: v.optional(v.boolean()) },
    handler: async (ctx, args) => {
        const thread = await ctx.db.get(args.threadId);
        if (!thread) throw new ConvexError("Thread not found");
        return thread
    },
});

const aiChatHandler = async (ctx: ActionCtx, chunkAppender: any, args: { userMessage: string, messages: string, threadId: Id<"thread"> }) => {

    const thread = await ctx.runQuery(api.v1.chat.getThreadById, { threadId: args.threadId });

    const allDocumentation = thread.selectedDocumentation ? await Promise.all(thread.selectedDocumentation?.map(async (documentationId) => {
        return await ctx.runQuery(api.v1.documentation.getDocumentation, { documentationId }) || null
    })) : null

    let allContent: string[] = []

    if (allDocumentation && allDocumentation.filter((doc) => doc).length > 0) {
        const { embedding } = await embed({
            model: openai.textEmbeddingModel("text-embedding-3-small"),
            value: args.userMessage
        })

        const allPageDocumentation = allDocumentation.filter((doc) => doc.type === "web").map(page => page._id)
        const allFileDocumentation = allDocumentation.filter((doc) => doc.type === "files").map(file => file._id)

        if (allPageDocumentation.length > 0) {
            const pageResults = await ctx.vectorSearch("pageDocumentationChunks", "byEmbedding", {
                vector: embedding,
                limit: 10,
                filter: (q) => q.or(
                    ...(allPageDocumentation).map(id => q.eq("documentationId", id))
                )
            })
            console.log("vectorSearch page documentation", pageResults)
            const pageDocumentationIds = pageResults.filter((result) => result._score < 3.5).map(result => result._id);
            const collectedContent = await ctx.runQuery(api.v1.documentation.getAllPageDocumentationChunksContent, { pageDocumentationIds });
            allContent.push(...collectedContent)
        }

        if (allFileDocumentation.length > 0) {
            const fileResults = await ctx.vectorSearch("fileDocumentationChunks", "byEmbedding", {
                vector: embedding,
                limit: 10,
                filter: (q) => q.or(
                    ...(allFileDocumentation).map(id => q.eq("documentationId", id))
                )
            })
            console.log("vectorSearch page documentation", fileResults)
            const fileDocumentationIds = fileResults.filter((result) => result._score < 3.5).map(result => result._id);
            const collectedContent = await ctx.runQuery(api.v1.documentation.getAllFileDocumentationChunksContent, { fileDocumentationIds });
            allContent.push(...collectedContent)
        }
    }

    const { textStream } = streamText({
        model: openai("gpt-4o-mini"),
        system: "You are really good at coding and connect your existing skill and combined with new knowledge from given context",
        prompt: `
                CONTEXT : ${allContent.join("\n")}.
                HISTORY : ${args.messages}.
                QUESTION: ${args.userMessage}.
            `
    })

    console.log("Context" + allContent)
    console.log("History" + args.messages)
    console.log("Question" + args.userMessage)

    let collectedResponse = ""
    for await (const textPart of textStream) {
        collectedResponse += textPart
        await chunkAppender(textPart)
    }

    return collectedResponse;
}

export const updateThreadTitle = mutation({
    args: {
        threadId: v.id("thread"),
        title: v.string(),
    }, handler: async (ctx, args) => {
        await ctx.db.patch(args.threadId, {
            name: args.title
        })
    },
})

export const generateThreadTitle = action({
    args: {
        threadId: v.id("thread"),
        message: v.string()
    }, handler: async (ctx, args) => {
        const { text } = await generateText({
            model: openai("gpt-4o-mini"),
            system: "You are an AI that generates concise, invormative thread titles based on a given prompt. Always respond with only the title, without explanations or extra text. DO Not exceeding 50 Characters",
            prompt: "Please generate short title for this prompt from user : " + args.message
        })

        await ctx.runMutation(api.v1.chat.updateThreadTitle, {
            threadId: args.threadId,
            title: text?.replace(`"`, "") || "New Chat"
        })
    }
})