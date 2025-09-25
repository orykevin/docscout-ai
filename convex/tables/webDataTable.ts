import { defineTable } from "convex/server";
import { v } from "convex/values";

export const webInfoSchema = {
    documentationId: v.id("documentation"),
    name: v.string(),
    description: v.string(),
    favIcon: v.string(),
    url: v.string(),
    rawData: v.string(),
}

export const webLinksSchema = {
    documentationId: v.id("documentation"),
    baseUrl: v.string(),
    links: v.string()
}

export const documentationPageSchema = {
    documentationId: v.id("documentation"),
    url: v.string(),
    title: v.string(),
    status: v.string(),
    totalChunks: v.optional(v.number()),
    markdown: v.string()
}

export const documentationPageChunksSchema = {
    documentationId: v.id("documentation"),
    documentationPageId: v.id("documentationPage"),
    content: v.string(),
    embedding: v.array(v.float64())
}

export const webInfoTable = defineTable(webInfoSchema).index("byDocumentationId", ["documentationId"]).index("byUrl", ["url"]);
export const webLinksTable = defineTable(webLinksSchema).index("byDocumentationId", ["documentationId"]).index("byUrl", ["baseUrl"]);

export const documentationPageTable = defineTable(documentationPageSchema).index("byDocumentationId", ["documentationId", "url"]);
// export const documentationPageChunksTable = defineTable(documentationPageChunksSchema).index("byDocumentationId", ["documentationId","url"]).index("byDocumentationPageId", ["documentationPageId"]).vectorIndex("byEmbedding", {
//     dimensions: 3072,

// })