import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

export default function PricingSection() {
  return (
    <section className="py-16 md:py-28" id="pricing">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">
            Flexible Plans for Every Developer
          </h1>
          <p>
            Choose the plan that fits your workflow — no hidden fees, just
            powerful AI for your docs.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-5 md:gap-0">
          <div className="rounded-(--radius) flex flex-col justify-between space-y-8 border p-6 md:col-span-2 md:my-2 md:rounded-r-none md:border-r-0 lg:p-10">
            <div className="space-y-4">
              <div>
                <h2 className="font-medium">Free</h2>
                <span className="my-3 block text-2xl font-semibold">
                  $0 / month
                </span>
                <p className="text-muted-foreground text-sm">Per developer</p>
              </div>

              <Button asChild variant="outline" className="w-full">
                <Link href="/sign-in">Get Started</Link>
              </Button>

              <ul className="list-outside space-y-3 text-sm mt-4">
                {[
                  "Limited chat per daily",
                  `50 free scans`,
                  "Include 2 context",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="size-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="dark:bg-muted rounded-(--radius) border p-6 shadow-lg shadow-gray-950/5 md:col-span-3 lg:p-10 dark:[--color-muted:var(--color-zinc-900)]">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h2 className="font-medium">Pro</h2>
                  <span className="my-3 block text-2xl font-semibold">
                    $15 / month
                  </span>
                  <p className="text-muted-foreground text-sm">Per developer</p>
                </div>

                <Button asChild className="w-full">
                  <Link href="/sign-in">Get Started</Link>
                </Button>
              </div>

              <div className="mt-0">
                <div className="text-sm font-medium">
                  Better perks for pro :
                </div>

                <ul className="mt-4 list-outside space-y-3 text-sm">
                  {[
                    "Unlimited chat",
                    "500 usage scans",
                    "Include up to 10 context",
                    "Scans all pages at once",
                    "Better AI Models",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="size-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
