import type { Locale } from "@/i18n-config";
import type { ReactNode } from "react";
import { EmployerContextProvider } from "./EmployerContext";

export default async function EmployerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return <EmployerContextProvider locale={lang as Locale}>{children}</EmployerContextProvider>;
}
