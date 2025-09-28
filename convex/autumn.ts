import { components } from "./_generated/api";
import { Autumn } from "@useautumn/convex";
import { MutationCtx } from "./_generated/server";
import { Id } from "./betterAuth/_generated/dataModel";

type InternalUserData = {
    userId: Id<"user">;
    email: string;
    name: string;
}

export const autumn = new Autumn(components.autumn, {
    secretKey: process.env.AUTUMN_SECRET_KEY ?? "",
    identify: async (ctx: MutationCtx, internalUserData?: InternalUserData) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user && !internalUserData) return null;

        const userId = internalUserData ?? user?.subject
        return {
            customerId: userId,
            customerData: {
                name: internalUserData?.name ?? user?.name as string,
                email: internalUserData?.email ?? user?.email as string,
            },
        };
    },
});

export const {
    track,
    cancel,
    query,
    attach,
    check,
    checkout,
    usage,
    setupPayment,
    createCustomer,
    listProducts,
    billingPortal,
    createReferralCode,
    redeemReferralCode,
    createEntity,
    getEntity,
} = autumn.api();
