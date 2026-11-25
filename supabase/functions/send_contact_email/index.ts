import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, OptionsMiddleware } from "../_shared/cors.ts";
import { createErrorResponse } from "../_shared/utils.ts";
import { AuthMiddleware, UserMiddleware } from "../_shared/authentication.ts";
import { getUserSale } from "../_shared/getUserSale.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

const DEFAULT_FROM = "Deep Field Capital <info@deepfieldstms.com>";
const DEFAULT_REPLY_TO = "info@deepfieldcapital.com";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHtml(text: string): string {
  return escapeHtml(text).replace(/\r\n/g, "\n").split("\n").join("<br>");
}

function buildSentEmailNoteText(to: string, subject: string, body: string) {
  return `**[Sent email]**

**To:** ${to}

**Subject:** ${subject}

${body}`;
}

type SendContactEmailBody = {
  contactId: number;
  to: string;
  subject: string;
  body: string;
  noteStatus?: string;
};

Deno.serve(async (req: Request) =>
  OptionsMiddleware(req, async (req) =>
    AuthMiddleware(req, async (req) =>
      UserMiddleware(req, async (req, user) => {
        if (req.method !== "POST") {
          return createErrorResponse(405, "Method Not Allowed");
        }

        let payload: SendContactEmailBody;
        try {
          payload = await req.json();
        } catch {
          return createErrorResponse(400, "Invalid JSON body");
        }

        const {
          contactId,
          to,
          subject,
          body,
          noteStatus = "contacted",
        } = payload;

        if (
          contactId == null ||
          !to?.trim() ||
          !subject?.trim() ||
          !body?.trim()
        ) {
          return createErrorResponse(
            400,
            "contactId, to, subject, and body are required",
          );
        }

        const toEmail = to.trim();
        if (!EMAIL_PATTERN.test(toEmail)) {
          return createErrorResponse(400, "Invalid recipient email address");
        }

        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) {
          return createErrorResponse(500, "Email sending is not configured");
        }

        const from = Deno.env.get("EMAIL_FROM") ?? DEFAULT_FROM;
        const replyTo = Deno.env.get("EMAIL_REPLY_TO") ?? DEFAULT_REPLY_TO;

        const sale = await getUserSale(user!);
        if (!sale) {
          return createErrorResponse(403, "No CRM user profile found");
        }

        const { data: contact, error: contactError } = await supabaseAdmin
          .from("contacts")
          .select("id, status")
          .eq("id", contactId)
          .maybeSingle();

        if (contactError || !contact) {
          return createErrorResponse(
            404,
            contactError?.message ?? "Contact not found",
          );
        }

        const resendBody: Record<string, unknown> = {
          from,
          to: [toEmail],
          subject: subject.trim(),
          text: body,
          html: textToHtml(body),
          reply_to: replyTo,
        };

        if (sale.email && EMAIL_PATTERN.test(sale.email)) {
          resendBody.bcc = [sale.email];
        }

        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(resendBody),
        });

        const resendResult = await resendResponse.json().catch(() => ({}));

        if (!resendResponse.ok) {
          console.error(
            "Resend API error:",
            resendResponse.status,
            resendResult,
          );
          const message =
            typeof resendResult?.message === "string"
              ? resendResult.message
              : "Failed to send email";
          return createErrorResponse(502, message);
        }

        const noteText = buildSentEmailNoteText(toEmail, subject.trim(), body);
        const noteDate = new Date().toISOString();

        const { data: note, error: noteError } = await supabaseAdmin
          .from("contact_notes")
          .insert({
            contact_id: contactId,
            text: noteText,
            sales_id: sale.id,
            status: noteStatus,
            date: noteDate,
          })
          .select("*")
          .single();

        if (noteError || !note) {
          console.error("Note insert after send failed:", noteError);
          return createErrorResponse(
            500,
            "Email was sent but failed to record the note",
          );
        }

        const { error: contactUpdateError } = await supabaseAdmin
          .from("contacts")
          .update({ status: noteStatus })
          .eq("id", contactId);

        if (contactUpdateError) {
          console.error("Contact status update failed:", contactUpdateError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            note,
            noteStatus,
            resendId: resendResult?.id,
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }),
    ),
  ),
);
