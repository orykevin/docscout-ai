"use client";

import React from "react";
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
import { check } from "better-auth";

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

const ChatUI = () => {
  const [selectedDoc, setSelectedDoc] = React.useState<string[]>([]);
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
