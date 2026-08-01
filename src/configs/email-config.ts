const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  RESEND_API_KEY,
} = process.env;

/**
 * Two transports, because the hosting dictates it.
 *
 * Render blocks outbound SMTP, so anything deployed there must go over HTTPS —
 * that is what Resend is for. Locally, cPanel SMTP works fine and needs no
 * third party, so it stays as the fallback. Setting RESEND_API_KEY picks Resend.
 */
export const emailTransport: "resend" | "smtp" | "none" = RESEND_API_KEY
  ? "resend"
  : EMAIL_HOST && EMAIL_USER && EMAIL_PASS
    ? "smtp"
    : "none";

export const isEmailConfigured = emailTransport !== "none";

/** Address mail is sent as. Must be on a domain verified with Resend. */
export const emailFrom = EMAIL_FROM || EMAIL_USER || "";

export const resendApiKey = RESEND_API_KEY || "";

export const emailConfig = {
  host: EMAIL_HOST || "",
  // 465 is implicit TLS; 587 negotiates STARTTLS and needs secure=false.
  port: Number(EMAIL_PORT) || 465,
  secure: (Number(EMAIL_PORT) || 465) === 465,
  auth: {
    user: EMAIL_USER || "",
    pass: EMAIL_PASS || "",
  },
};

/** Credential shape without the secret, for diagnosing a failed send. */
export const describeEmailConfig = () => {
  if (emailTransport === "resend") {
    return [
      "transport=resend",
      `key=set(len ${RESEND_API_KEY!.length})`,
      `from=${emailFrom || "MISSING"}`,
      /[<>]/.test(RESEND_API_KEY!) ? "!! <placeholder>" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (emailTransport === "smtp") {
    return [
      "transport=smtp",
      `host=${EMAIL_HOST}`,
      `port=${emailConfig.port}`,
      `secure=${emailConfig.secure}`,
      `user=${EMAIL_USER}`,
      `pass=set(len ${EMAIL_PASS!.length})`,
    ].join(" ");
  }

  return "transport=none — set RESEND_API_KEY (hosted) or EMAIL_HOST/USER/PASS (local)";
};

if (!isEmailConfigured) {
  // Registration deletes the new user when the confirmation email fails, so an
  // unconfigured mailer looks like "signup silently does nothing".
  console.warn("[Email] Not configured —", describeEmailConfig());
} else {
  console.log("[Email]", describeEmailConfig());
}
