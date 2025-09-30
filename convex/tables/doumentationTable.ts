import { defineTable } from "convex/server";
import { v } from "convex/values";

export const documentationSchema = {
    userId: v.string(),
    name: v.string(),
    type: v.optional(v.string()),
    link: v.optional(v.string()),
    totalPage: v.number(),
    activePage: v.number(),
    updatedAt: v.optional(v.number()),
    draft: v.optional(v.boolean()),
    status: v.optional(v.string())
}

export const fileDocumentationSchema = {
    documentationId: v.id("documentation"),
    fileName: v.string(),
    filePrefix: v.string(),
    fileSize: v.number(),
    totalChunks: v.optional(v.number()),
    status: v.optional(v.string()),
}

export const fileDocumentationChunksSchema = {
    documentationId: v.id("documentation"),
    fileDocumentationId: v.id("fileDocumentation"),
    chunkIndex: v.number(),
    content: v.string(),
    embedding: v.array(v.float64())
}

export const documentationTable = defineTable(documentationSchema).index("byUserId", ["userId", "type"])

export const fileDocumentationTable = defineTable(fileDocumentationSchema).index("byDocumentationId", ["documentationId"])

export const fileDocumentationChunksTable = defineTable(fileDocumentationChunksSchema).index("byDocumentationId", ["documentationId"]).index("byFileDocumentationId", ["fileDocumentationId"])
    .vectorIndex("byEmbedding", {
        dimensions: 1536,
        vectorField: "embedding",
        filterFields: ["documentationId", "fileDocumentationId"]
    })