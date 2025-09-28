import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { useRouter } from "next/navigation";
import React, { useRef } from "react";

const WebSection = () => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, setIsPending] = React.useState(false);
  const startScrape = useAction(api.v1.firecrawl.scrapeSiteInfo);

  const handleStartScrape = () => {
    if (!inputRef.current || inputRef.current.value === "") return;
    setIsPending(true);
    startScrape({ url: inputRef.current.value }).then((documentationId) => {
      router.push("/documentations/" + documentationId);
    });
  };

  return (
    <div className="flex flex-col gap-8 items-center mt-8">
      <div className="w-[90%] max-w-2xl relative">
        <div className="absolute left-4 top-3 border-r-2 pr-3 ">
          <span className="text-muted-foreground">https://</span>
        </div>
        <Input
          className="w-full mx-auto p-4 bg-input/75 rounded-md shadow-2xl text-base h-12 pl-24"
          placeholder="Input your link ..."
          ref={inputRef}
        ></Input>
      </div>

      <Button onClick={handleStartScrape} disabled={isPending}>
        {isPending ? "Scraping page ..." : "Scrape documentation"}
      </Button>
    </div>
  );
};

export default WebSection;
