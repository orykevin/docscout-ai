import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

export const isAuthenticated = async (ctx: MutationCtx | QueryCtx) => {
    // const identity = await ctx.auth.getUserIdentity();
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new ConvexError("Not authenticated");
    }
    return identity.subject;
}

export const isDocumentationOwner = async (ctx: MutationCtx | QueryCtx, documentationId: Id<"documentation">) => {
    const userId = await isAuthenticated(ctx)
    const documentation = await ctx.db.get(documentationId)
    if (!documentation) throw new ConvexError("Documentation not found")
    if (documentation.userId !== userId) throw new ConvexError("You are not owner of this documentation")
    return {
        userId,
        documentation
    }
}