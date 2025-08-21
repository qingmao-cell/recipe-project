import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { ChakraProvider } from "@/components/providers/ChakraProvider";
// import LocaleSwitcher from '@/components/LocaleSwitcher'; // 暂时隐藏语言切换
import type { Metadata } from 'next';
import Script from 'next/script';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Common' });

  return {
    title: t('appTitle'),
    description: t('appDescription'),
  };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale });

  return (
    <>
      <Script id="set-html-lang" strategy="beforeInteractive">
        {`document.documentElement.lang = "${locale}"`}
      </Script>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ChakraProvider>
          <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
            {/* Global Language Switcher - 暂时隐藏 */}
            {/* <div className="fixed top-6 left-6 z-50">
              <LocaleSwitcher />
            </div> */}
            {children}
          </div>
        </ChakraProvider>
      </NextIntlClientProvider>
    </>
  );
}