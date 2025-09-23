"use client";
import { use } from "react";

import { Id } from "@/convex/_generated/dataModel";
import React from "react";
import DocumentationDetail from "./_components/DocumentationDetail";

function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentationId: string }>;
}) {
  const { documentationId } = use(params);

  console.log(documentationId);

  return (
    <div>
      {documentationId && (
        <DocumentationDetail
          documentationId={documentationId as Id<"documentation">}
        />
      )}
    </div>
  );
}

export default DocumentDetailPage;
