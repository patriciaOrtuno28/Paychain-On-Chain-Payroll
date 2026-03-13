"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Locale } from "@/i18n-config";

export default function EmployerPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.lang as Locale) || "en";

  useEffect(() => {
    router.replace(`/${locale}/employer/dashboard`);
  }, [locale, router]);

  return null;
}
