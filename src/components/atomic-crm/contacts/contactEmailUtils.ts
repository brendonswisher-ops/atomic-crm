import type { Contact } from "../types";

export const getPrimaryContactEmail = (contact: Contact): string => {
  const emails = contact.email_jsonb ?? [];
  const work = emails.find((entry) => entry.type === "Work")?.email;
  return work?.trim() || emails[0]?.email?.trim() || "";
};

/** Inbound / website notes often store the subject on the first line. */
export const parseNoteSubjectLine = (
  text: string,
): { subjectLine?: string; body: string } => {
  if (!text?.trim()) {
    return { body: "" };
  }
  const trimmed = text.trim();
  const splitIndex = trimmed.indexOf("\n");
  if (splitIndex === -1) {
    return { subjectLine: trimmed, body: "" };
  }
  const subjectLine = trimmed.slice(0, splitIndex).trim();
  const body = trimmed.slice(splitIndex + 1).replace(/^\n+/, "");
  return { subjectLine, body };
};

export const defaultReplySubject = (crmTitle: string) =>
  `Re: your inquiry to ${crmTitle}`;

export const replyToNoteSubject = (noteText: string) => {
  const { subjectLine } = parseNoteSubjectLine(noteText);
  if (subjectLine && !subjectLine.startsWith("**[Sent email]**")) {
    const base = subjectLine.replace(/^Re:\s*/i, "");
    return `Re: ${base}`;
  }
  return undefined;
};
