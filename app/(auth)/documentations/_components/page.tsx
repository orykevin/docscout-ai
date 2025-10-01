"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { useUserQuery } from "@/lib/convex-functions";
import {
  RiDeleteBinLine,
  RiFileCheckLine,
  RiFileCopy2Line,
  RiFileHistoryLine,
  RiMore2Line,
  RiPencilLine,
} from "@remixicon/react";
import Link from "next/link";
import React from "react";

const AllDocumentationList = () => {
  const data = useUserQuery(api.v1.documentation.getAllDocumentation);
  console.log(data);
  if (!data)
    return (
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton className="min-h-[10rem]" key={i} />
        ))}
      </div>
    );

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {data.map((doc) => {
          const leftPage = doc.totalPage - doc.activePage;
          const dateFrom = new Date(doc._creationTime).toDateString();
          const dateTo = doc.updatedAt
            ? new Date(doc.updatedAt).toDateString()
            : null;
          return (
            <Card
              key={doc._id}
              className="relative p-3 gap-2 flex-col justify-between"
            >
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="absolute top-2 right-1">
                    <Button variant="ghost" size="icon">
                      <RiMore2Line />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <RiPencilLine />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <RiDeleteBinLine />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div>
                  <Link
                    href={`/documentations/${doc._id}`}
                    className="text-lg font-semibold truncate block max-w-[calc(100%-2rem)]"
                  >
                    {doc.name}
                  </Link>
                  {doc.link && (
                    <a
                      className="text-muted-foreground text-sm"
                      href={doc.link}
                    >
                      {doc.link}
                    </a>
                  )}
                </div>
                <div className="py-2 my-2 border-y text-sm text-muted-foreground">
                  <p>Added : {dateFrom}</p>
                  <p>Updated: {dateTo || " - "}</p>
                </div>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger className="flex gap-1 items-center">
                      <RiFileCopy2Line className="size-5" />
                      <p className="text-sm font-semibold">{doc.totalPage}</p>
                    </TooltipTrigger>
                    <TooltipContent>
                      Total all pages : {doc.totalPage}
                    </TooltipContent>
                  </Tooltip>
                  {doc.type === "web" && doc.draft && doc.activePage === 0 ? (
                    <Badge variant="outline">Draft</Badge>
                  ) : (
                    <>
                      <Tooltip>
                        <TooltipTrigger className="flex gap-1 items-center">
                          <RiFileCheckLine className="size-5" />
                          <p className="text-sm font-semibold">
                            {doc.activePage}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          Total scanned pages : {doc.activePage}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger className="flex gap-1 items-center">
                          <RiFileHistoryLine className="size-5" />
                          <p className="text-sm font-semibold">
                            {leftPage || "-"}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          Total pending pages : {leftPage || "-"}
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>

                <div>
                  <Badge>{doc.type}</Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AllDocumentationList;
