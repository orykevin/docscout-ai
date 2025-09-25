import { action } from "../_generated/server";
import { v } from "convex/values";

export const enhanceMarkdown = action({
    args: {
        url: v.string()
    },
    handler: async (ctx, args) => {
        const url = `https://r.jina.ai/${args.url}`
        const options = {
            method: "GET",
            headers: {
                Authorization: `Bearer ${process.env.JINA_AI_API_KEY}`
            }
        }

        const response = await fetch(url, options)
        const text = await response.text();
        return text
    }
})