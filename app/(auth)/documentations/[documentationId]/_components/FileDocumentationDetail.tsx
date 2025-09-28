import {
  RiCheckboxCircleFill,
  RiCloseCircleLine,
  RiCloseLine,
  RiDownload2Line,
  RiErrorWarningLine,
  RiFilePdf2Line,
  RiFileTextLine,
  RiFileWordLine,
  RiHourglass2Line,
  RiMarkdownLine,
  RiMore2Line,
  RiQrScanFill,
} from "@remixicon/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";

import { formatBytes } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useAction, useConvex, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DialogBase from "@/components/dialog-base";
import { Button } from "@/components/ui/button";
import { useConvexMutation } from "@/lib/convex-functions";
import { useCustomer } from "autumn-js/react";
import { toast } from "sonner";

const FileDocumentationDetail = ({
  documentationId,
}: {
  documentationId: Id<"documentation">;
}) => {
  const customer = useCustomer();
  const [selectedFiles, setSelectedFiles] =
    React.useState<Id<"fileDocumentation"> | null>(null);

  const filesData = useQuery(api.v1.documentation.getFilesDocumentation, {
    documentationId,
  });

  const { mutate, isPending } = useConvexMutation(
    api.v1.documentation.deleteFileDocumentation,
  );
  const { mutate: scanFile, isPending: isScanning } = useConvexMutation(
    api.v1.documentation.reScanFileDocument,
  );

  const decrement = useAction(api.v1.documentation.decrementUsage);

  const handleDeleteFile = () => {
    if (isPending || !selectedFiles || isScanning) return;
    mutate({ documentationId, fileDocumentationId: selectedFiles })
      .then(() => {
        setSelectedFiles(null);
        toast.success("File deleted successfully");
      })
      .catch((e) => {
        console.error(e);
        toast.error("Failed to delete file");
      });
  };

  const handleScanFile = async (
    fileDocumentationId: Id<"fileDocumentation">,
  ) => {
    if (!customer) return;
    const scansFeature = customer.customer?.features?.scans;
    if (!scansFeature || (scansFeature.balance || 0) <= 0) {
      toast.error("Insufficient balance to scan");
      return;
    }

    try {
      if (isPending || isScanning) return;
      await scanFile({ documentationId, fileDocumentationId });
      await decrement({ value: 1 });
      toast.success("File scanned successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to scan file");
    }
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
                  <div className="flex items-center gap-1">
                    {file.status === "starting" ? (
                      <RiHourglass2Line className="animate-spin" size={16} />
                    ) : file?.status === "completed" ? (
                      <RiCheckboxCircleFill size={16} />
                    ) : file?.status === "failed" ? (
                      <RiErrorWarningLine size={16} className="text-red-500" />
                    ) : (
                      <RiCloseCircleLine
                        size={16}
                        className="text-muted-foreground"
                      />
                    )}
                    <p>{file.fileName}</p>
                  </div>
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
                    <DropdownMenuLabel>
                      {file.status === "completed"
                        ? "File is scanned"
                        : "File is not scanned"}
                    </DropdownMenuLabel>
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
                    {file.status !== "completed" && (
                      <DropdownMenuItem
                        onClick={() => handleScanFile(file._id)}
                      >
                        {" "}
                        <RiQrScanFill /> Scan File
                      </DropdownMenuItem>
                    )}
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
