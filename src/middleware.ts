import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['zh', 'ja'],

  // Used when no locale matches
  defaultLocale: 'zh',

  // The prefix for the locale in the URL
  localePrefix: 'always'
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // However, match all pathnames within `/api`, except for health
    '/api/((?!health).*)'
  ]
};