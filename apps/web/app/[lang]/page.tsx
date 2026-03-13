import { HomePageContent } from "@/components/HomePageContent";
import type { Locale } from "@/i18n-config";

interface HomePageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;
  
  return <HomePageContent locale={lang} />;
}
