import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-16 md:py-32" id="cta">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
            Stop Digging Through Docs <br /> Start Scouting!
          </h2>
          <p className="mt-4">
            Turn manuals, guides, and references into quick answers with
            Docscout AI.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/">
                <span>Start Scouting</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
