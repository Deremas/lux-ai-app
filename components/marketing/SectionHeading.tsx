"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const MARKETING_BRAND = "Lux AI Consultancy & Automation";

type SectionHeadingProps = {
  title: string;
  body?: string;
  align?: "left" | "center";
  titleAs?: "h1" | "h2" | "h3";
  eyebrow?: string;
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
};

export function SectionHeading({
  title,
  body,
  align = "left",
  titleAs = "h2",
  eyebrow,
  className,
  titleClassName,
  bodyClassName,
}: SectionHeadingProps) {
  const TitleTag = titleAs;

  return (
    <div
      className={cn(
        "space-y-4",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "font-mono text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-300",
            align === "center" ? "mx-auto" : "",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <TitleTag
        className={cn(
          "text-balance text-[2.25rem] font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 dark:text-white sm:text-[2.7rem] lg:text-[3.2rem]",
          titleClassName,
        )}
      >
        {title}
      </TitleTag>
      {body ? (
        <p
          className={cn(
            "max-w-[44rem] text-pretty text-base font-medium leading-8 text-slate-700 dark:text-slate-200 sm:text-lg",
            align === "center" ? "mx-auto" : "",
            bodyClassName,
          )}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}

type MarketingHeroProps = {
  children: ReactNode;
  className?: string;
};

export function MarketingHero({ children, className }: MarketingHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,66,126,0.08),transparent_42%)] dark:bg-[radial-gradient(circle_at_top,rgba(14,66,126,0.18),transparent_46%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        {children}
      </div>
    </section>
  );
}

type CtaLinksProps = {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  centered?: boolean;
  quietSecondary?: boolean;
  className?: string;
};

export function CtaLinks({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  centered = false,
  quietSecondary = false,
  className,
}: CtaLinksProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
        centered ? "justify-center" : "",
        className,
      )}
    >
      <Link
        href={primaryHref}
        className="lux-button-primary box-border w-full max-w-full min-w-0 sm:w-auto"
      >
        {primaryLabel}
      </Link>
      {secondaryHref && secondaryLabel ? (
        <Link
          href={secondaryHref}
          className={cn(
            "box-border w-full max-w-full min-w-0 sm:w-auto",
            quietSecondary
              ? "inline-flex items-center justify-center px-2 py-3 text-sm font-semibold text-slate-700 underline-offset-4 transition hover:text-slate-950 hover:underline dark:text-slate-200 dark:hover:text-white"
              : "lux-button-secondary",
          )}
        >
          {secondaryLabel}
        </Link>
      ) : null}
    </div>
  );
}

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
  subtle?: boolean;
};

export function SurfaceCard({
  children,
  className,
  subtle = false,
}: SurfaceCardProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-[1.6rem] border p-6 sm:p-7",
        subtle
          ? "border-slate-300/90 bg-slate-50 text-slate-950 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
          : "border-slate-300/90 bg-white text-slate-950 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.24)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50",
        className,
      )}
    >
      {children}
    </div>
  );
}
