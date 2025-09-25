import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import ToolTipButton from "@/components/ui/tooltip-button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { Link, Link as LinkType } from "@/convex/v1/firecrawl";
import { useDebounce } from "@/hooks/use-debounce";
import {
  RiFilter2Line,
  RiHourglassLine,
  RiMore2Line,
  RiSearchLine,
} from "@remixicon/react";
import { useQuery } from "convex/react";
import React, { useEffect } from "react";

export const WebDocumentationDetail = ({
  documentationId,
}: {
  documentationId: Id<"documentation">;
}) => {
  const [search, setSearch] = React.useState("");
  const [searchApplied, setSearchApplied] = React.useState<null | Link[]>(null);
  const debounceText = useDebounce(search, 250);

  const data = useQuery(api.v1.documentation.getWebInfoData, {
    documentationId,
  });

  useEffect(() => {
    if (debounceText && data?.webLinks.links) {
      const links = JSON.parse(data?.webLinks.links) as Link[];
      const filteredLinks = links.filter((link) => {
        const excludeBaseUrl = link.url.split("/").slice(2).join("/");
        return (
          link.title.toLowerCase().includes(debounceText.toLowerCase()) ||
          excludeBaseUrl.toLowerCase().includes(debounceText.toLowerCase())
        );
      });
      setSearchApplied(filteredLinks);
    } else {
      setSearchApplied(null);
    }
  }, [debounceText, data]);

  const links: LinkType[] = data?.webLinks.links
    ? JSON.parse(data?.webLinks.links)
    : [];
  if (!data) return <div>Loading...</div>;

  return (
    <div className="pb-6">
      <div className="flex items-center gap-3  mb-4">
        <div className="w-ful relative w-full">
          <RiSearchLine
            size={18}
            className="absolute top-3 left-3 text-muted-foreground"
          />
          <Input
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search page"
            className="pl-10 h-10 text-base"
          />
        </div>
        <div className="min-w-max">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolTipButton tooltip="Filter" variant={"outline"}>
                <RiFilter2Line />
              </ToolTipButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter</DropdownMenuLabel>
              <DropdownMenuItem>Scanned</DropdownMenuItem>
              <DropdownMenuItem>Unscanned</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="space-y-2">
        {(searchApplied || links).map((link) => (
          <div className="bg-card p-3 rounded-md flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <RiHourglassLine className="text-muted-foreground" size={14} />

                <p className="font-semibold truncate w-[calc(100% - 2rem)]">
                  {link.title}
                </p>
              </div>
              <a
                className="text-sm text-muted-foreground"
                target="_blank"
                href={link.url}
              >
                {link.url}
              </a>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <RiMore2Line />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Page not scanned</DropdownMenuLabel>
                <DropdownMenuItem>Scan</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
};
