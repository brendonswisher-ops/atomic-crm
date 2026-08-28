import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ContactNote, Task } from "../types";
import {
  activityItemsFromNotes,
  activityItemsFromTasks,
  formatDayHeading,
  getDayKey,
  groupActivityByDay,
  isEmailNote,
  kindFromTaskType,
  mergeTasks,
  shortSubject,
} from "./activityByDay";

describe("activityByDay", () => {
  // Thursday Aug 27, 2026 9:21 PM PDT (UTC-7)
  const NOW = new Date("2026-08-28T04:21:00.000Z");

  beforeEach(() => {
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("groups timestamps by America/Los_Angeles calendar day", () => {
    expect(getDayKey("2026-08-28T04:21:00.000Z")).toBe("2026-08-27");
    expect(getDayKey("2026-08-27T07:00:00.000Z")).toBe("2026-08-27");
    expect(getDayKey("2026-08-27T06:59:00.000Z")).toBe("2026-08-26");
  });

  it("treats outlook_message_id and Email sent prefix as emails", () => {
    expect(
      isEmailNote({
        text: "Call recap",
        outlook_message_id: "AAMkAGI=",
      }),
    ).toBe(true);
    expect(
      isEmailNote({
        text: "**Email sent** Follow up on intro\n\nHi Brendon,",
      }),
    ).toBe(true);
    expect(isEmailNote({ text: "Spoke with the family office" })).toBe(false);
  });

  it("shortens subjects and strips the Email sent prefix", () => {
    expect(shortSubject("**Email sent** Follow up on intro\n\nHi")).toBe(
      "Follow up on intro",
    );
    expect(shortSubject("**Email sent**\nSubject: Wiring instructions")).toBe(
      "Wiring instructions",
    );
    expect(shortSubject("a".repeat(90)).length).toBe(80);
  });

  it("skips untyped tasks and maps known activity types", () => {
    expect(kindFromTaskType("none")).toBeNull();
    expect(kindFromTaskType(undefined)).toBeNull();
    expect(kindFromTaskType("call")).toBe("call");
    expect(kindFromTaskType("meeting")).toBe("meeting");
    expect(kindFromTaskType("email")).toBe("email");
    expect(kindFromTaskType("follow-up")).toBe("follow-up");
    expect(kindFromTaskType("lunch")).toBe("other");
  });

  it("uses done_date for completed tasks and due_date otherwise", () => {
    const items = activityItemsFromTasks([
      {
        id: 1,
        contact_id: 10,
        type: "call",
        text: "Check-in call",
        due_date: "2026-08-20T16:00:00.000Z",
        done_date: "2026-08-27T18:30:00.000Z",
      },
      {
        id: 2,
        contact_id: 11,
        type: "meeting",
        text: "QEP review",
        due_date: "2026-08-27T20:00:00.000Z",
        done_date: null,
      },
    ]);
    expect(items[0].at).toBe("2026-08-27T18:30:00.000Z");
    expect(items[0].kind).toBe("call");
    expect(items[1].at).toBe("2026-08-27T20:00:00.000Z");
    expect(items[1].kind).toBe("meeting");
  });

  it("prefers the completed copy when merging due and done task lists", () => {
    const merged = mergeTasks(
      [
        {
          id: 1,
          contact_id: 10,
          type: "call",
          text: "Check-in",
          due_date: "2026-08-27T16:00:00.000Z",
          done_date: null,
        },
      ],
      [
        {
          id: 1,
          contact_id: 10,
          type: "call",
          text: "Check-in",
          due_date: "2026-08-27T16:00:00.000Z",
          done_date: "2026-08-27T18:00:00.000Z",
        },
      ],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].done_date).toBe("2026-08-27T18:00:00.000Z");
  });

  it("groups last 14 days, omits empty days, most recent first", () => {
    const notes: ContactNote[] = [
      {
        id: 1,
        contact_id: 10,
        text: "**Email sent** Intro follow-up",
        date: "2026-08-28T04:00:00.000Z",
        sales_id: 1,
        status: "contacted",
      },
      {
        id: 2,
        contact_id: 11,
        text: "Left a voicemail",
        date: "2026-08-20T17:00:00.000Z",
        sales_id: 1,
        status: "contacted",
      },
      {
        id: 3,
        contact_id: 12,
        text: "Too old",
        date: "2026-08-13T17:00:00.000Z",
        sales_id: 1,
        status: "new",
      },
    ];
    const tasks: Task[] = [
      {
        id: 4,
        contact_id: 10,
        type: "call",
        text: "Same-day call",
        due_date: "2026-08-28T03:00:00.000Z",
        done_date: "2026-08-28T03:10:00.000Z",
      },
      {
        id: 5,
        contact_id: 13,
        type: "meeting",
        text: "Future meeting",
        due_date: "2026-08-29T17:00:00.000Z",
        done_date: null,
      },
      {
        id: 6,
        contact_id: 14,
        type: "none",
        text: "Untyped todo",
        due_date: "2026-08-27T17:00:00.000Z",
        done_date: null,
      },
    ];

    const groups = groupActivityByDay([
      ...activityItemsFromNotes(notes),
      ...activityItemsFromTasks(tasks),
    ]);

    expect(groups.map((group) => group.dayKey)).toEqual([
      "2026-08-27",
      "2026-08-20",
    ]);
    expect(groups[0].counts.email).toBe(1);
    expect(groups[0].counts.call).toBe(1);
    expect(groups[0].items.map((item) => item.kind)).toEqual(["email", "call"]);
    expect(groups[1].counts.note).toBe(1);
    expect(formatDayHeading("2026-08-27", "en")).toBe("Thu Aug 27");
  });
});
