import LinkButton from "@/components/ui/link-button";
import { RiAddLargeLine } from "@remixicon/react";
import React from "react";
import AllDocumentationList from "./_components/page";

const DocumentationPage = () => {
  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold my-6">Saved Documentation</h1>
        <LinkButton href={"/documentations/new"}>
          <RiAddLargeLine />
          Add new documentation
        </LinkButton>
      </div>
      <AllDocumentationList />
    </div>
  );
};

export default DocumentationPage;
