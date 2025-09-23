"use client";

import React, { useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const links = [
  "https://convex-better-auth.netlify.app/supported-plugins",
  "https://convex-better-auth.netlify.app/basic-usage",
  "https://convex-better-auth.netlify.app/framework-guides/react",
  "https://convex-better-auth.netlify.app/migrate-to-0-8",
  "https://convex-better-auth.netlify.app/framework-guides/tanstack-start",
  "https://convex-better-auth.netlify.app/debugging",
  "https://convex-better-auth.netlify.app/triggers",
  "https://convex-better-auth.netlify.app/local-install",
  "https://convex-better-auth.netlify.app/framework-guides/expo",
  "https://convex-better-auth.netlify.app",
  "https://convex-better-auth.netlify.app/framework-guides/next",
  "https://convex-better-auth.netlify.app/authorization",
  "http://convex-better-auth.netlify.app",
  "https://convex-better-auth.netlify.app/integrations/hono",
];

function buildGraph(urls: string[]) {
  const urlObjs = urls.map((u) => new URL(u));
  const nodes: any[] = [];
  const edges: any[] = [];

  const seen = new Map<string, boolean>();

  // Track y positions so siblings don’t overlap
  let yOffsetByDepth: Record<number, number> = {};

  urlObjs.forEach((url) => {
    const path = url.pathname === "/" ? "" : url.pathname;
    const parts = path.split("/").filter(Boolean);

    let accumulated = url.origin;
    for (let j = 0; j <= parts.length; j++) {
      const id = accumulated + (j > 0 ? "/" + parts.slice(0, j).join("/") : "");
      const label = id.replace(url.origin, "") || url.origin;

      if (!seen.has(id)) {
        const depth = j; // how deep in the path
        const x = depth * 200; // indent per depth
        const y = (yOffsetByDepth[depth] ?? 0) * 80; // space siblings
        yOffsetByDepth[depth] = (yOffsetByDepth[depth] ?? 0) + 1;

        nodes.push({
          id,
          data: { label },
          position: { x, y },
          sourcePosition: "right",
          targetPosition: "left",
        });
        seen.set(id, true);
      }

      if (j > 0) {
        const parentId =
          parts.length > 1
            ? accumulated + "/" + parts.slice(0, j - 1).join("/")
            : accumulated;
        edges.push({
          id: parentId + "->" + id,
          source: parentId,
          target: id,
        });
      }
    }
  });

  return { nodes, edges };
}

export default function PageFlow() {
  const { nodes, edges } = useMemo(() => buildGraph(links), []);

  console.log({ nodes, edges });

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView className="text-black">
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
