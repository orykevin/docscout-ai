import DialogBase from "@/components/dialog-base";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import ToolTipButton from "@/components/ui/tooltip-button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { Link, Link as LinkType } from "@/convex/v1/firecrawl";
import { useDebounce } from "@/hooks/use-debounce";
import { useConvexMutation } from "@/lib/convex-functions";
import { DialogTrigger } from "@radix-ui/react-dialog";
import {
  RiCheckboxCircleFill,
  RiCloseCircleLine,
  RiErrorWarningLine,
  RiFilter2Line,
  RiHourglassLine,
  RiMore2Line,
  RiSearchLine,
} from "@remixicon/react";
import { CheckoutDialog, useCustomer } from "autumn-js/react";
import { useAction, useQuery } from "convex/react";
import React, { useEffect, useMemo } from "react";
import { toast } from "sonner";

export const WebDocumentationDetail = ({
  documentationId,
  activePage,
  totalPage,
}: {
  documentationId: Id<"documentation">;
  activePage: number;
  totalPage: number;
}) => {
  const customer = useCustomer();
  const [search, setSearch] = React.useState("");
  const [searchApplied, setSearchApplied] = React.useState<null | Link[]>(null);
  const debounceText = useDebounce(search, 250);
  const [selectedLink, setSelectedLink] = React.useState<null | string>(null);
  const [openDialog, setOpenDialog] = React.useState(false);

  const data = useQuery(api.v1.documentation.getWebInfoData, {
    documentationId,
  });
  const allPages = useQuery(api.v1.documentation.getAllPageDocumentation, {
    documentationId,
  });
  const { mutate: startScrape, isPending } = useConvexMutation(
    api.v1.documentation.startScrapeWebData,
  );
  const { mutate: deleteLink, isPending: isDeleting } = useConvexMutation(
    api.v1.documentation.deleteLinkPage,
  );
  const scanAll = useAction(api.v1.documentation.scanAllPage);
  const decrement = useAction(api.v1.documentation.decrementUsage);
  const handleStartScrape = async (url: string, title: string) => {
    if (!customer) return;
    const scansFeature = customer.customer?.features?.scans;
    if (!scansFeature || (scansFeature.balance || 0) <= 0) {
      toast.error("Insufficient balance to scan");
      return;
    }
    try {
      await startScrape({ documentationId, pageUrl: url, titleUrl: title });
      await decrement({ value: 1 });
      toast.success("Scraping started successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to start scraping");
    }
  };

  const handleDeleteLink = () => {
    if (isPending || !selectedLink || isDeleting) return;
    deleteLink({ documentationId, url: selectedLink })
      .then(() => {
        setSelectedLink(null);
        toast.success("Link deleted successfully");
      })
      .catch((e) => {
        console.error(e);
        toast.error("Failed to delete link");
      });
  };

  const handleScanAll = () => {
    if (!customer) return;
    if (!customer.customer?.features.documentation_limit) {
      customer.checkout({
        productId: "pro",
        dialog: CheckoutDialog,
      });
      return;
    }
    if (
      (customer.customer?.features.scans.balance || 0) <=
      totalPage - activePage
    ) {
      toast.error("Insufficient balance to scan");
      return;
    }

    scanAll({ documentationId })
      .then(() => {
        setOpenDialog(false);
        toast.success("All pages started to be scanned");
      })
      .catch((e) => {
        console.error(e);
        toast.error("Failed to scan all pages");
      });
  };

  console.log(customer);

  const links: LinkType[] = useMemo(() => {
    return data?.webLinks.links
      ? JSON.parse(data?.webLinks.links).map((link: LinkType) => {
          const title = link.title || link.url.split("/").pop() || "";
          return {
            ...link,
            title,
          };
        })
      : [];
  }, [data]);

  useEffect(() => {
    if (debounceText && data?.webLinks.links) {
      const filteredLinks = links.filter((link) => {
        const excludeBaseUrl = link.url.split("/").slice(2).join("/");
        return (
          link.title.toLowerCase().includes(debounceText.toLowerCase()) ||
          excludeBaseUrl.toLowerCase().includes(debounceText.toLowerCase())
        );
      });
      setSearchApplied(filteredLinks);
    } else {
      setSearchApplied(null);
    }
  }, [debounceText, links]);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="pb-6">
      <div className="mt-4 mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm ">Draft</p>
          <p className="font-semibold">
            {activePage || 0} / {totalPage || 0} Scanned
          </p>
        </div>
        {customer.customer?.features.documentation_limit ? (
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="mt-4 mb-4" size="sm">
                Scan all pages
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="font-semibold">
                Scan all pages
              </DialogHeader>
              <div>
                {(customer.customer?.features?.scans?.balance || 0) >=
                totalPage - activePage ? (
                  <p>
                    Are you sure you want to scan all pages? <br /> This will
                    cost {totalPage - activePage} scans usage
                  </p>
                ) : (
                  <p>Insufficient balance to scan all pages</p>
                )}
                <div className="flex gap-3 mt-4">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => setOpenDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleScanAll}>
                    Confirm
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            className="mt-4 mb-4"
            size="sm"
            onClick={() => {
              customer.checkout({
                productId: "pro",
                dialog: CheckoutDialog,
              });
            }}
          >
            Upgrade to Pro to process all pages
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3  mb-4">
        <div className="w-ful relative w-full">
          <RiSearchLine
            size={18}
            className="absolute top-3 left-3 text-muted-foreground"
          />
          <Input
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search page"
            className="pl-10 h-10 text-base"
          />
        </div>
        <div className="min-w-max">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolTipButton tooltip="Filter" variant={"outline"}>
                <RiFilter2Line />
              </ToolTipButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter</DropdownMenuLabel>
              <DropdownMenuItem>Scanned</DropdownMenuItem>
              <DropdownMenuItem>Unscanned</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="space-y-2">
        {(searchApplied || links).map((link) => {
          const scannedData = allPages?.find((page) => page.url === link.url);
          return (
            <div className="bg-card p-3 rounded-md flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  {scannedData?.status === "completed" ? (
                    <RiCheckboxCircleFill size={14} />
                  ) : scannedData?.status === "starting" ? (
                    <RiHourglassLine className="animate-spin" size={14} />
                  ) : scannedData?.status === "failed" ? (
                    <RiErrorWarningLine size={16} className="text-red-500" />
                  ) : (
                    <RiCloseCircleLine
                      className="text-muted-foreground"
                      size={14}
                    />
                  )}

                  <p className="font-semibold truncate w-[calc(100% - 2rem)]">
                    {link.title}
                  </p>
                </div>
                <a
                  className="text-sm text-muted-foreground"
                  target="_blank"
                  href={link.url}
                >
                  {link.url}
                </a>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <RiMore2Line />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    {scannedData ? "Page scanned" : "Page not scanned"}
                  </DropdownMenuLabel>
                  {(!scannedData || scannedData.status === "failed") && (
                    <DropdownMenuItem
                      onClick={() => handleStartScrape(link.url, link.title)}
                    >
                      Scan
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    disabled={scannedData?.status === "starting"}
                    onClick={() => setSelectedLink(link.url)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
      <DialogBase
        header="Delete Page"
        open={selectedLink !== null}
        openChangeAction={(open) => !open && setSelectedLink(null)}
      >
        <div>
          <p>Are you sure you want to delete this page?</p>
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSelectedLink(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDeleteLink}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </DialogBase>
    </div>
  );
};
