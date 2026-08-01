import axios from "axios";

/**
 * Sends over Resend's HTTPS API rather than SMTP.
 *
 * Render blocks outbound SMTP, so nodemailer hangs there until it times out.
 * This goes out over port 443, which is not blocked. Deliberately a plain POST
 * on the axios already in the project — the official SDK adds a dependency for
 * one endpoint.
 */
export const resendAdapter = {
  async sendEmail(opts: {
    apiKey: string;
    from: string;
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    try {
      const response = await axios.post(
        "https://api.resend.com/emails",
        {
          from: opts.from,
          to: [opts.to],
          subject: opts.subject,
          html: opts.html,
        },
        {
          headers: {
            Authorization: `Bearer ${opts.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      );

      console.log("[Email] Sent via Resend, id:", response.data?.id);
      return true;
    } catch (error) {
      // Resend puts the actual reason in the body — an unverified sending
      // domain and a bad key both surface as a 4xx and are worth telling apart.
      if (axios.isAxiosError(error)) {
        console.error(
          "[Email] Resend rejected the send:",
          error.response?.status,
          JSON.stringify(error.response?.data ?? error.message),
        );
      } else {
        console.error("[Email] Resend request failed:", error);
      }
      return false;
    }
  },
};
