"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  body?: string;
  align?: "left" | "center";
  titleAs?: "h1" | "h2" | "h3";
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
};

export function SectionHeading({
  title,
  body,
  align = "left",
  titleAs = "h2",
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
            "max-w-[44rem] text-pretty text-base font-medium leading-8 text-slate-600/90 dark:text-slate-300/85 sm:text-lg",
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

type CtaLinksProps = {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  centered?: boolean;
  className?: string;
};

export function CtaLinks({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  centered = false,
  className,
}: CtaLinksProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap",
        centered ? "justify-center" : "",
        className,
      )}
    >
      <Link href={primaryHref} className="lux-button-primary">
        {primaryLabel}
      </Link>
      {secondaryHref && secondaryLabel ? (
        <Link href={secondaryHref} className="lux-button-secondary">
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
          ? "border-slate-200/80 bg-slate-50/85 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-900/70"
          : "border-slate-200/80 bg-white shadow-[0_24px_55px_-40px_rgba(15,23,42,0.24)] dark:border-slate-800 dark:bg-slate-950",
        className,
      )}
    >
      {children}
    </div>
  );
}
