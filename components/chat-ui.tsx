"use client";

import React, { useEffect } from "react";
import { Textarea } from "./ui/textarea";
import ToolTipButton from "./ui/tooltip-button";
import { Plus } from "lucide-react";
import {
  RiArrowUpLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiCloseLine,
  RiGitRepositoryCommitsFill,
  RiGitRepositoryCommitsLine,
  RiVoiceprintLine,
} from "@remixicon/react";

import {
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

const documentations = [
  {
    id: "1",
    name: "ThreeJS",
    url: "https://threejs.org/",
  },
  {
    id: "2",
    name: "React Three Fiber",
    url: "https://github.com/pmndrs/react-three-fiber",
  },
  {
    id: "3",
    name: "three-vrm",
    url: "https://github.com/pixiv/three-vrm",
  },
  {
    id: "4",
    name: "three-vrm 2",
    url: "https://github.com/pixiv/three-vrm",
  },
  {
    id: "5",
    name: "three-vrm 3",
    url: "https://github.com/pixiv/three-vrm",
  },
];

const text =
  '```json\n{\n  "sections": [\n    {\n      "header": "Showing UI based on authentication state",\n      "content": "You can control which UI is shown when the user is signed in or signed out using Convex\'s `<Authenticated>`, `<Unauthenticated>` and `<AuthLoading>` helper components. These components are powered by Convex\'s `useConvexAuth()` hook, which provides `isAuthenticated` and `isLoading` flags. This hook can be used directly if preferred.\\n\\nIt\'s important to use Convex\'s authentication state components or the `useConvexAuth()` hook instead of Better Auth\'s `getSession()` or `useSession()` when you need to check whether the user is logged in or not. Better Auth will reflect an authenticated user before Convex does, as the Convex client must subsequently validate the token provided by Better Auth. Convex functions that require authentication can throw if called before Convex has validated the token.\\n\\nIn the following example, the `<Content />` component is a child of `<Authenticated>`, so its content and any of its child components are guaranteed to have an authenticated user, and Convex queries can require authentication."\n    },\n    {\n      "header": "Authentication state in Convex functions",\n      "content": "If the client is authenticated, you can access the information stored in the JWT via `ctx.auth.getUserIdentity`. If the client is **not** authenticated, `ctx.auth.getUserIdentity` will return null.\\n\\nMake sure that the component calling this query is a child of `<Authenticated>` from `convex/react`, or that `isAuthenticated` from `useConvexAuth()` is `true`. Otherwise, it will throw on page load."\n    }\n  ],\n  "important_content": [\n    {\n      "section_title": "Showing UI based on authentication state",\n      "details": "<main>\\n  <Unauthenticated>Logged out</Unauthenticated>\\n  <Authenticated>Logged in</Authenticated>\\n  <AuthLoading>Loading...</AuthLoading>\\n</main>"\n    },\n    {\n      "section_title": "Authentication state in Convex functions",\n      "details": "<convex/messages.ts>\\nexport const getCurrentUser = query({\\nargs: {},\\nhandler: async (ctx) => {\\nreturn await authComponent.getAuthUser(ctx);\\n},\\n});\\nexport const getForCurrentUser = query({\\nargs: {},\\nhandler: async (ctx) => {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void {\\ncallable function:\\ndefineQuery(): void{\\ncallable function:\\ndefineQuery():void{\\ncallable function:\\ndefineQuery():void{\\ncallable function:\\ndefineQuery():void{\\ncallable function:\\ndefineQuery():void{\\ncallable function:\\ndefineQuery():void{\\ncallback callback:function(){}\\nsimpleCallback callback:function(){}\\ngenericCallback genericCallback:function(){}\\ngenericSimpleCallback genericSimpleCallback:function(){}\\ngenericGenericCallback genericGenericCallback:function(){}\\ngenericGenericSimpleCallback genericGenericSimpleCallback:function(){}\\ngenericGenericGenericCallback genericGenericGenericCallback:function(){}\\ngenericGenericSimpleGenericCallback genericGenericSimpleGenericCallback:function(){}\\ngenericCustomType customType:{}}\\ntype CustomType = {}}\\ntype CustomType = {}}\\ntype CustomType = {}}\\ntype CustomType = {}}\\ntype CustomType = {}}\\ntype CustomType = {}}\\ntype CustomType = {}}\\ntype CustomType = {}}"\n    }\n  ]\n}\n```\n';

function extractJson(raw: string) {
  // 1. Remove markdown fences like ```json ... ```
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    // 2. Parse into JSON
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (err) {
    console.error("❌ Failed to parse JSON:", err);
    console.log("Cleaned string:", cleaned.slice(0, 300)); // log preview
    return null;
  }
}

const ChatUI = () => {
  const [selectedDoc, setSelectedDoc] = React.useState<string[]>([]);

  useEffect(() => {
    // fetch("/test-final-3.md").then((res) => {
    //   res.text().then((text) => {
    //     console.log(text);
    //     console.log(markdownToJson(text));
    //   });
    // });
    // fetch("/test-final-2.md").then((res) => {
    //   res.text().then((text) => {
    //     console.log(text);
    //     console.log(markdownToJson(text));
    //   });
    // });
    fetch("/test-react-form-1.md").then((res) => {
      const jsonData = extractJson(text);
      console.log(jsonData);
    });
  }, []);
  return (
    <div className="relative w-full max-w-2xl mx-auto group p-4 bg-input/75 rounded-md shadow-2xl">
      <Textarea
        className="peer !h-max max-h-[50vh] text-base field-sizing-content resize-none bg-transparent !ring-0 !border-0 p-0"
        placeholder="Ask a question..."
      ></Textarea>
      <div className="flex items-end justify-between w-full pt-2">
        <div className="flex gap-2 items-end">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <ToolTipButton size="iconSm" tooltip="Add Documentation">
                <RiGitRepositoryCommitsLine />
              </ToolTipButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {documentations.map((doc) => {
                const checked = selectedDoc.includes(doc.id);
                return (
                  <DropdownMenuItem
                    key={doc.id}
                    onSelect={(e) => e.preventDefault()}
                    onClick={() => setSelectedDoc((prev) => [...prev, doc.id])}
                    disabled={checked}
                  >
                    {checked && <RiCheckLine />}
                    <span>{doc.name}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <ToolTipButton
            className="w-8 h-8 min-w-8 min-h-8"
            size="icon"
            tooltip="More"
            variant="outline"
          >
            {<Plus />}
          </ToolTipButton>
          <div className="flex flex-wrap gap-1 max-w-full">
            {selectedDoc.map((doc) => {
              const docData = documentations.find((d) => d.id === doc);
              if (!docData) return null;
              return (
                <div className="h-8 w-max p-2 flex items-center gap-2 bg-input rounded-md">
                  <RiCloseLine
                    onClick={() =>
                      setSelectedDoc((prev) => prev.filter((id) => id !== doc))
                    }
                    className="hover:text-destructive cursor-pointer"
                  />
                  {docData.name}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <ToolTipButton
            className=" w-8 h-8"
            size="icon"
            tooltip="Voice"
            variant="ghost"
          >
            {<RiVoiceprintLine />}
          </ToolTipButton>
          <ToolTipButton
            className=" w-8 h-8 group-has-[textarea:placeholder-shown]:disabled"
            size="icon"
            tooltip="Send"
          >
            {<RiArrowUpLine />}
          </ToolTipButton>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
