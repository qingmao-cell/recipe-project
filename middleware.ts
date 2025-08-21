import createMiddleware from 'next-intl/middleware';
import { locales } from './src/i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['zh'], // 暂时只启用中文

  // Used when no locale matches
  defaultLocale: 'zh',

  // The prefix for the locale in the URL
  localePrefix: 'always'
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    '/',
    '/(zh|ja)/:path*',
    '/((?!_next|_vercel|api|.*\\..*).*)'
  ]
};