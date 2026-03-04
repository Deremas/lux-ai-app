import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <section className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="absolute -top-10 left-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-10 right-8 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-md sm:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                  Error 404
                </p>
                <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
                  This page is missing.
                </h1>
                <p className="text-base text-muted-foreground sm:text-lg">
                  The link might be outdated or the page has moved. Use the
                  shortcuts below to get back on track.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild>
                    <Link href="/">Go to home</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/scheduling">Open scheduling</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/contact">Contact support</Link>
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-muted/50 p-6 text-center">
                <div className="text-6xl font-semibold text-primary">404</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Page not found
                </div>
                <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                  <div>Try checking the URL for typos.</div>
                  <div>Use the sidebar or search the site.</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
