import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, MutationCtx, query } from "../_generated/server";
import { isAuthenticated, isDocumentationOwner } from "../middleware";
import { WithoutSystemFields } from "convex/server";
import { Doc, Id } from "../_generated/dataModel";
import { file } from "better-auth";
import { deleteFileHelper } from "./upload";
import { documentationSchema } from "../tables/doumentationTable";
import { internal } from "../_generated/api";

// documentation

export const getAllDocumentation = query({
    handler: async (ctx) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new ConvexError("user not found")
        const allDocumentation = await ctx.db.query("documentation").withIndex("byUserId", (q) => q.eq("userId", user?.subject)).collect();
        return allDocumentation
    }
})

export const getDocumentation = query({
    args: {
        documentationId: v.id("documentation")
    }, handler: async (ctx, { documentationId }) => {
        // const userId = await isAuthenticated(ctx)
        // const user = await ctx.auth.getUserIdentity();
        const documentation = await ctx.db.get(documentationId)
        // console.log(user?.subject, documentation?.userId)
        if (!documentation) throw new ConvexError("Documentation not found")
        // if (documentation.userId !== user?.subject) throw new ConvexError("This documentation is not yours")
        return documentation
    },
})

export const updateDocumentation = mutation({
    args: {
        documentationId: v.id("documentation"),
        name: v.string()
    }, handler: async (ctx, { name, documentationId }) => {
        const { documentation } = await isDocumentationOwner(ctx, documentationId)
        const now = new Date
        await ctx.db.patch(documentation._id, { name, updatedAt: Date.now() })
    },
})

export const createDocumentation = internalMutation({
    args: documentationSchema,
    handler: async (ctx, args) => {
        const documentationId = await ctx.db.insert("documentation", args)
        return documentationId
    },
})

// documentation file

export const saveDocumentationFile = mutation({
    args: {
        name: v.string(),
        files: v.array(v.object({
            name: v.string(),
            prefix: v.string(),
            size: v.number(),
        }))
    }, handler: async (ctx, args) => {
        const userId = await isAuthenticated(ctx)
        const documentationId = await createDocumentationHelper(ctx, {
            name: args.name,
            type: "files",
            totalPage: args.files.length,
            activePage: 0,
            userId: userId
        })

        const fileDocumentIds = await Promise.all(args.files.map(async (file) => {
            const payload = {
                fileName: file.name,
                filePrefix: file.prefix,
                fileSize: file.size,
                documentationId,
                status: "starting",
            }
            const fileDocumentId = await ctx.db.insert("fileDocumentation", payload)

            return {
                ...payload,
                fileDocumentId
            }
        }))

        saveFileAndMakeEmbedding(ctx, { files: fileDocumentIds })

        return documentationId
    }
})

export const getFilesDocumentation = query({
    args: { documentationId: v.id("documentation") },
    handler: async (ctx, { documentationId }) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new ConvexError("Not Authenticated")
        const allFilesData = await ctx.db.query("fileDocumentation").withIndex("byDocumentationId", (q) => q.eq("documentationId", documentationId)).collect();
        return allFilesData
    }
})

export const addFilesDocumentation = mutation({
    args: {
        documentationId: v.id("documentation"),
        files: v.array(v.object({
            name: v.string(),
            prefix: v.string(),
            size: v.number(),
        }))
    }, handler: async (ctx, args) => {
        const { documentation } = await isDocumentationOwner(ctx, args.documentationId)
        const fileDocumentIds = await Promise.all(args.files.map(async (file) => {
            const payload = {
                documentationId: documentation._id,
                fileName: file.name,
                filePrefix: file.prefix,
                fileSize: file.size,
                status: "starting",
            }
            const fileDocumentId = await ctx.db.insert("fileDocumentation", payload)
            return { ...payload, fileDocumentId }
        }))
        await ctx.db.patch(documentation._id, {
            updatedAt: Date.now(),
            totalPage: documentation.totalPage + args.files.length
        })

        saveFileAndMakeEmbedding(ctx, { files: fileDocumentIds })

        return {
            message: "Successfully add " + args.files.length + (args.files.length > 1 ? " files" : " file")
        }
    },
})

export const deleteFileDocumentation = mutation({
    args: {
        documentationId: v.id("documentation"),
        fileDocumentationId: v.id("fileDocumentation"),
    },
    handler: async (ctx, args) => {
        const { documentation } = await isDocumentationOwner(ctx, args.documentationId)
        const fileDocumentation = await ctx.db.get(args.fileDocumentationId)
        if (!fileDocumentation) throw new ConvexError("File documentation not found")
        await ctx.db.delete(args.fileDocumentationId)
        await deleteFileHelper(ctx, fileDocumentation.filePrefix)
        await ctx.db.patch(documentation._id, {
            updatedAt: Date.now(),
            activePage: documentation.activePage - 1,
            totalPage: documentation.totalPage - 1
        })

        //remove all chunks
        const allChunks = await ctx.db.query("fileDocumentationChunks").withIndex("byFileDocumentationId",
            (q) => q.eq("fileDocumentationId", args.fileDocumentationId)
        ).collect()

        await Promise.all(allChunks.map(async (chunk) => {
            await ctx.db.delete(chunk._id);
        }))


        return {
            message: "Successfully delete file"
        }
    },
})

export const updateFileDocumentation = internalMutation({
    args: {
        documentationId: v.id("documentation"),
        fileDocumentationId: v.id("fileDocumentation"),
        totalChunks: v.number()
    }, handler: async (ctx, args) => {
        const documentation = await ctx.db.get(args.documentationId);
        if (!documentation) throw new ConvexError("Documentation not found");
        await ctx.db.patch(args.fileDocumentationId, {
            status: "completed",
            totalChunks: args.totalChunks,
        })
        await ctx.db.patch(documentation._id, {
            activePage: documentation.activePage + 1
        })
    }
})

export const updateFailedEmbedFile = internalMutation({
    args: {
        fileDocumentationId: v.id("fileDocumentation"),
        status: v.optional(v.string())
    }, handler: async (ctx, args) => {
        await ctx.db.patch(args.fileDocumentationId, {
            status: args?.status || "failed"
        })
    },
})

export const createFileDocumentationChunk = internalMutation({
    args: {
        documentationId: v.id("documentation"),
        fileDocumentationId: v.id("fileDocumentation"),
        chunkIndex: v.number(),
        content: v.string(),
        embedding: v.array(v.float64())
    }, handler: async (ctx, args) => {
        await ctx.db.insert("fileDocumentationChunks", args)
    },
})

export const reScanFileDocument = mutation({
    args: {
        fileDocumentationId: v.id("fileDocumentation"),
        documentationId: v.id("documentation")
    }, handler: async (ctx, args) => {
        await isDocumentationOwner(ctx, args.documentationId);
        const fileDocumentation = await ctx.db.get(args.fileDocumentationId);
        if (!fileDocumentation) throw new ConvexError("File Documentation not found");
        if (fileDocumentation.status === "completed") throw new ConvexError("File Documentation is scanned");
        await ctx.db.patch(fileDocumentation._id, { status: "starting" });
        await saveFileAndMakeEmbedding(ctx, {
            files: [{
                documentationId: fileDocumentation.documentationId,
                fileDocumentId: fileDocumentation._id,
                fileName: fileDocumentation.fileName,
                filePrefix: fileDocumentation.filePrefix,
                fileSize: fileDocumentation.fileSize
            }]
        })
    },
})

// web scrape documentation


export const getWebInfoData = query({
    args: {
        documentationId: v.id("documentation"),
    }, handler: async (ctx, { documentationId }) => {
        const webInfo = await ctx.db.query("webInfo").withIndex("byDocumentationId", (q) => q.eq("documentationId", documentationId)).first();
        const webLinks = await ctx.db.query("webLinks").withIndex("byDocumentationId", (q) => q.eq("documentationId", documentationId)).first();
        if (!webInfo) throw new ConvexError("Web info not found");
        if (!webLinks) throw new ConvexError("Web links not found");

        return {
            webInfo,
            webLinks,
        }
    },
})

export const getAllPageDocumentation = query({
    args: {
        documentationId: v.id("documentation"),
    }, handler: async (ctx, args) => {
        const allData = await ctx.db.query("pageDocumentation").withIndex("byDocumentationId", (q) => q.eq("documentationId", args.documentationId)).collect();
        const filtered = allData.map(({ markdown, ...data }) => data)
        return filtered
    }
})

export const startScrapeWebData = mutation({
    args: {
        documentationId: v.id("documentation"),
        pageUrl: v.string(),
        titleUrl: v.string()
    }, handler: async (ctx, args) => {
        const { documentation, userId } = await isDocumentationOwner(ctx, args.documentationId);

        // check if user can scrape web / check if user have token to proceed

        const pageDocumentationId = await ctx.db.insert("pageDocumentation", {
            documentationId: documentation._id,
            status: "starting",
            url: args.pageUrl,
            title: args.titleUrl,
            markdown: "",
        })

        await ctx.scheduler.runAfter(0, internal.v1.ai.enhanceMarkdown, {
            url: args.pageUrl,
            documentationId: documentation._id,
            pageDocumentationId
        })

        return true
    },
})

export const updateScrapeWebData = internalMutation({
    args: {
        documentationId: v.id("documentation"),
        pageDocumentationId: v.id("pageDocumentation"),
        markdown: v.string(),
        totalChunks: v.number()
    }, handler: async (ctx, args) => {
        const documentation = await ctx.db.get(args.documentationId);
        if (!documentation) throw new ConvexError("Documentation not found");
        await ctx.db.patch(args.pageDocumentationId, {
            status: "completed",
            markdown: args.markdown,
            totalChunks: args.totalChunks,
        })
        await ctx.db.patch(documentation._id, {
            activePage: documentation.activePage + 1
        })
    }
})

export const updateFailedScrapeWebData = internalMutation({
    args: {
        pageDocumentationId: v.id("pageDocumentation")
    }, handler: async (ctx, args) => {
        await ctx.db.patch(args.pageDocumentationId, {
            status: "failed"
        })
    },
})

export const createPageDocumentationChunk = internalMutation({
    args: {
        documentationId: v.id("documentation"),
        pageDocumentationId: v.id("pageDocumentation"),
        chunkIndex: v.number(),
        content: v.string(),
        embbeding: v.array(v.float64())
    }, handler: async (ctx, args) => {
        await ctx.db.insert("pageDocumentationChunks", {
            chunkIndex: args.chunkIndex,
            content: args.content,
            documentationId: args.documentationId,
            pageDocumentId: args.pageDocumentationId,
            embedding: args.embbeding
        })
    },
})

// helper

export const createDocumentationHelper = async (ctx: MutationCtx, args: WithoutSystemFields<Doc<"documentation">>) => {
    const createdId = await ctx.db.insert("documentation", { ...args })
    return createdId
}

export const saveFileAndMakeEmbedding = async (ctx: MutationCtx, args: {
    files: {
        fileDocumentId: Id<"fileDocumentation">;
        documentationId: Id<"documentation">;
        fileName: string;
        filePrefix: string;
        fileSize: number;
    }[],
}) => {
    for (const file of args.files) {
        const fileUrl = process.env.R2_PUBLIC_URL + "/" + file.filePrefix

        await ctx.scheduler.runAfter(0, internal.v1.ai.extractFileToText, {
            documentationId: file.documentationId,
            fileDocumentationId: file.fileDocumentId,
            fileUrl
        })

    }
}