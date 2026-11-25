import { useDataProvider, useNotify, useTranslate, useUpdate } from "ra-core";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { CrmDataProvider } from "../providers/types";
import type { Contact } from "../types";
import {
  defaultReplySubject,
  getPrimaryContactEmail,
} from "./contactEmailUtils";
import { useConfigurationContext } from "../root/ConfigurationContext";

export type ContactEmailReplyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  onSent?: () => void;
};

export const ContactEmailReplyDialog = ({
  open,
  onOpenChange,
  contact,
  initialTo,
  initialSubject,
  initialBody,
  onSent,
}: ContactEmailReplyDialogProps) => {
  const { title: crmTitle } = useConfigurationContext();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const notify = useNotify();
  const translate = useTranslate();
  const [update] = useUpdate();

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTo(initialTo ?? getPrimaryContactEmail(contact));
    setSubject(
      initialSubject ??
        defaultReplySubject(
          crmTitle === "Atomic CRM" ? "Deep Field" : crmTitle,
        ),
    );
    setBody(initialBody ?? "");
  }, [open, contact, initialTo, initialSubject, initialBody, crmTitle]);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      notify("crm.email_reply.missing_fields", {
        type: "warning",
        messageArgs: { _: "Please fill in To, Subject, and Body." },
      });
      return;
    }

    setSending(true);
    try {
      const result = await dataProvider.sendContactEmail({
        contactId: contact.id,
        to: to.trim(),
        subject: subject.trim(),
        body,
        noteStatus: "contacted",
      });

      await update("contacts", {
        id: contact.id,
        data: {
          last_seen: new Date().toISOString(),
          status: result.noteStatus ?? "contacted",
        },
        previousData: contact,
      });

      notify("crm.email_reply.success", {
        type: "success",
        messageArgs: { _: "Email sent and logged on the contact." },
      });
      onOpenChange(false);
      onSent?.();
    } catch (error) {
      console.error("sendContactEmail", error);
      const message =
        error instanceof Error ? error.message : "Failed to send email";
      notify("crm.email_reply.error", {
        type: "error",
        messageArgs: { message, _: `Could not send email: ${message}` },
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {translate("crm.email_reply.title", { _: "Send email" })}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-email-to">
              {translate("crm.email_reply.to", { _: "To" })}
            </Label>
            <Input
              id="contact-email-to"
              type="email"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-email-subject">
              {translate("crm.email_reply.subject", { _: "Subject" })}
            </Label>
            <Input
              id="contact-email-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-email-body">
              {translate("crm.email_reply.body", { _: "Body" })}
            </Label>
            <Textarea
              id="contact-email-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={10}
              className="min-h-40"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
            className="cursor-pointer"
          >
            {translate("ra.action.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="cursor-pointer"
          >
            {translate("crm.email_reply.send", { _: "Send" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
