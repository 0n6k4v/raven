class CookieManager {
  constructor(defaults = {}) {
    this.defaults = {
      path: '/',
      maxAge: null,
      domain: null,
      secure: false,
      sameSite: null,
      ...defaults
    };
  }

  set(name, value, options = {}) {
    if (typeof document === 'undefined') return;
    const opts = { ...this.defaults, ...options };
    const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
    if (opts.maxAge != null) parts.push(`max-age=${Number(opts.maxAge)}`);
    if (opts.path) parts.push(`path=${opts.path}`);
    if (opts.domain) parts.push(`domain=${opts.domain}`);
    if (opts.secure) parts.push('Secure');
    if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
    document.cookie = parts.join('; ');
  }

  get(name) {
    if (typeof document === 'undefined') return null;
    const encoded = `${encodeURIComponent(name)}=`;
    const match = document.cookie.split('; ').find(c => c.trim().startsWith(encoded));
    if (!match) return null;
    const value = match.split('=').slice(1).join('=');
    return decodeURIComponent(value);
  }

  delete(name, options = {}) {
    this.set(name, '', { ...options, maxAge: 0 });
  }

  getAll() {
    if (typeof document === 'undefined') return {};
    if (!document.cookie) return {};
    const result = {};
    document.cookie.split('; ').forEach(pair => {
      const idx = pair.indexOf('=');
      const key = decodeURIComponent(pair.slice(0, idx));
      const val = decodeURIComponent(pair.slice(idx + 1));
      result[key] = val;
    });
    return result;
  }
}

const cookieManager = new CookieManager();

export default cookieManager;
export const setCookie = (name, value, opts) => cookieManager.set(name, value, opts);
export const readCookie = (name) => cookieManager.get(name);
export const deleteCookie = (name, opts) => cookieManager.delete(name, opts);
export { CookieManager };