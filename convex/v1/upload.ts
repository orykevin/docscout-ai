import { R2 } from "@convex-dev/r2";
import { components } from "../_generated/api";
import { ConvexError, v } from "convex/values";
import { mutation, MutationCtx } from "../_generated/server";
import { isAuthenticated } from "../middleware";

export const r2 = new R2(components.r2);

export const { generateUploadUrl, syncMetadata, getMetadata } = r2.clientApi({
    checkUpload: async (ctx) => {
        const userId = await isAuthenticated(ctx as any);
        if (!userId) throw new ConvexError("Unauthorized, You must logged in first")
        // check if they already subscribe for future implementation
    },
    onUpload: async (ctx, bucket, key) => {
        // ...do something with the key
        // Runs in the `syncMetadata` mutation, as the upload is performed from the
        // client side. Convenient way to create relations between the newly created
        // object key and other data in your Convex database. Runs after the `checkUpload`
        // callback.
        const userId = await isAuthenticated(ctx as any)
        if (!userId) throw new ConvexError("Unauthorized, You must logged in first")
    },
});

export const generateUploadUrlWithPrefix = mutation({
    args: { prefix: v.optional(v.string()), key: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await isAuthenticated(ctx)
        if (!userId) throw new ConvexError("Unauthorized, You must logged in first")
        const prefix = args.prefix || "temp/";
        const key = args?.key || `${prefix}${crypto.randomUUID()}`;
        return r2.generateUploadUrl(key);
    },
});

export const deleteFileHelper = async (ctx: MutationCtx, key: string) => {
    return await r2.deleteObject(ctx, key)
}

