"use client";

import { motion } from "framer-motion";

import { useLanguage } from "@/components/LanguageProvider";
import type { TeamMember } from "@/lib/marketing-content";

const connectLabels = {
  en: "Connect",
  fr: "Se connecter",
  de: "Verbinden",
  lb: "Verbannen",
} as const;

type TeamMemberCardProps = {
  member: TeamMember;
};

const socialItems = [
  { key: "linkedin", label: "LinkedIn", icon: "ri-linkedin-fill" },
  { key: "facebook", label: "Facebook", icon: "ri-facebook-fill" },
  { key: "twitter", label: "X", icon: "ri-twitter-x-fill" },
  { key: "telegram", label: "Telegram", icon: "ri-telegram-fill" },
  { key: "whatsapp", label: "WhatsApp", icon: "ri-whatsapp-line" },
  { key: "email", label: "Email", icon: "ri-mail-line" },
] as const;

const isActiveHref = (href: string) => href.trim() !== "" && href !== "#";

export default function TeamMemberCard({ member }: TeamMemberCardProps) {
  const { lang } = useLanguage();
  const connectLabel = connectLabels[lang] ?? connectLabels.en;

  return (
    <motion.div
      className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900"
      whileHover={{ y: -6 }}
    >
      <div className="flex items-center gap-4">
        <img
          src={member.image}
          alt={member.name}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div>
          <h3 className="text-lg font-bold">{member.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {member.role}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
        {member.bio}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {member.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {connectLabel}
        </p>

        <div className="mt-3 flex flex-wrap gap-3">
          {socialItems.map((item) => {
            const href = member[item.key];
            const isActive = isActiveHref(href);
            const baseClassName =
              "inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition-all duration-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300";

            if (!isActive) {
              return (
                <span
                  key={item.key}
                  aria-label={`${item.label} unavailable`}
                  title={`${item.label} unavailable`}
                  className={`${baseClassName} cursor-not-allowed opacity-40`}
                >
                  <i className={`${item.icon} text-lg`} />
                </span>
              );
            }

            const isEmail = href.startsWith("mailto:");

            return (
              <a
                key={item.key}
                href={href}
                aria-label={`${member.name} on ${item.label}`}
                target={isEmail ? undefined : "_blank"}
                rel={isEmail ? undefined : "noreferrer"}
                className={`${baseClassName} hover:-translate-y-0.5 hover:border-primary-500/30 hover:text-primary-600 dark:hover:border-accent-400/40 dark:hover:text-accent-400`}
              >
                <i className={`${item.icon} text-lg`} />
              </a>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
