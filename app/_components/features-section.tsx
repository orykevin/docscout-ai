import { Card, CardContent } from "@/components/ui/card";
import { RiChat4Line } from "@remixicon/react";
import { Files, Globe } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section
      className="bg-gray-50 py-16 md:py-32 dark:bg-transparent"
      id="features"
    >
      <div className="mx-auto max-w-5xl px-6 ">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">
            What Docscout can do
          </h1>
        </div>
        <div className="relative mt-8 grid gap-6 md:mt-20 ">
          <div className="relative z-10 grid grid-cols-6 gap-3">
            <Card className="card variant-outlined relative col-span-full overflow-hidden lg:col-span-3">
              <CardContent className="grid sm:grid-cols-1">
                <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="relative flex aspect-square size-12 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border dark:border-white/10 dark:before:border-white/5">
                      <Globe className="m-auto size-5" strokeWidth={1} />
                    </div>
                    <h2 className="group-hover:text-secondary-950 text-lg font-medium text-zinc-800 transition dark:text-white">
                      Scrape Documentation Website
                    </h2>
                  </div>

                  <div className="space-y-2">
                    <p className="text-foreground">
                      Easily pull content from any public docs site and turn it
                      into structured knowledge for AI.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card variant-outlined relative col-span-full overflow-hidden lg:col-span-3">
              <CardContent className="grid h-full sm:grid-cols-1">
                <div className="relative z-10 flex flex-col space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex aspect-square size-12 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border dark:border-white/10 dark:before:border-white/5">
                      <Files className="m-auto size-5" strokeWidth={1} />
                    </div>
                    <h2 className="group-hover:text-secondary-950 text-lg font-medium text-zinc-800 transition dark:text-white">
                      Upload Documentation Files
                    </h2>
                  </div>
                  <div className="space-y-2">
                    <p className="text-foreground">
                      Drop in PDFs, Markdown files, or text docs and let
                      Docscout AI scans them instantly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card variant-outlined relative col-span-full overflow-hidden lg:col-span-6">
              <CardContent className="grid h-full sm:grid-cols-1">
                <div className="relative z-10 flex flex-col space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex aspect-square size-12 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border dark:border-white/10 dark:before:border-white/5">
                      <RiChat4Line className="m-auto size-5" strokeWidth={1} />
                    </div>
                    <h2 className="group-hover:text-secondary-950 text-lg font-medium text-zinc-800 transition dark:text-white">
                      Ask about your docs
                    </h2>
                  </div>
                  <div className="space-y-2">
                    <p className="text-foreground">
                      Chat with your documentation as if it were a teammate. Ask
                      detailed questions, cross-reference multiple sources, and
                      get clear answers powered by your own files and scraped
                      docs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
