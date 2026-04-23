import { Providers } from "./providers";
import "./globals.css";
import type { Metadata } from "next";
import { i18n, Locale } from "@/i18n-config";
import Script from "next/script";
import { RELAYER_SDK_CDN_SRC } from "@/lib/fheConfig";

export const metadata: Metadata = {
  title: "PayChainMe - Privacy-Preserving Onchain Payroll",
  description: "End-to-end encrypted payroll management using Fully Homomorphic Encryption",
};

export function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.cdnfonts.com/css/telegraf"
        />
        <link rel="icon" href="/payroll-logo.jpg" sizes="any" />
        <Script
          src={RELAYER_SDK_CDN_SRC}
          strategy="beforeInteractive"
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
