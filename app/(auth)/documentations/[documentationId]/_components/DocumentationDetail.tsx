"use client";

import DialogBase from "@/components/dialog-base";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiPencilLine,
} from "@remixicon/react";
import { useQuery } from "convex/react";
import Link from "next/link";
import React, { useEffect } from "react";
import FileDocumentationDetail from "./FileDocumentationDetail";
import { Input } from "@/components/ui/input";
import { useConvexMutation } from "@/lib/convex-functions";
import { Loader2 } from "lucide-react";
import AddFileDialog from "./AddFileDialog";
import { WebDocumentationDetail } from "./WebDocumentationDetail";
import { useCustomer } from "autumn-js/react";

const DocumentationDetail = ({
  documentationId,
}: {
  documentationId: Id<"documentation">;
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const data = useQuery(api.v1.documentation.getDocumentation, {
    documentationId: documentationId,
  });
  const { mutate, isPending } = useConvexMutation(
    api.v1.documentation.updateDocumentation,
  );

  if (!data) return <div>Loading...</div>;

  const createdDate = new Date(data._creationTime);
  const updatedDate = data.updatedAt ? new Date(data?.updatedAt) : null;

  const handleSaveEditName = () => {
    if (!isEditing) {
      setIsEditing(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      if (
        isPending ||
        !inputRef.current ||
        inputRef.current.value === "" ||
        inputRef.current.value === data.name
      ) {
        setIsEditing(false);
        return;
      }
      mutate({ documentationId: documentationId, name: inputRef.current.value })
        .then(() => {
          setIsEditing(false);
        })
        .catch((e) => {
          console.error(e);
          setIsEditing(false);
        });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveEditName();
  };

  return (
    <div className="mt-3">
      <div className="max-w-2xl mx-auto">
        <div>
          <Link
            href="/documentations"
            className="flex items-center text-sm text-muted-foreground gap-2 underline"
          >
            <RiArrowLeftLine size={16} />
            Back
          </Link>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <div className="w-full flex items-center gap-2 max-w-[90%]">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="w-max max-w-[90%]">
                <Input
                  className="text-2xl font-bold w-max max-w-full field-sizing-content -ml-2 p-2"
                  defaultValue={data.name}
                  ref={inputRef}
                />
              </form>
            ) : (
              <h1 className="text-2xl font-bold max-w-[90%] truncate text-ellipsis py-0.5">
                {data.name}
              </h1>
            )}
            <Button
              className="h-6 w-6 p-0 hover:bg-muted rounded-md cursor-pointer"
              variant={"ghost"}
              onClick={handleSaveEditName}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : isEditing ? (
                <RiCheckLine size={16} />
              ) : (
                <RiPencilLine size={16} />
              )}
            </Button>
          </div>
          <Badge>{data.type}</Badge>
        </div>

        <div className="flex gap-1 text-sm text-muted-foreground">
          <span>Created at {createdDate.toDateString()}</span>
          {updatedDate && (
            <span>- Last Updated at {updatedDate.toDateString()} </span>
          )}
        </div>
        {data.type === "files" ? (
          <>
            <div className="mt-4 mb-2 flex items-center justify-between">
              <p className="text-base font-semibold">All files</p>
              <AddFileDialog documentationId={documentationId} />
            </div>
            <FileDocumentationDetail documentationId={documentationId} />
          </>
        ) : (
          <WebDocumentationDetail
            documentationId={documentationId}
            totalPage={data.totalPage}
            activePage={data.activePage}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentationDetail;
