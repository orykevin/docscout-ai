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

export const webInfoTable = defineTable(webInfoSchema).index("byDocumentationId", ["documentationId"]).index("byUrl", ["url"]);
export const webLinksTable = defineTable(webLinksSchema).index("byDocumentationId", ["documentationId"]).index("byUrl", ["baseUrl"]);