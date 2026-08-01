const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

export const isEmailConfigured = Boolean(EMAIL_HOST && EMAIL_USER && EMAIL_PASS);

if (!isEmailConfigured) {
  // Registration deletes the new user when the confirmation email fails to
  // send, so an unconfigured mailer looks like "signup silently does nothing".
  console.warn(
    "[Email] Not configured — registration and password reset will fail. " +
      "Set EMAIL_HOST, EMAIL_USER and EMAIL_PASS.",
  );
}

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
export const describeEmailConfig = () =>
  [
    `host=${EMAIL_HOST || "MISSING"}`,
    `port=${emailConfig.port}`,
    `secure=${emailConfig.secure}`,
    `user=${EMAIL_USER || "MISSING"}`,
    `pass=${EMAIL_PASS ? `set(len ${EMAIL_PASS.length})` : "MISSING"}`,
    /[<>]/.test(EMAIL_PASS || "") ? "!! <placeholder>" : "",
  ]
    .filter(Boolean)
    .join(" ");
