export function getUrlWithToken(url, token = null) {
  return token ? `${url}?token=${token}` : url;
}
