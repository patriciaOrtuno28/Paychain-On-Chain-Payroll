"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { i18n, type Locale } from "@/i18n-config";

const languageNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
};

export function LanguageSwitcher() {
  const pathname = usePathname();
  
  const currentLang = pathname.split("/")[1] as Locale;
  const isValidLang = i18n.locales.includes(currentLang);
  const lang = isValidLang ? currentLang : i18n.defaultLocale;

  const getLocalePath = (locale: Locale) => {
    const segments = pathname.split("/");
    segments[1] = locale;
    return segments.join("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 border border-white/20 hover:bg-white/10">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {i18n.locales.map((locale) => (
          <DropdownMenuItem key={locale} className={locale === lang ? "bg-muted" : ""}>
            <Link
              href={getLocalePath(locale)}
              className="w-full h-full flex items-center px-2 py-1.5"
              prefetch={true}
              scroll={false}
            >
              {languageNames[locale]}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
