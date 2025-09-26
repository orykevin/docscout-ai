import { action, internalAction } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { z } from "zod"
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { internal } from "../_generated/api";
import { embed } from 'ai';
import { chunkPdfTextSimple } from "../utils/lib";

export const enhanceMarkdown = internalAction({
    args: {
        url: v.string(),
        documentationId: v.id("documentation"),
        pageDocumentationId: v.id("pageDocumentation")
    },
    handler: async (ctx, { url, documentationId, pageDocumentationId }) => {
        try {
            const data = {
                url,
                // jsonSchema: {
                //     type: "array",
                //     description: "List of documentation sections",
                //     items: {
                //         type: "object",
                //         properties: {
                //             header: {
                //                 type: "string",
                //                 description: "Section or header title of the documentation"
                //             },
                //             content: {
                //                 type: "string",
                //                 description: "Content or explanation under the header"
                //             }
                //         },
                //         required: [
                //             "header",
                //             "content"
                //         ]
                //     }
                // },
                // instruction: "exclude navigation, img, svg, footer. make sure get the content and the heading"
            };

            const options = {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + process.env.JINA_AI_API_KEY,
                    'Content-Type': 'application/json',
                    'X-Remove-Selector': 'header, footer, img, svg',
                    'X-Respond-With': 'readerlm-v2'
                },
                body: JSON.stringify(data)
            };

            const response = await fetch('https://r.jina.ai/', options)
            const text = await response.text();

            await ctx.runAction(internal.v1.ai.chunkingMarkdown, { markdown: text, documentationId, pageDocumentationId })

            return text
        } catch (e) {
            console.log(e)
            await ctx.runMutation(internal.v1.documentation.updateFailedScrapeWebData, { pageDocumentationId })
        }
    },

})

export const chunkingMarkdown = internalAction({
    args: {
        markdown: v.string(),
        documentationId: v.id("documentation"),
        pageDocumentationId: v.id("pageDocumentation")
    },
    handler: async (ctx, { documentationId, pageDocumentationId, markdown }) => {
        try {
            const { object } = await generateObject({
                model: openai("gpt-4o-mini-2024-07-18"),
                schema: z.object({
                    sections: z.array(z.object({
                        heading: z.string(),
                        content: z.string()
                    }))
                }),
                system: 'You are markdown extractor for seperate all markdown to section',
                prompt: `
            Extract ALL DATA into section AND IF THE ONE section is really SHORT, please combine with others JUST MAKE SURE not too long for embeddings small (8191 Token).
            MAKE Content Per section is not below 200 character or above 3000 character IF POSSIBLE. and summarize combined in heading.
            Extract to parts / chunks, and make sure it's good for embeddings.
            IF there some code , please include all

            markdown:
            ${markdown}
        `
            });


            await ctx.runAction(internal.v1.ai.embeddingChunks, { documentationId, pageDocumentationId, markdown, sections: JSON.stringify(object.sections) })

        } catch (e) {
            console.log(e);
            await ctx.runMutation(internal.v1.documentation.updateFailedScrapeWebData, { pageDocumentationId: pageDocumentationId })
        }
    },
})

export const embeddingChunks = internalAction({
    args: {
        documentationId: v.id("documentation"),
        pageDocumentationId: v.id("pageDocumentation"),
        sections: v.string(),
        markdown: v.string(),
    }, handler: async (ctx, { documentationId, pageDocumentationId, markdown, sections }) => {

        try {
            const sectionsArray: { heading: string, content: string }[] = JSON.parse(sections);

            await Promise.all(sectionsArray.map(async (chunk, i) => {
                const content = chunk.heading + '\n' + chunk.content

                const { embedding } = await embed({
                    model: openai.textEmbeddingModel("text-embedding-3-small"),
                    value: content
                })

                await ctx.runMutation(internal.v1.documentation.createPageDocumentationChunk, {
                    documentationId,
                    pageDocumentationId,
                    chunkIndex: i,
                    content: content,
                    embbeding: embedding
                })
            }))

            await ctx.runMutation(internal.v1.documentation.updateScrapeWebData, { documentationId, pageDocumentationId, markdown, totalChunks: sectionsArray.length });

        } catch (e) {
            console.log(e);
            await ctx.runMutation(internal.v1.documentation.updateFailedScrapeWebData, { pageDocumentationId: pageDocumentationId })
        }
    },
})

export const extractFileToText = internalAction({
    args: {
        fileUrl: v.string(),
        documentationId: v.id("documentation"),
        fileDocumentationId: v.id("fileDocumentation"),
    }, handler: async (ctx, { fileUrl, documentationId, fileDocumentationId }) => {
        try {
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + process.env.JINA_AI_API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: fileUrl })
            };

            const response = await fetch('https://r.jina.ai/', options)

            const text = await response.text();
            console.log(text)
            const chunked = chunkPdfTextSimple(text);
            const filtered = chunked.filter((chunk) => chunk.charCount > 100);
            if (filtered.length === 0) {
                await ctx.runMutation(internal.v1.documentation.updateFailedEmbedFile, { fileDocumentationId, status: 'no-data' })
            } else {
                await ctx.runAction(internal.v1.ai.embeddingFileDocumentation, {
                    documentationId,
                    fileDocumentationId,
                    files: filtered
                })
            }

        } catch (e) {
            console.log(e);
            await ctx.runMutation(internal.v1.documentation.updateFailedEmbedFile, { fileDocumentationId });
        }
    },
})

export const embeddingFileDocumentation = internalAction({
    args: {
        files: v.array(v.object({
            heading: v.string(),
            content: v.string(),
            charCount: v.number()
        })),
        documentationId: v.id("documentation"),
        fileDocumentationId: v.id("fileDocumentation")
    }, handler: async (ctx, { documentationId, fileDocumentationId, files }) => {

        await Promise.all(files.map(async (file, index) => {
            const { embedding } = await embed({
                model: openai.textEmbeddingModel("text-embedding-3-small"),
                value: file.content
            })

            await ctx.runMutation(internal.v1.documentation.createFileDocumentationChunk, {
                documentationId,
                fileDocumentationId,
                chunkIndex: index,
                content: file.content,
                embedding
            })

        }))

        await ctx.runMutation(internal.v1.documentation.updateFileDocumentation, {
            documentationId,
            fileDocumentationId,
            totalChunks: files.length
        })
    },
})