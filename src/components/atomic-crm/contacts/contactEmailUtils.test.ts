import { describe, expect, it } from "vitest";

import {
  getPrimaryContactEmail,
  parseNoteSubjectLine,
  replyToNoteSubject,
} from "./contactEmailUtils";
import type { Contact } from "../types";

describe("contactEmailUtils", () => {
  it("prefers work email", () => {
    const contact = {
      email_jsonb: [
        { email: "personal@example.com", type: "Home" },
        { email: "work@example.com", type: "Work" },
      ],
    } as Contact;

    expect(getPrimaryContactEmail(contact)).toBe("work@example.com");
  });

  it("parses subject from first line of note text", () => {
    expect(
      parseNoteSubjectLine("Website inquiry\n\nHello from the form"),
    ).toEqual({
      subjectLine: "Website inquiry",
      body: "Hello from the form",
    });
  });

  it("builds Re: subject from inbound note", () => {
    expect(replyToNoteSubject("Website inquiry\n\nHello")).toBe(
      "Re: Website inquiry",
    );
    expect(replyToNoteSubject("**[Sent email]**\n\n**To:** x")).toBeUndefined();
  });
});
