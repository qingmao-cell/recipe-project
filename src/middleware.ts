import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['zh', 'ja'],

  // Used when no locale matches
  defaultLocale: 'zh',
  
  // Disable automatic locale detection
  localeDetection: false
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};