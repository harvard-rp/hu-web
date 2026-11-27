const callbackPath = '/auth/callback';
const codePattern = /^[A-Za-z0-9._~-]{1,512}$/;

export type OAuthCallback =
  { kind: 'none' | 'cancelled' | 'invalid' } | { kind: 'code'; code: string };

const none: OAuthCallback = { kind: 'none' };
const invalid: OAuthCallback = { kind: 'invalid' };
const cancelled: OAuthCallback = { kind: 'cancelled' };

export function oauthRedirectUrl(
  origin: string,
  base: string,
  hashRouting: boolean,
) {
  return new URL(
    hashRouting ? base : callbackPath.slice(1),
    new URL(base, origin),
  ).href;
}

function isCancelled(params: URLSearchParams) {
  return (
    params.get('error') === 'access_denied' ||
    params.get('error_code') === 'access_denied'
  );
}

export function readOAuthCallback(
  href: string,
  base: string,
  hashRouting: boolean,
) {
  const url = new URL(href);
  const hash = url.hash.slice(1);
  const fragment = new URLSearchParams(hash);
  const query = url.searchParams;
  const hasError = (params: URLSearchParams) =>
    params.has('error') ||
    params.has('error_code') ||
    params.has('error_description');
  const hasTokens = (params: URLSearchParams) =>
    params.has('access_token') ||
    params.has('refresh_token') ||
    params.has('provider_token') ||
    params.has('provider_refresh_token');
  const documentPath = new URL(oauthRedirectUrl(url.origin, base, hashRouting))
    .pathname;
  const isCallbackDocument =
    url.pathname.replace(/\/+$/, '').toLowerCase() ===
    documentPath.replace(/\/+$/, '').toLowerCase();

  // HashRouter receives PKCE codes in the document query, before the route fragment.
  const invalidHashCallback =
    hash.includes('?') &&
    hash.split('?')[0]?.replace(/\/+$/, '').toLowerCase() === callbackPath;
  const hasCallbackParameters =
    invalidHashCallback ||
    query.has('code') ||
    hasError(query) ||
    hasError(fragment) ||
    hasTokens(query) ||
    hasTokens(fragment);
  if (!isCallbackDocument || (hashRouting && !hasCallbackParameters)) {
    return { callback: none };
  }

  const codes = query.getAll('code');
  let callback = invalid;
  if (!invalidHashCallback && !hasTokens(query) && !hasTokens(fragment)) {
    if (isCancelled(query) || isCancelled(fragment)) callback = cancelled;
    else if (
      !hasError(query) &&
      !hasError(fragment) &&
      codes.length === 1 &&
      codePattern.test(codes[0]!)
    ) {
      callback = { kind: 'code', code: codes[0]! };
    }
  }

  const cleanPath = hashRouting ? `${base}#${callbackPath}` : documentPath;
  return { callback, cleanPath };
}
