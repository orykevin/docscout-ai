import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexUploadFile } from "@/lib/convex-functions";
import { cn, formatBytes } from "@/lib/utils";
import {
  RiCloseLine,
  RiFilePdf2Line,
  RiFilePdfLine,
  RiFileTextLine,
  RiFileUploadLine,
  RiFileWordLine,
  RiMarkdownLine,
} from "@remixicon/react";
import { useCustomer } from "autumn-js/react";
import { useRouter } from "next/navigation";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

export type FileItem = {
  id: string;
  file: File;
  progress: number;
  isUploaded: boolean;
  uploadedId?: string;
  isError?: boolean;
};

const FileUpload = () => {
  const router = useRouter();
  const customer = useCustomer();
  const [files, setFiles] = React.useState<FileItem[]>([]);
  const inputNameRef = React.useRef<HTMLInputElement>(null);
  const { upload } = useConvexUploadFile(api.v1.upload, true);
  const { mutate, isPending } = useConvexMutation(
    api.v1.documentation.saveDocumentationFile,
  );

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Do something with the files
    const allowed = [".pdf", ".md", ".txt"];

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
    maxSize: 1 * 1024 * 1024,
  });

  const handleSaveDocumentation = () => {
    if (
      isPending ||
      files.length === 0 ||
      inputNameRef.current === null ||
      inputNameRef.current.value === "" ||
      !customer
    )
      return;
    const scansFeature = customer.customer?.features?.scans;

    if (
      !scansFeature ||
      (scansFeature.balance || 0) <= 0 ||
      (scansFeature.balance || 0) < files.length
    ) {
      toast.error(
        "Insufficient balance to scan " + (files.length > 1 ? "files" : "file"),
      );
      return;
    }

    const filesPayload = files
      .filter((f) => f.isUploaded)
      .map((f) => ({
        name: f.file.name,
        size: f.file.size,
        prefix: f.uploadedId!,
      }));

    mutate({
      files: filesPayload,
      name: inputNameRef.current.value,
    })
      .then((documentationId) => {
        if (!documentationId) return;
        toast.success("File uploaded and saved successfully");
        router.push("/documentations/" + documentationId);
      })
      .catch((e) => {
        console.log(e);
        toast.error("Failed to save documentation");
      });
  };

  return (
    <div className="mt-4 max-w-2xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="name">Name</Label>
          <Input className="mt-2" name="name" ref={inputNameRef} />
        </div>
        <Button
          onClick={handleSaveDocumentation}
          disabled={
            isPending ||
            files.length === 0 ||
            inputNameRef.current === null ||
            inputNameRef.current.value === ""
          }
        >
          Save Documentation
        </Button>
      </div>
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
          <p>File size should be less than 1MB</p>
        ) : isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <RiFileUploadLine size={32} aria-hidden="true" />
            <p>Drag and drop your file here, or choose a file</p>
            <p className="text-sm text-muted-foreground">
              MD,PDF,TXT up to 1MB
            </p>
            <Button className="mt-3">Upload</Button>
          </div>
        )}
      </div>
      <div className="mt-4 h-[calc(100svh-680px)] overflow-auto space-y-2 px-1">
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
                    setFiles((prev) => prev.filter((f) => f.id !== file.id));
                  }}
                >
                  <RiCloseLine />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileUpload;
