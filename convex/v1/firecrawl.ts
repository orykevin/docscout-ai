import { ConvexError, v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export type Metadata = {
    favicon: string;
    viewport: string;
    "next-size-adjust": string;
    description: string;
    language: string;
    title: string;
    scrapeId: string;
    sourceURL: string;
    url: string;
    statusCode: number;
    contentType: string;
    proxyUsed: string;
    cacheState: string;
    cachedAt: string; // ISO date string
    creditsUsed: number;
};

export type MetadataResponse = {
    success: boolean;
    data: {
        metadata: Metadata;
    }
};

export type Link = {
    url: string;
    title: string;
    description?: string;
}

type MapResponse = {
    success: boolean;
    links: Link[];
}


const url = "https://api.firecrawl.dev/v2/map"

export const actionMappingSite = action({
    args: {
        url: v.string()
    }, handler: async (ctx, args) => {
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.FIRECRAWL_TOKEN as string}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "url": args.url,
                "limit": 5000,
                "includeSubdomains": false,
                "sitemap": "include"
            })
        };

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            console.log(data);
            return
        } catch (error) {
            console.error(error);
        }
    }
})

export const scrapeSiteInfo = action({
    args: {
        url: v.string()
    },
    returns: v.id("documentation"),
    handler: async (ctx, args) => {
        const mapUrl = "https://api.firecrawl.dev/v2/map"
        const scrapeUrl = 'https://api.firecrawl.dev/v2/scrape';

        const mapOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.FIRECRAWL_TOKEN as string}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "url": args.url,
                "limit": 5000,
                "includeSubdomains": false,
                "sitemap": "include"
            })
        };

        const scrapeOptions = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.FIRECRAWL_TOKEN as string}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "url": args.url,
                "onlyMainContent": false,
                "maxAge": 172800000,
                "parsers": [],
                "formats": []
            })
        };

        const userId = await ctx.auth.getUserIdentity();
        if (!userId) throw new ConvexError("Not Authenticated");
        try {
            const mapResponse = await fetch(mapUrl, mapOptions);
            const mapData = await mapResponse.json() as MapResponse;
            const scrapeResponse = await fetch(scrapeUrl, scrapeOptions);
            const scrapeDataResponse = await scrapeResponse.json() as MetadataResponse
            const scrapeData = scrapeDataResponse.data.metadata
            const filterMapData = mapData.links.filter((link) => link.url)

            console.log(scrapeData)
            console.log(mapData)

            const documentationId: Id<"documentation"> = await ctx.runMutation(internal.v1.documentation.createDocumentation, {
                name: scrapeData.title,
                link: scrapeData.sourceURL,
                activePage: 0,
                totalPage: filterMapData.length,
                userId: userId.subject,
                type: "web",
                draft: true,
            })

            await ctx.runMutation(internal.v1.scrapeWeb.saveWebData, {
                documentationId,
                webInfo: JSON.stringify(scrapeData),
                webLinks: JSON.stringify(filterMapData)
            })

            if (!documentationId) throw new ConvexError("Failed when try to scrape")
            return documentationId
        } catch (error) {
            console.error(error);
            throw new ConvexError("Error when try to scrape")
        }
    }

})
