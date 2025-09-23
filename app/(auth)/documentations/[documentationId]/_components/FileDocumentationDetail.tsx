import {
  RiCloseLine,
  RiDownload2Line,
  RiFilePdf2Line,
  RiFileTextLine,
  RiFileWordLine,
  RiMarkdownLine,
  RiMore2Line,
} from "@remixicon/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";

import { formatBytes } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DialogBase from "@/components/dialog-base";
import { Button } from "@/components/ui/button";
import { useConvexMutation } from "@/lib/convex-functions";

const FileDocumentationDetail = ({
  documentationId,
}: {
  documentationId: Id<"documentation">;
}) => {
  const [selectedFiles, setSelectedFiles] =
    React.useState<Id<"fileDocumentation"> | null>(null);

  const filesData = useQuery(api.v1.documentation.getFilesDocumentation, {
    documentationId,
  });

  const { mutate, isPending } = useConvexMutation(
    api.v1.documentation.deleteFileDocumentation,
  );

  const handleDeleteFile = () => {
    if (isPending || !selectedFiles) return;
    mutate({ documentationId, fileDocumentationId: selectedFiles }).then(() => {
      setSelectedFiles(null);
    });
  };

  if (!filesData) return "Loading data...";

  return (
    <div className="mt-3">
      <div className="space-y-2">
        {filesData?.map((file) => {
          const ext = file.fileName.split(".").pop();
          return (
            <div className="bg-card flex items-center justify-between p-4 rounded-md">
              <div className="flex gap-4 items-center w-full">
                {ext === "md" ? (
                  <RiMarkdownLine size={32} />
                ) : ext === "pdf" ? (
                  <RiFilePdf2Line size={32} />
                ) : ext === "txt" ? (
                  <RiFileTextLine size={32} />
                ) : (
                  <RiFileWordLine size={32} />
                )}
                <div className="w-full">
                  <p>{file.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(file.fileSize)}
                  </p>
                </div>
              </div>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <RiMore2Line />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      {" "}
                      <RiDownload2Line />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedFiles(file._id)}
                    >
                      {" "}
                      <RiCloseLine /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
      <DialogBase
        header="Delete File"
        open={selectedFiles !== null}
        openChangeAction={() => setSelectedFiles(null)}
      >
        <div>
          <p>Are you sure want to delete this file from the documentation?</p>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => setSelectedFiles(null)}
              className="flex-1"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              variant="destructive"
              onClick={handleDeleteFile}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </DialogBase>
    </div>
  );
};

export default FileDocumentationDetail;
