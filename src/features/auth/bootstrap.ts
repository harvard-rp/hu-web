import { readPublicUrl } from '@/lib/services/public-url';
import type { SupabaseConfig } from '@/lib/services/supabase-config';
import { createAuthController, noAuth } from './auth-session';
import { oauthRedirectUrl, readOAuthCallback } from './callback';

declare const __HU_SUPABASE_CONFIG__: SupabaseConfig;

export async function prepareBrowserAuth(
  browser: Window,
  hashRouting: boolean,
  base: string,
) {
  const { callback, cleanPath } = readOAuthCallback(
    browser.location.href,
    base,
    hashRouting,
  );
  if (
    cleanPath &&
    `${browser.location.pathname}${browser.location.search}${browser.location.hash}` !==
      cleanPath
  ) {
    browser.history.replaceState(browser.history.state, '', cleanPath);
  }

  const config = __HU_SUPABASE_CONFIG__;
  if (hashRouting || config.kind === 'disabled') return noAuth;
  if (config.kind !== 'ready' || !readPublicUrl(browser.location.origin))
    return createAuthController('invalid-config');

  const [{ apiConfig }, { createApiClient }] = await Promise.all([
    import('@/lib/services/api-config'),
    import('@/lib/services/api-client'),
  ]);
  if (apiConfig.kind !== 'ready') return createAuthController('invalid-config');

  return createAuthController('enabled', {
    service: async () => {
      const { createSupabaseAuth } =
        await import('@/lib/services/supabase-auth');
      return createSupabaseAuth(config, browser);
    },
    api: createApiClient(apiConfig),
    callback,
    redirectTo: oauthRedirectUrl(browser.location.origin, base, hashRouting),
  });
}
