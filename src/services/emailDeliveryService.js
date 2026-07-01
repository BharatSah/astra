import { supabase, isFallbackMode } from "../models/dbClient.js";

const FUNCTION_NAME = "send-email";

function buildHtmlBody(text) {
  if (!text) return "";
  return `<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">${text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>")}</div>`;
}

function extractEdgeError(error, data) {
  if (data?.error) return String(data.error);
  if (error?.context?.body) {
    try {
      const parsed = typeof error.context.body === "string"
        ? JSON.parse(error.context.body)
        : error.context.body;
      if (parsed?.error) return String(parsed.error);
    } catch {
      // ignore malformed edge error body
    }
  }
  return error?.message || "Email dispatch failed";
}

/**
 * Send an email through the Supabase Edge Function.
 * @param {{to: string | string[], subject: string, textBody: string, emailType?: string}} params
 * @returns {Promise<{success: boolean, message?: string, error?: string, source: string}>}
 */
export async function sendEmail({ to, subject, textBody, emailType }) {
  if (!to || !subject || !textBody) {
    return { success: false, error: "Missing to, subject or body", source: "client" };
  }
  if (isFallbackMode) {
    return {
      success: true,
      source: "simulated",
      message: `Simulated dispatch to ${Array.isArray(to) ? to.join(", ") : to}`,
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: {
        to,
        subject,
        textBody,
        htmlBody: buildHtmlBody(textBody),
        emailType: emailType || null,
      },
    });

    if (error) {
      return { success: false, error: extractEdgeError(error, data), source: "edge" };
    }
    if (!data?.success) {
      return { success: false, error: data?.error || "Email dispatch failed", source: "edge" };
    }
    return { success: true, message: data.message, source: "edge" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      source: "client",
    };
  }
}

/**
 * Test the SMTP connection by sending a real email via the edge function.
 * @param {{to: string, subject: string, textBody: string}} params
 */
export async function testSmtpConnection(params) {
  return sendEmail({ ...params, emailType: "SMTP Test" });
}
