import { Mars, NonBinary, Venus } from "lucide-react";

import type { Company, Contact, ContactGender } from "../types";

export const defaultEmailJsonb = [{ email: null, type: null }];
export const defaultPhoneJsonb = [{ number: null, type: null }];

const cleanContactArrayFields = (data: Contact) => {
  const cleanedEmailJsonb =
    data.email_jsonb?.filter((e) => e.email != null) || [];
  const cleanedPhoneJsonb =
    data.phone_jsonb?.filter((p) => p.number != null) || [];
  return {
    ...data,
    phone_jsonb: cleanedPhoneJsonb.length > 0 ? cleanedPhoneJsonb : null,
    email_jsonb: cleanedEmailJsonb.length > 0 ? cleanedEmailJsonb : null,
  };
};

export const cleanupContactForCreate = (data: Contact) => {
  return cleanContactArrayFields({
    ...data,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    tags: [],
  });
};

export const cleanupContactForEdit = cleanContactArrayFields;

type TranslateFn = (key: string, options?: { [key: string]: any }) => string;

export const contactGenderDefaultLabels: Record<string, string> = {
  male: "He/Him",
  female: "She/Her",
  nonbinary: "They/Them",
};

const personalInfoTypeMap: Record<string, string> = {
  Work: "work",
  Home: "home",
  Mobile: "mobile",
  Fax: "fax",
  Other: "other",
};

export const contactGender: ContactGender[] = [
  {
    value: "male",
    label: "resources.contacts.inputs.genders.male",
    icon: Mars,
  },
  {
    value: "female",
    label: "resources.contacts.inputs.genders.female",
    icon: Venus,
  },
  {
    value: "nonbinary",
    label: "resources.contacts.inputs.genders.nonbinary",
    icon: NonBinary,
  },
];

export const contactLeadSources = [
  { id: "web", name: "Web" },
  { id: "phone_inquiry", name: "Phone Inquiry" },
  { id: "referral", name: "Referral" },
  { id: "conference", name: "Conference" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "purchased_list", name: "Purchased List" },
  { id: "other", name: "Other" },
];

export const contactLevels = [
  { id: "primary", name: "Primary" },
  { id: "secondary", name: "Secondary" },
  { id: "tertiary", name: "Tertiary" },
];

export const translateContactGenderLabel = (
  gender: { value: string; label: string },
  translate: TranslateFn,
) =>
  translate(gender.label, {
    _: contactGenderDefaultLabels[gender.value] ?? gender.label,
  });

export const translatePersonalInfoTypeLabel = (
  type: string,
  translate: TranslateFn,
) =>
  translate(
    `resources.contacts.inputs.personal_info_types.${personalInfoTypeMap[type] ?? type.toLowerCase()}`,
    {
      _: type,
    },
  );

export const formatContactAddress = (
  street?: string | null,
  city?: string | null,
  state?: string | null,
  zip?: string | null,
  country?: string | null,
) => {
  const cityLine = [city, [state, zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const lines = [street, cityLine, country].filter(Boolean);
  return lines.length ? lines.join("\n") : null;
};

/**
 * Folds a long line according to vCard specification (max 75 chars per line)
 * Continuation lines start with a space
 */
function foldLine(line: string): string {
  const maxLength = 75;
  if (line.length <= maxLength) return line;

  const result: string[] = [];
  let currentLine = line.substring(0, maxLength);
  let remaining = line.substring(maxLength);

  result.push(currentLine);

  while (remaining.length > 0) {
    // Continuation lines start with a space and can have 74 more chars
    const chunkSize = maxLength - 1;
    currentLine = " " + remaining.substring(0, chunkSize);
    remaining = remaining.substring(chunkSize);
    result.push(currentLine);
  }

  return result.join("\r\n");
}

/**
 * Converts a contact and their company to vCard 3.0 format
 */
export function exportToVCard(
  contact: Contact,
  company?: Company,
  photoData?: { base64: string; mimeType: string },
): string {
  const lines: string[] = [];

  // vCard header
  lines.push("BEGIN:VCARD");
  lines.push("VERSION:3.0");

  // Name (N: Family Name;Given Name;Additional Names;Honorific Prefixes;Honorific Suffixes)
  lines.push(`N:${contact.last_name};${contact.first_name};;;`);

  // Formatted name
  lines.push(`FN:${contact.first_name} ${contact.last_name}`);

  // Title/Job position
  if (contact.title) {
    lines.push(`TITLE:${contact.title}`);
  }

  // Organization
  if (company?.name || contact.department) {
    lines.push(`ORG:${company?.name || ""}${contact.department ? `;${contact.department}` : ""}`);
  }

  // Emails
  if (contact.email_jsonb && contact.email_jsonb.length > 0) {
    contact.email_jsonb.forEach((emailObj) => {
      const type = emailObj.type.toUpperCase();
      lines.push(`EMAIL;TYPE=${type}:${emailObj.email}`);
    });
  }

  // Phone numbers
  if (contact.phone_jsonb && contact.phone_jsonb.length > 0) {
    contact.phone_jsonb.forEach((phoneObj) => {
      const type = phoneObj.type.toUpperCase();
      lines.push(`TEL;TYPE=${type}:${phoneObj.number}`);
    });
  }

  if (contact.mailing_street || contact.mailing_city) {
    lines.push(
      `ADR;TYPE=WORK:;;${contact.mailing_street || ""};${contact.mailing_city || ""};${contact.mailing_state || ""};${contact.mailing_zip || ""};${contact.mailing_country || ""}`,
    );
  }

  if (contact.other_street || contact.other_city) {
    lines.push(
      `ADR;TYPE=HOME:;;${contact.other_street || ""};${contact.other_city || ""};${contact.other_state || ""};${contact.other_zip || ""};${contact.other_country || ""}`,
    );
  }

  if (contact.birthdate) {
    lines.push(`BDAY:${contact.birthdate.replaceAll("-", "")}`);
  }

  // LinkedIn URL
  if (contact.linkedin_url) {
    lines.push(`URL:${contact.linkedin_url}`);
  }

  // Background/Note
  if (contact.background) {
    // Escape newlines and special characters in notes
    const escapedNote = contact.background
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
    lines.push(`NOTE:${escapedNote}`);
  }

  // Photo/Avatar - vCard 3.0 format with base64 encoding
  if (photoData) {
    // Extract image type from MIME type (e.g., "image/png" -> "PNG")
    const imageType = photoData.mimeType.split("/")[1]?.toUpperCase() || "PNG";

    // vCard 3.0 format: PHOTO;ENCODING=b;TYPE=PNG:
    const photoLine = `PHOTO;ENCODING=b;TYPE=${imageType}:${photoData.base64}`;
    lines.push(foldLine(photoLine));
  }

  // vCard footer
  lines.push("END:VCARD");

  return lines.join("\r\n");
}
