import { CookieOptions } from "express";

const hostOf = (url?: string) => {
  try {
    return url ? new URL(url).hostname : "";
  } catch {
    return "";
  }
};

// Hostname, not origin: SameSite is decided on the registrable domain, so
// localhost:3000 and localhost:5173 are the *same* site despite the ports.
const apiOrigin = hostOf(process.env.PUBLIC_URL || "http://localhost:3000");
const siteOrigin = hostOf(process.env.FRONTEND_URL || "http://localhost:5173");

/**
 * The API and the site are on different origins in production (onrender.com vs
 * the real domain), and a cross-site cookie is only sent when it is marked
 * SameSite=None; Secure. "strict" silently drops it on every cross-site
 * request, which leaves the refresh endpoint permanently without a token and
 * logs people out as soon as the access token expires.
 *
 * Same-origin (or local dev over http) keeps "lax", since None requires Secure
 * and Secure cookies are not sent over plain http.
 */
export const isCrossSite = apiOrigin !== siteOrigin;

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isCrossSite,
  sameSite: isCrossSite ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const describeCookieConfig = () =>
  `api=${apiOrigin} site=${siteOrigin} crossSite=${isCrossSite} sameSite=${refreshCookieOptions.sameSite} secure=${refreshCookieOptions.secure}`;
