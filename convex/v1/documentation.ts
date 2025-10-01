import { ConvexError, v } from "convex/values";
import { action, internalMutation, mutation, MutationCtx, query } from "../_generated/server";
import { isAuthenticated, isDocumentationOwner } from "../middleware";
import { WithoutSystemFields } from "convex/server";
import { Doc, Id } from "../_generated/dataModel";
import { file } from "better-auth";
import { deleteFileHelper } from "./upload";
import { documentationSchema } from "../tables/doumentationTable";
import { internal } from "../_generated/api";
import { autumn } from "../autumn";

// documentation

export const getAllDocumentation = query({
    handler: async (ctx) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new ConvexError("user not found")
        const allDocumentation = await ctx.db.query("documentation").withIndex("byUserId", (q) => q.eq("userId", user?.subject)).collect();
        return allDocumentation
    }
})

export const getDocumentationOptions = query({
    handler: async (ctx) => {
        const userId = await isAuthenticated(ctx);
        const allDocumentation = await ctx.db.query("documentation").withIndex("byUserId", (q) => q.eq("userId", userId)).collect();
        return allDocumentation.map((documentation) => ({
            name: documentation.name,
            id: documentation._id,
            type: documentation.type
        }))
    },
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

export const decrementUsage = action({
    args: {
        value: v.number()
    },
    handler: async (ctx, { value }) => {
        await autumn.track(ctx, {
            featureId: "scans",
            value: value
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

export const getAllFileDocumentationChunksContent = query({
    args: {
        fileDocumentationIds: v.array(v.id("fileDocumentationChunks"))
    }, handler: async (ctx, { fileDocumentationIds }) => {
        const collectedContent = await Promise.all(fileDocumentationIds.map(async (id) => {
            const fileDocumentation = await ctx.db.get(id);
            return fileDocumentation?.content
        }));

        const filteredContent = collectedContent.filter((content) => content !== undefined);

        return filteredContent;
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
        const { documentation } = await isDocumentationOwner(ctx, args.documentationId);
        const pageDocumentation = await ctx.db.query("pageDocumentation").withIndex("byDocumentationId", (q) => q.eq("documentationId", args.documentationId).eq("url", args.pageUrl)).first();
        // check if user can scrape web / check if user have token to proceed
        let pageDocumentationId = null

        if (pageDocumentation) {
            await ctx.db.patch(pageDocumentation._id, {
                status: "starting"
            })
            pageDocumentationId = pageDocumentation._id
        } else {
            pageDocumentationId = await ctx.db.insert("pageDocumentation", {
                documentationId: documentation._id,
                status: "starting",
                url: args.pageUrl,
                title: args.titleUrl,
                markdown: "",
            })
        }

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
        const user = await ctx.auth.getUserIdentity();
        const documentation = await ctx.db.get(args.documentationId);
        if (!documentation) throw new ConvexError("Documentation not found");
        await ctx.db.patch(args.pageDocumentationId, {
            status: "completed",
            markdown: args.markdown,
            totalChunks: args.totalChunks,
        })
        const updatedActive = documentation.activePage + 1
        await ctx.db.patch(documentation._id, {
            activePage: updatedActive > documentation.totalPage ? documentation.totalPage : updatedActive
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

export const scanAllPage = action({
    args: {
        documentationId: v.id("documentation"),
    }, handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new ConvexError("Unauthenticated");

        const { data } = await autumn.check(ctx, {
            featureId: "documentation_limit"
        })
        if (!data?.allowed) throw new ConvexError("Not allowed to scans all pages");

        const { data: scans } = await autumn.check(ctx, {
            featureId: "scans"
        })
        if (!scans || !scans.balance) throw new ConvexError("Insufficient scan credits")

        const result = await ctx.runMutation(internal.v1.documentation.scanAllPageMutation, {
            documentationId: args.documentationId,
            remainingBalance: scans.balance,
            userId: user.subject
        })
        if (result) {
            await autumn.track(ctx, {
                featureId: "scans",
                value: result.totalScans
            })
        }

        return true
    },
})

export const scanAllPageMutation = internalMutation({
    args: {
        remainingBalance: v.number(),
        documentationId: v.id("documentation"),
        userId: v.string()
    }, handler: async (ctx, args) => {

        const documentation = await ctx.db.get(args.documentationId);
        if (!documentation) throw new ConvexError("Documentation not found");
        if (documentation.userId !== args.userId) throw new ConvexError("Documentation not match")
        await ctx.db.patch(documentation._id, {
            status: "scan-all"
        })

        const allScannedDocumentation = await ctx.db.query("pageDocumentation").withIndex("byDocumentationId", (q) => q.eq("documentationId", documentation._id)).collect();
        const webLinks = await ctx.db.query("webLinks").withIndex("byDocumentationId", (q) => q.eq("documentationId", documentation._id)).first();
        if (!webLinks) throw new ConvexError("Web Link Not found")
        const allLinks: { url: string, title: string }[] = JSON.parse(webLinks?.links)
        const unscannedLink = allLinks.filter((link) => !allScannedDocumentation.some((scanned) => scanned.url === link.url && scanned.status !== "failed"))
        if (unscannedLink.length > args.remainingBalance) throw new ConvexError("Balance not enough");

        await Promise.all(unscannedLink.map(async (link, index) => {
            const createdPageDocumentation = allScannedDocumentation.find((scanned) => scanned.url === link.url);
            if (createdPageDocumentation) {
                await ctx.db.patch(createdPageDocumentation._id, {
                    status: "starting"
                })

                await ctx.scheduler.runAfter(index * 10000, internal.v1.ai.enhanceMarkdown, {
                    url: createdPageDocumentation.url,
                    documentationId: createdPageDocumentation.documentationId,
                    pageDocumentationId: createdPageDocumentation._id
                })

            } else {
                const pageDocumentationId = await ctx.db.insert("pageDocumentation", {
                    documentationId: documentation._id,
                    status: "starting",
                    url: link.url,
                    title: link.title,
                    markdown: "",
                })

                await ctx.scheduler.runAfter(index * 10000, internal.v1.ai.enhanceMarkdown, {
                    url: link.url,
                    documentationId: documentation._id,
                    pageDocumentationId
                })
            }

        }))

        return {
            totalScans: unscannedLink.length
        }
    },
})

export const deleteLinkPage = mutation({
    args: {
        url: v.string(),
        documentationId: v.id("documentation"),
    }, handler: async (ctx, args) => {
        const { documentation } = await isDocumentationOwner(ctx, args.documentationId)

        const webLinks = await ctx.db.query("webLinks").withIndex("byDocumentationId", (q) => q.eq("documentationId", documentation._id)).first();
        if (!webLinks) throw new ConvexError("Web Links not found");

        const pageDocumentation = await ctx.db.query("pageDocumentation").withIndex("byDocumentationId", (q) => q.eq("documentationId", documentation._id).eq("url", args.url)).first();

        if (pageDocumentation) {
            const allChunks = await ctx.db.query("pageDocumentationChunks").withIndex("byPageDocumentation", (q) => q.eq("pageDocumentId", pageDocumentation._id)).collect();
            await Promise.all(allChunks.map(async (chunk) => {
                await ctx.db.delete(chunk._id)
            }))

            await ctx.db.delete(pageDocumentation._id)
        }

        const newLinks: { url: string }[] = JSON.parse(webLinks.links)
        const filteredLinks = JSON.stringify(newLinks.filter((link) => link.url !== args.url))

        await ctx.db.patch(webLinks._id, {
            links: filteredLinks
        })
        await ctx.db.patch(documentation._id, {
            totalPage: documentation.totalPage - 1,
            activePage: documentation.activePage - (pageDocumentation ? 1 : 0)
        })

        return true
    }
})

export const getAllPageDocumentationChunksContent = query({
    args: {
        pageDocumentationIds: v.array(v.id("pageDocumentationChunks"))
    }, handler: async (ctx, { pageDocumentationIds }) => {
        const collectedContent = await Promise.all(pageDocumentationIds.map(async (id) => {
            const pageDocumentation = await ctx.db.get(id);
            return pageDocumentation?.content
        }));

        const filteredContent = collectedContent.filter((content) => content !== undefined);

        return filteredContent;
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