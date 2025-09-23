import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { Link as LinkType } from "@/convex/v1/firecrawl";
import { useQuery } from "convex/react";
import React from "react";

export const WebDocumentationDetail = ({
  documentationId,
}: {
  documentationId: Id<"documentation">;
}) => {
  const data = useQuery(api.v1.documentation.getWebInfoData, {
    documentationId,
  });

  const links: LinkType[] = data?.webLinks.links
    ? JSON.parse(data?.webLinks.links)
    : [];
  console.log(links, data);
  if (!data) return <div>Loading...</div>;

  return (
    <div className="space-y-2">
      {links.map((link) => (
        <div className="bg-card p-3 rounded-md">
          <p className="font-semibold">{link.title}</p>
          <a
            className="text-sm text-muted-foreground"
            target="_blank"
            href={link.url}
          >
            {link.url}
          </a>
        </div>
      ))}
    </div>
  );
};
