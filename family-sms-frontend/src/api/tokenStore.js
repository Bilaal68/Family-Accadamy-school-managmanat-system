let accessToken = null;
let refreshToken = null;
let tokenGetterFn = null;

export function setTokens({ access, refresh }) {
  accessToken = access ?? null;
  refreshToken = refresh ?? null;
}

export function setTokenGetter(fn) {
  tokenGetterFn = fn;
}

export function getToken() {
  if (tokenGetterFn) {
    return tokenGetterFn();
  }
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}
