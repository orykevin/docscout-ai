import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import FeaturesSection from "./_components/features-section";
import PricingSection from "./_components/pricing-section";
import CTASection from "./_components/cta-section";
import FooterSection from "./_components/footer";
import { Header } from "./_components/header-section";

export default function HeroSection() {
  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <section>
          <div className="relative pt-24">
            <div className="mx-auto max-w-7xl px-6">
              <div className="max-w-3xl text-center sm:mx-auto lg:mr-auto lg:mt-0 lg:w-4/5">
                <h1 className="mt-8 text-balance text-4xl font-semibold md:text-5xl xl:text-6xl xl:[line-height:1.125]">
                  AI That Reads Your Docs for You
                </h1>
                <p className="mx-auto mt-8 hidden max-w-2xl text-wrap text-lg sm:block">
                  Docscout AI scans through manuals, guides, docs and instantly
                  turn it into context-aware AI chat.
                </p>

                <div className="mt-8">
                  <Button size="lg" asChild>
                    <Link href="/sign-in">
                      <span className="text-nowrap">Scout Docs Now</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="mask-b-from-55% relative mx-auto mt-16 max-w-6xl overflow-hidden px-4">
              <Image
                className="z-2 border-border/25 relative hidden rounded-lg border dark:block"
                src="/dark-preview.png"
                alt="app screen"
                width={2796}
                height={2008}
              />
              <Image
                className="z-2 border-border/25 relative rounded-2xl border dark:hidden"
                src="/preview.png"
                alt="app screen"
                width={2796}
                height={2008}
              />
            </div>
          </div>
        </section>
        <FeaturesSection />
        <PricingSection />
        <CTASection />
      </main>
      <FooterSection />
    </>
  );
}
