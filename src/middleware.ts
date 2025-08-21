import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['zh', 'ja'],

  // Used when no locale matches
  defaultLocale: 'zh',

  // The prefix for the locale in the URL
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    '/',
    '/(zh|ja)/:path*'
  ]
};