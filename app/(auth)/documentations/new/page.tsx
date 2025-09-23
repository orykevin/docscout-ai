"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RiFile2Line,
  RiGlobalLine,
  RiGlobeLine,
  RiInputField,
} from "@remixicon/react";
import { useState } from "react";
import WebSection from "./_components/web-section";
import FileUpload from "./_components/file-upload";

const NewDocumentationPage = () => {
  const [tab, setTab] = useState("web");
  return (
    <div>
      <div className="flex flex-col h-full gap-12 justify-start items-center mt-24">
        <h1 className="text-3xl font-bold">
          {tab === "web"
            ? "Scrape documentation from web page"
            : tab === "file"
              ? "Upload your documentation"
              : "Enter your documentation"}
        </h1>
        <Tabs
          className="w-full mx-auto"
          defaultValue="web"
          onValueChange={(tab) => setTab(tab)}
        >
          <TabsList className="bg-background mb-3 mx-auto h-auto -space-x-px p-0 shadow-xs rtl:space-x-reverse">
            <TabsTrigger
              value="web"
              className="data-[state=active]:bg-muted data-[state=active]:after:bg-primary relative overflow-hidden rounded-md border py-3 px-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e text-lg"
            >
              <RiGlobalLine
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
                aria-hidden="true"
              />
              Web
            </TabsTrigger>
            <TabsTrigger
              value="file"
              className="data-[state=active]:bg-muted data-[state=active]:after:bg-primary relative overflow-hidden rounded-md border py-3 px-4 text-lg after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e"
            >
              <RiFile2Line
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
                aria-hidden="true"
              />
              File
            </TabsTrigger>
          </TabsList>
          <TabsContent value="web">
            <WebSection />
          </TabsContent>
          <TabsContent value="file">
            <FileUpload />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NewDocumentationPage;
