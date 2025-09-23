import { defineSchema } from "convex/server";
import { documentationTable, fileDocumentationTable } from "./tables/doumentationTable";
import { webInfoTable, webLinksTable } from "./tables/webDataTable";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  documentation: documentationTable,
  fileDocumentation: fileDocumentationTable,
  webInfo: webInfoTable,
  webLinks: webLinksTable,
});
