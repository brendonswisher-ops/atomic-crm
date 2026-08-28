import type { Identifier } from "ra-core";

import type { ContactNote, Task } from "../types";

export const ACTIVITY_TIME_ZONE = "America/Los_Angeles";
export const ACTIVITY_WINDOW_DAYS = 14;

export type ActivityKind =
  | "email"
  | "call"
  | "meeting"
  | "note"
  | "follow-up"
  | "other";

export const ACTIVITY_KIND_ORDER: ActivityKind[] = [
  "email",
  "call",
  "meeting",
  "note",
  "follow-up",
  "other",
];

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  at: string;
  contact_id: Identifier;
  subject: string;
  source: "note" | "task";
};

export type ActivityDayGroup = {
  dayKey: string;
  items: ActivityItem[];
  counts: Record<ActivityKind, number>;
};

const DATE_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: ACTIVITY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function getZonedParts(date: Date): ZonedParts {
  const map: Record<string, string> = {};
  for (const part of DATE_PARTS.formatToParts(date)) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

export function getDayKey(date: Date | string): string {
  const parts = getZonedParts(new Date(date));
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function addDaysToDayKey(dayKey: string, days: number): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${pad2(utc.getUTCMonth() + 1)}-${pad2(
    utc.getUTCDate(),
  )}`;
}

/**
 * Convert a wall-clock datetime in America/Los_Angeles to a UTC Date.
 */
export function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const parts = getZonedParts(new Date(utcGuess));
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return new Date(utcGuess - (asUtc - utcGuess));
}

export function getActivityWindowStart(now = new Date()): Date {
  const oldestKey = addDaysToDayKey(
    getDayKey(now),
    -(ACTIVITY_WINDOW_DAYS - 1),
  );
  const [year, month, day] = oldestKey.split("-").map(Number);
  return zonedDateTimeToUtc(year, month, day);
}

export function isEmailNote(
  note: Pick<ContactNote, "text"> & { outlook_message_id?: string | null },
): boolean {
  if (note.outlook_message_id) {
    return true;
  }
  return (note.text ?? "").trimStart().startsWith("**Email sent**");
}

export function shortSubject(
  text: string | null | undefined,
  maxLength = 80,
): string {
  if (!text) {
    return "";
  }
  const withoutEmailPrefix = text
    .replace(/\r\n/g, "\n")
    .replace(/^\s*\*\*Email sent\*\*\s*:?\s*/i, "");
  const firstLine =
    withoutEmailPrefix
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) ?? "";
  const stripped = firstLine
    .replace(/^#+\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/^Subject:\s*/i, "")
    .trim();
  if (stripped.length <= maxLength) {
    return stripped;
  }
  return `${stripped.slice(0, maxLength - 1).trimEnd()}…`;
}

export function kindFromTaskType(
  type: string | null | undefined,
): ActivityKind | null {
  if (!type || type === "none") {
    return null;
  }
  if (type === "email") return "email";
  if (type === "call") return "call";
  if (type === "meeting") return "meeting";
  if (type === "follow-up") return "follow-up";
  return "other";
}

export function i18nKindKey(kind: ActivityKind): string {
  return kind === "follow-up" ? "follow_up" : kind;
}

export function activityItemsFromNotes(
  notes: ContactNote[] = [],
): ActivityItem[] {
  return notes
    .filter((note) => Boolean(note.date) && note.contact_id != null)
    .map((note) => ({
      id: `note-${note.id}`,
      kind: isEmailNote(note) ? "email" : "note",
      at: note.date,
      contact_id: note.contact_id,
      subject: shortSubject(note.text),
      source: "note" as const,
    }));
}

export function mergeTasks(
  dueTasks: Task[] = [],
  doneTasks: Task[] = [],
): Task[] {
  const map = new Map<Identifier, Task>();
  for (const task of [...dueTasks, ...doneTasks]) {
    const prev = map.get(task.id);
    if (!prev) {
      map.set(task.id, task);
      continue;
    }
    map.set(task.id, prev.done_date ? prev : task);
  }
  return Array.from(map.values());
}

export function activityItemsFromTasks(tasks: Task[] = []): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const task of tasks) {
    const kind = kindFromTaskType(task.type);
    if (!kind || task.contact_id == null) {
      continue;
    }
    const at = task.done_date || task.due_date;
    if (!at) {
      continue;
    }
    items.push({
      id: `task-${task.id}`,
      kind,
      at,
      contact_id: task.contact_id,
      subject: shortSubject(task.text),
      source: "task",
    });
  }
  return items;
}

export function groupActivityByDay(
  items: ActivityItem[],
  now = new Date(),
): ActivityDayGroup[] {
  const todayKey = getDayKey(now);
  const oldestKey = addDaysToDayKey(todayKey, -(ACTIVITY_WINDOW_DAYS - 1));
  const byDay = new Map<string, ActivityItem[]>();

  for (const item of items) {
    const key = getDayKey(item.at);
    if (key < oldestKey || key > todayKey) {
      continue;
    }
    const list = byDay.get(key);
    if (list) {
      list.push(item);
    } else {
      byDay.set(key, [item]);
    }
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dayKey, dayItems]) => {
      const itemsSorted = [...dayItems].sort((a, b) =>
        b.at.localeCompare(a.at),
      );
      const counts = emptyCounts();
      for (const item of itemsSorted) {
        counts[item.kind] += 1;
      }
      return { dayKey, items: itemsSorted, counts };
    });
}

export function formatDayHeading(dayKey: string, locale = "en"): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const noon = zonedDateTimeToUtc(year, month, day, 12);
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: ACTIVITY_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).formatToParts(noon);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const monthName = parts.find((part) => part.type === "month")?.value ?? "";
  const dayNum = parts.find((part) => part.type === "day")?.value ?? "";
  if (locale.toLowerCase().startsWith("fr")) {
    return `${weekday} ${dayNum} ${monthName}`;
  }
  return `${weekday} ${monthName} ${dayNum}`;
}

export function formatActivityTime(iso: string, locale = "en"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: ACTIVITY_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function emptyCounts(): Record<ActivityKind, number> {
  return {
    email: 0,
    call: 0,
    meeting: 0,
    note: 0,
    "follow-up": 0,
    other: 0,
  };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
