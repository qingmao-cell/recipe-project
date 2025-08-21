'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

const locales = [
  { code: 'zh', name: 'CN' },
  { code: 'ja', name: 'JP' }
];

export default function LocaleSwitcher() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isChanging, setIsChanging] = useState(false);

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return;

    setIsChanging(true);
    startTransition(() => {
      // Replace the current locale in the pathname
      const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
      router.replace(newPathname);
    });
  };

  return (
    <div className="flex bg-white/80 backdrop-blur-sm rounded-lg p-1">
      {locales.map((loc) => (
        <button
          key={loc.code}
          onClick={() => switchLocale(loc.code)}
          disabled={isPending || isChanging}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            locale === loc.code
              ? "bg-orange-500 text-white"
              : "text-gray-600 hover:text-gray-800"
          } ${(isPending || isChanging) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loc.name}
        </button>
      ))}
    </div>
  );
}