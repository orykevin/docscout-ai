import { defineSchema } from "convex/server";
import { documentationTable, fileDocumentationChunksTable, fileDocumentationTable } from "./tables/doumentationTable";
import { documentationPageChunksTable, documentationPageTable, webInfoTable, webLinksTable } from "./tables/webDataTable";
import { messagesTable, threadTable } from "./tables/threadTable";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  documentation: documentationTable,
  fileDocumentation: fileDocumentationTable,
  fileDocumentationChunks: fileDocumentationChunksTable,
  webInfo: webInfoTable,
  webLinks: webLinksTable,
  pageDocumentation: documentationPageTable,
  pageDocumentationChunks: documentationPageChunksTable,
  thread: threadTable,
  messages: messagesTable
});
