import { downloadCSV, type Exporter } from "ra-core";

import type { Company, Contact } from "../types";

const OUTLOOK_HEADERS = [
  "First Name",
  "Last Name",
  "Title",
  "Company",
  "E-mail Address",
  "E-mail 2 Address",
  "Business Phone",
  "Home Phone",
  "Mobile Phone",
  "Web Page",
  "Notes",
] as const;

const escapeCsv = (value: string) => {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const emailsFor = (contact: Contact) => {
  const emails = (contact.email_jsonb ?? [])
    .map((entry) => entry.email?.trim())
    .filter((email): email is string => Boolean(email));
  const work = contact.email_jsonb?.find((entry) => entry.type === "Work")?.email;
  const rest = emails.filter((email) => email !== work);
  const primary = work || emails[0] || "";
  const secondary = rest.find((email) => email !== primary) || "";
  return { primary, secondary };
};

const phonesFor = (contact: Contact) => {
  const work =
    contact.phone_jsonb?.find((entry) => entry.type === "Work")?.number ?? "";
  const home =
    contact.phone_jsonb?.find((entry) => entry.type === "Home")?.number ?? "";
  const other =
    contact.phone_jsonb?.find((entry) => entry.type === "Other")?.number ?? "";
  return { work, home, mobile: other };
};

export const outlookExporter: Exporter<Contact> = async (
  records,
  fetchRelatedRecords,
) => {
  const companies = await fetchRelatedRecords<Company>(
    records,
    "company_id",
    "companies",
  );

  const rows = records.map((contact) => {
    const { primary, secondary } = emailsFor(contact);
    const { work, home, mobile } = phonesFor(contact);
    const company =
      contact.company_id != null ? companies[contact.company_id]?.name ?? "" : "";

    return [
      contact.first_name ?? "",
      contact.last_name ?? "",
      contact.title ?? "",
      company,
      primary,
      secondary,
      work,
      home,
      mobile,
      contact.linkedin_url ?? "",
      contact.background ?? "",
    ].map((value) => escapeCsv(String(value)));
  });

  const csv = [OUTLOOK_HEADERS.join(","), ...rows.map((row) => row.join(","))].join(
    "\r\n",
  );
  downloadCSV(`\uFEFF${csv}`, "contacts-outlook");
};
