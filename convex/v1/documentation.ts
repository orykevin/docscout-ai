import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, MutationCtx, query } from "../_generated/server";
import { isAuthenticated, isDocumentationOwner } from "../middleware";
import { WithoutSystemFields } from "convex/server";
import { Doc } from "../_generated/dataModel";
import { file } from "better-auth";
import { deleteFileHelper } from "./upload";
import { documentationSchema } from "../tables/doumentationTable";

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
            activePage: args.files.length,
            userId: userId
        })

        await Promise.all(args.files.map(async (file) => {
            await ctx.db.insert("fileDocumentation", {
                fileName: file.name,
                filePrefix: file.prefix,
                fileSize: file.size,
                documentationId,
            })
        }))

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
        await Promise.all(args.files.map(async (file) => {
            await ctx.db.insert("fileDocumentation", {
                documentationId: documentation._id,
                fileName: file.name,
                filePrefix: file.prefix,
                fileSize: file.size
            })
        }))
        await ctx.db.patch(documentation._id, {
            updatedAt: Date.now(),
            activePage: documentation.activePage + args.files.length,
            totalPage: documentation.totalPage + args.files.length
        })

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
        return {
            message: "Successfully delete file"
        }
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

// helper

export const createDocumentationHelper = async (ctx: MutationCtx, args: WithoutSystemFields<Doc<"documentation">>) => {
    const createdId = await ctx.db.insert("documentation", { ...args })
    return createdId
}