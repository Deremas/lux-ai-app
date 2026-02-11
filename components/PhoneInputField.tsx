"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlagImage,
  defaultCountries,
  parseCountry,
  usePhoneInput,
} from "react-international-phone";
import type { CountryIso2, ParsedCountry } from "react-international-phone";

import { cn } from "@/lib/utils";

type PhoneFieldProps = {
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: CountryIso2;
  required?: boolean;
  name?: string;
  placeholder?: string;
  invalid?: boolean;
  containerClassName?: string;
  inputContainerClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
};

export default function SearchablePhoneInput({
  value,
  onChange,
  defaultCountry = "lu",
  required,
  name,
  placeholder,
  invalid,
  containerClassName,
  inputContainerClassName,
  inputClassName,
  buttonClassName,
}: PhoneFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const countries = useMemo<ParsedCountry[]>(
    () => defaultCountries.map((country) => parseCountry(country)),
    []
  );

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;

    const digits = q.replace(/\D/g, "");
    return countries.filter((country) => {
      if (country.name.toLowerCase().includes(q)) return true;
      if (country.iso2.toLowerCase().includes(q)) return true;
      if (digits && country.dialCode.startsWith(digits)) return true;
      return false;
    });
  }, [countries, query]);

  const { country, inputValue, inputRef, handlePhoneValueChange, setCountry } =
    usePhoneInput({
      defaultCountry,
      value,
      countries: defaultCountries,
      disableDialCodePrefill: true,
      disableDialCodeAndPrefix: true,
      onChange: ({ phone }) => onChange(phone),
    });

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const currentDialCode = country?.dialCode ? `+${country.dialCode}` : "+";

  return (
    <div ref={containerRef} className={cn("relative w-full", containerClassName)}>
      <div
        className={cn(
          "flex h-9 items-center rounded-md border border-input bg-transparent px-2 shadow-sm focus-within:ring-1 focus-within:ring-ring",
          inputContainerClassName
        )}
      >
        <button
          type="button"
          onClick={() => {
            setOpen((prev) => !prev);
            setQuery("");
          }}
          className={cn(
            "flex items-center gap-2 border-0 bg-transparent pr-2 text-sm text-gray-700 outline-none focus-visible:outline-none dark:text-gray-200",
            buttonClassName
          )}
          aria-label="Select country"
        >
          <FlagImage iso2={country?.iso2} size={16} />
          <span className="text-xs font-semibold">{currentDialCode}</span>
          <span className="text-xs">▾</span>
        </button>
        <div className="h-5 w-px bg-gray-200 dark:bg-slate-700" />
        <input
          ref={inputRef}
          type="tel"
          value={inputValue}
          onChange={handlePhoneValueChange}
          name={name}
          required={required}
          placeholder={placeholder}
          aria-invalid={invalid}
          className={cn(
            "flex h-full w-full border-0 bg-transparent px-3 py-1 text-base outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 md:text-sm",
            inputClassName
          )}
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="p-2">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country or code"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <ul className="max-h-64 overflow-auto py-1">
            {filteredCountries.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No matching countries.
              </li>
            )}
            {filteredCountries.map((item) => (
              <li key={item.iso2}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
                  onClick={() => {
                    setCountry(item.iso2, { focusOnInput: true });
                    setOpen(false);
                  }}
                >
                  <FlagImage iso2={item.iso2} size={16} />
                  <span className="flex-1">{item.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{item.dialCode}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
