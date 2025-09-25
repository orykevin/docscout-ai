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
}

export const fileDocumentationSchema = {
    documentationId: v.id("documentation"),
    fileName: v.string(),
    filePrefix: v.string(),
    fileSize: v.number(),
}

export const documentationTable = defineTable(documentationSchema).index("byUserId", ["userId", "type"])

export const fileDocumentationTable = defineTable(fileDocumentationSchema).index("byDocumentationId", ["documentationId"])