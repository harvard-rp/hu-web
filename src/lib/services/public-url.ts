const loopback =
  /^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::[0-9]+)?(?:\/|$)/i;

export function readPublicUrl(value: string) {
  const url = URL.parse(value);
  if (
    !url ||
    (url.protocol !== 'https:' && !loopback.test(value)) ||
    url.username ||
    url.password ||
    value.includes('?') ||
    value.includes('#')
  )
    return undefined;
  return url;
}
