/**
 * Chunk Markdown text into ~500-800 words.
 * - Keeps code blocks intact
 * - Splits by headings & paragraphs
 * - Avoids too small / too large chunks
 */
export function chunkMarkdown(
    text: string,
    options = { minWords: 100, maxWords: 800, overlap: 50 }
): string[] {
    const { minWords, maxWords, overlap } = options;

    const lines = text.split("\n");
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let insideCodeBlock = false;

    const wordCount = (str: string) => str.trim().split(/\s+/).length;

    const pushChunk = () => {
        if (currentChunk.length === 0) return;

        let chunkText = currentChunk.join("\n").trim();
        let words = wordCount(chunkText);

        if (words < minWords && chunks.length > 0) {
            // merge with previous if too small
            chunks[chunks.length - 1] += "\n" + chunkText;
        } else {
            chunks.push(chunkText);
        }

        currentChunk = [];
    };

    for (const line of lines) {
        // Detect code fences
        if (line.trim().startsWith("```")) {
            insideCodeBlock = !insideCodeBlock;
        }

        currentChunk.push(line);

        const chunkText = currentChunk.join("\n");
        const words = wordCount(chunkText);

        if (!insideCodeBlock && words >= maxWords) {
            pushChunk();

            // Add overlap (for prose only, not code)
            if (overlap > 0 && chunks.length > 0) {
                const lastChunk = chunks[chunks.length - 1];
                const lastWords = lastChunk.split(/\s+/);
                const overlapWords = lastWords.slice(-overlap);
                currentChunk = [overlapWords.join(" ")];
            }
        }
    }

    // Push remaining text
    pushChunk();

    return chunks;
}

export function chunkText(text: string, {
    maxChunkSize = 1000,   // maximum characters per chunk
    overlap = 100          // overlap to keep context between chunks
} = {}) {
    // Step 1: split by paragraphs
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

    const chunks = [];
    let currentChunk = "";

    for (const para of paragraphs) {
        // If adding this paragraph exceeds limit → push current chunk
        if ((currentChunk + "\n\n" + para).length > maxChunkSize) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }

            // If paragraph itself is bigger than maxChunkSize → hard split
            if (para.length > maxChunkSize) {
                for (let i = 0; i < para.length; i += maxChunkSize - overlap) {
                    chunks.push(para.slice(i, i + maxChunkSize));
                }
                currentChunk = "";
            } else {
                currentChunk = para;
            }
        } else {
            currentChunk += (currentChunk ? "\n\n" : "") + para;
        }
    }

    if (currentChunk) chunks.push(currentChunk.trim());

    return chunks;
}

/**
 * Represents a simplified chunk of text.
 */
export interface SimpleTextChunk {
    /** 
     * A descriptive heading for the chunk. 
     * This will be "Preamble" for text before the first heading,
     * or the actual heading for subsequent sections.
     */
    heading: string;
    /** The actual text content of the chunk. */
    content: string;
    /** The character count of the content. */
    charCount: number;
}

/**
 * Configuration options for the chunking function.
 */
export interface ChunkingOptions {
    /** 
     * The target maximum size for each chunk in characters. 
     * If a section split by a heading is larger than this, it will be 
     * further split by paragraphs. Note: A single paragraph that exceeds 
     * this size will NOT be split, to preserve semantic meaning.
     * @default 2000
     */
    maxChunkSize?: number;
}

/**
 * Chunks a large text extracted from a PDF into smaller, semantically-meaningful pieces,
 * returning an array of objects with 'heading' and 'content' properties.
 * 
 * The strategy is hierarchical:
 * 1. It first splits the document by major markdown-style headings (e.g., "# INTRODUCTION").
 * 2. It treats the text before the first heading as a "preamble" section.
 * 3. For each section (preamble or heading-based), it checks if its size exceeds `maxChunkSize`.
 * 4. If a section is too large, it is broken down into smaller chunks based on paragraphs.
 *    Paragraphs are greedily combined to create chunks as large as possible without
 *    exceeding `maxChunkSize`. Each sub-chunk will inherit the main section's heading.
 * 
 * @param pdfText The raw string content extracted from a PDF.
 * @param options Configuration for the chunking process.
 * @returns An array of SimpleTextChunk objects.
 */
export function chunkPdfTextSimple(
    pdfText: string,
    options?: ChunkingOptions
): SimpleTextChunk[] {
    const { maxChunkSize = 2000 } = options ?? {};

    const cleanedText = pdfText
        .replace(/Š/g, '*') // Normalize the special character
        .replace(/\r\n/g, '\n') // Normalize newlines
        .trim();

    // Split by major headings. The regex keeps the heading at the start of each section.
    const majorSections = cleanedText.split(/(?=^\s*#\s+.+)/m);

    const finalChunks: SimpleTextChunk[] = [];
    let currentPreamble = '';

    for (const section of majorSections) {
        if (!section.trim()) continue;

        const headingMatch = section.match(/^\s*#\s+(.+)/);

        if (headingMatch) {
            // Process any accumulated preamble text before the first heading.
            if (currentPreamble.trim()) {
                processAndAddSimpleChunks(
                    currentPreamble,
                    "Preamble",
                    maxChunkSize,
                    finalChunks
                );
                currentPreamble = ''; // Reset preamble
            }

            const sourceHeading = headingMatch[1].trim();
            processAndAddSimpleChunks(section, sourceHeading, maxChunkSize, finalChunks);

        } else {
            // This section doesn't start with a # heading, so it's part of the preamble.
            currentPreamble += section;
        }
    }

    // Process any remaining preamble text if the document had no headings or if the last part was preamble.
    if (currentPreamble.trim()) {
        processAndAddSimpleChunks(
            currentPreamble,
            "Preamble",
            maxChunkSize,
            finalChunks
        );
    }

    return finalChunks;
}

/**
 * Helper function to process a section of text (either preamble or from a heading)
 * and add it to the final chunks array in the desired simple format.
 * If the section is too large, it splits it by paragraphs.
 */
function processAndAddSimpleChunks(
    sectionText: string,
    heading: string, // This will be "Preamble" or the extracted heading.
    maxChunkSize: number,
    finalChunks: SimpleTextChunk[]
) {
    const trimmedSection = sectionText.trim();

    // If the section itself is not too large, add it as one chunk.
    if (trimmedSection.length <= maxChunkSize) {
        finalChunks.push({
            heading: heading,
            content: trimmedSection,
            charCount: trimmedSection.length,
        });
    } else {
        // The section is too large, split it into smaller chunks based on paragraphs.
        const paragraphs = trimmedSection.split(/\n\n+/).filter(p => p.trim());
        let currentChunkContent = '';

        for (const paragraph of paragraphs) {
            const separator = currentChunkContent.length > 0 ? '\n\n' : '';
            // Check if adding the next paragraph would exceed the max chunk size.
            if (currentChunkContent.length + paragraph.length + separator.length <= maxChunkSize) {
                currentChunkContent += separator + paragraph;
            } else {
                // Current chunk is full, push it and start a new one with the current paragraph.
                finalChunks.push({
                    heading: heading, // Inherits the main section's heading
                    content: currentChunkContent,
                    charCount: currentChunkContent.length,
                });
                currentChunkContent = paragraph; // Start new chunk with this paragraph
            }
        }

        // Push the last remaining chunk if there's any content left.
        if (currentChunkContent.length > 0) {
            finalChunks.push({
                heading: heading, // Inherits the main section's heading
                content: currentChunkContent,
                charCount: currentChunkContent.length,
            });
        }
    }
}