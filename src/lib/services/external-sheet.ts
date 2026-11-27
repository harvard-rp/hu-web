// Keep this allowlist aligned with character_lifecycle.valid_external_url.
const viewingLink =
  /^https:\/\/(?:www\.canva\.com\/design\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)?\/view|docs\.google\.com\/document\/(?:u\/[0-9]+\/)?(?:d\/[A-Za-z0-9_-]+\/(?:edit|view|preview)|d\/e\/[A-Za-z0-9_-]+\/pub)|sites\.google\.com\/view\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\/?)(?:\?[A-Za-z0-9._~!$&()*+,;=:@/?%-]+)?(?:#[A-Za-z0-9._~!$&()*+,;=:@/?%-]+)?(?![\s\S])/u;

export function isExternalSheetUrl(value: string) {
  return (
    value.length <= 2048 &&
    viewingLink.test(value) &&
    !/%(?![a-fA-F0-9]{2})/u.test(value)
  );
}
