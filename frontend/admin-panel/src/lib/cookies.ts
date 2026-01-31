// Cookie utilities for auth token synchronization

const COOKIE_OPTIONS = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${COOKIE_OPTIONS.path}; ${COOKIE_OPTIONS.secure ? 'secure;' : ''} samesite=${COOKIE_OPTIONS.sameSite}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}

export function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${COOKIE_OPTIONS.path};`;
}

// Sync tokens with cookies for middleware access
export function syncTokensToCookies(accessToken: string | null, refreshToken: string | null) {
  if (accessToken) {
    setCookie('access_token', accessToken);
  } else {
    deleteCookie('access_token');
  }
  
  if (refreshToken) {
    setCookie('refresh_token', refreshToken);
  } else {
    deleteCookie('refresh_token');
  }
}

export function clearAuthCookies() {
  deleteCookie('access_token');
  deleteCookie('refresh_token');
}
