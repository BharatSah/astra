import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  senderName: string;
  senderEmail: string;
}

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

async function logEmailDispatch(
  supabaseUrl: string,
  serviceRoleKey: string,
  entry: {
    recipient: string;
    subject: string;
    body: string;
    status: "sent" | "failed";
    emailType?: string | null;
    errorMessage?: string | null;
  },
) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/email_logs`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        recipient: entry.recipient,
        subject: entry.subject,
        body: entry.body,
        status: entry.status,
        email_type: entry.emailType || null,
        error_message: entry.errorMessage || null,
      }),
    });
  } catch (err) {
    console.error("Failed to write email_logs row:", err);
  }
}

function badRequest(message: string) {
  return jsonResponse({ success: false, error: message }, 400);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return badRequest("Only POST is supported");
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { to, subject, textBody, emailType } = body;
  const htmlBody = body.htmlBody ?? body.body;
  if (!to || !subject || (!htmlBody && !textBody)) {
    return badRequest("Missing required fields: to, subject, textBody or htmlBody");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return badRequest("Server environment not configured");
  }

  const settingsRes = await fetch(`${supabaseUrl}/rest/v1/system_settings?key=eq.smtp_config&select=value`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  if (!settingsRes.ok) {
    return badRequest("Failed to load SMTP settings");
  }

  const settingsRows = await settingsRes.json();
  const smtp: SmtpConfig = settingsRows[0]?.value;
  if (!smtp?.host || !smtp?.username || !smtp?.password) {
    return badRequest("SMTP not configured. Save your SMTP credentials in Email & SMTP settings.");
  }

  const port = Number(smtp.port) || 587;
  const secure = Boolean(smtp.secure);
  const from = `${smtp.senderName || "Astra Notifications"} <${smtp.senderEmail || smtp.username}>`;

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port,
      secure,
      auth: {
        user: smtp.username,
        pass: smtp.password,
      },
    });

    const recipients = Array.isArray(to) ? to : [to];
    const bodyText = textBody ? String(textBody) : String(htmlBody || "");
    await transporter.sendMail({
      from,
      to: recipients.join(", "),
      subject: String(subject),
      text: textBody ? String(textBody) : undefined,
      html: htmlBody ? String(htmlBody) : undefined,
    });

    for (const recipient of recipients) {
      await logEmailDispatch(supabaseUrl, serviceRoleKey, {
        recipient: String(recipient),
        subject: String(subject),
        body: bodyText,
        status: "sent",
        emailType: emailType ? String(emailType) : null,
      });
    }

    return jsonResponse(
      { success: true, message: `Email dispatched to ${recipients.join(", ")}` },
      200,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("SMTP send failed:", message);
    const recipients = Array.isArray(to) ? to : [to];
    const bodyText = textBody ? String(textBody) : String(htmlBody || "");
    for (const recipient of recipients) {
      await logEmailDispatch(supabaseUrl, serviceRoleKey, {
        recipient: String(recipient),
        subject: String(subject),
        body: bodyText,
        status: "failed",
        emailType: emailType ? String(emailType) : null,
        errorMessage: message,
      });
    }
    return jsonResponse({ success: false, error: message }, 500);
  }
});
