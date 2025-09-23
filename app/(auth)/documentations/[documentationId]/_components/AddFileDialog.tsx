import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useConvexMutation, useConvexUploadFile } from "@/lib/convex-functions";
import {
  RiAddLine,
  RiCloseLine,
  RiFilePdf2Line,
  RiFileTextLine,
  RiFileUploadLine,
  RiFileWordLine,
  RiMarkdownLine,
} from "@remixicon/react";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { FileItem } from "../../new/_components/file-upload";
import { api } from "@/convex/_generated/api";
import { cn, formatBytes } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

const AddFileDialog = ({
  documentationId,
}: {
  documentationId: Id<"documentation">;
}) => {
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState<FileItem[]>([]);
  const inputNameRef = React.useRef<HTMLInputElement>(null);
  const { upload } = useConvexUploadFile(api.v1.upload);
  const { mutate, isPending } = useConvexMutation(
    api.v1.documentation.addFilesDocumentation,
  );

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Do something with the files
    const allowed = [".pdf", ".md", ".txt", ".doc", ".docx"];

    const filtered = acceptedFiles
      .filter((file) =>
        allowed.some((ext) => file.name.toLowerCase().endsWith(ext)),
      )
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        isUploaded: false,
        uploadedId: undefined,
      }));

    setFiles((prev) => [...prev, ...filtered]);
    // handling upload
    for (const file of filtered) {
      upload(file.file, {
        onUploadProgress: (e) => {
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id === file.id) {
                return { ...f, progress: e.percentage };
              }
              return f;
            }),
          );
        },
      })
        .then((id) => {
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id === file.id) {
                return { ...f, isUploaded: true, uploadedId: id };
              }
              return f;
            }),
          );
        })
        .catch((e) => {
          console.error(e);
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id === file.id) {
                return { ...f, isError: true };
              }
              return f;
            }),
          );
        });
    }

    console.log(filtered);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
  });

  const handleSaveUploadedFile = () => {
    mutate({
      documentationId,
      files: files.map((f) => ({
        name: f.file.name,
        prefix: f.uploadedId!,
        size: f.file.size,
      })),
    })
      .then((documentationId) => {
        if (!documentationId) return;
        setOpen(false);
        setFiles([]);
      })
      .catch((e) => console.error(e));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <RiAddLine />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="md:max-w-[600px] !h-screen !max-h-[90vh]">
        <div className="space-y-3">
          <h4>Add More File</h4>
          <div
            {...getRootProps()}
            className={cn(
              "border-dashed border-2 flex flex-col items-center justify-center h-[200px] rounded-md bg-input/50",
              isDragActive && "border-primary bg-primary/15",
              isDragReject && "border-destructive bg-destructive/15",
            )}
          >
            <input {...getInputProps()} />
            {isDragReject ? (
              <p>File type not supported</p>
            ) : isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <RiFileUploadLine size={32} aria-hidden="true" />
                <p className="text-center">
                  Drag and drop your file here <br /> or choose a file
                </p>
                <p className="text-sm text-muted-foreground">
                  MD,PDF,TXT,DOC,DOCX up to 5MB
                </p>
                <Button className="mt-3">Upload</Button>
              </div>
            )}
          </div>
          <div className="mt-2 h-[calc(100svh-432px)] overflow-auto space-y-2 px-1">
            {files.map((file) => {
              const fileData = file.file;
              const ext = fileData.name.split(".").pop();
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
                      <p>{fileData.name}</p>
                      {file.isUploaded ? (
                        <p className="text-sm text-muted-foreground">
                          {formatBytes(fileData.size)}
                        </p>
                      ) : (
                        <div className="w-[95%] h-3 relative bg-muted-foreground/75 overflow-hidden rounded-md">
                          <span
                            className="absolute left-0 top-0 h-full bg-primary"
                            style={{ width: `${file.progress}%` }}
                            aria-hidden="true"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-max">
                    <Button
                      size={"icon"}
                      variant={"ghost"}
                      onClick={() => {
                        setFiles((prev) =>
                          prev.filter((f) => f.id !== file.id),
                        );
                      }}
                    >
                      <RiCloseLine />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button
              variant={"outline"}
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveUploadedFile}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFileDialog;
