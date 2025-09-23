import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { Metadata } from "./firecrawl";

export const saveWebData = internalMutation({
    args: {
        documentationId: v.id('documentation'),
        webInfo: v.string(),
        webLinks: v.string(),

    }, handler: async (ctx, args) => {
        const webInfo = JSON.parse(args.webInfo) as Metadata

        await ctx.db.insert("webInfo", {
            name: webInfo?.title || "",
            url: webInfo?.url || "",
            description: webInfo?.description || "",
            favIcon: webInfo?.favicon || "",
            documentationId: args.documentationId,
            rawData: args.webInfo
        })

        await ctx.db.insert("webLinks", {
            documentationId: args.documentationId,
            baseUrl: webInfo?.url || "",
            links: args.webLinks,
        })

        return true
    }
})