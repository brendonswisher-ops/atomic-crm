import { CalendarDays } from "lucide-react";
import { useMemo } from "react";
import {
  RecordRepresentation,
  useGetList,
  useLocaleState,
  useTranslate,
} from "ra-core";
import { Link } from "react-router";
import { ReferenceField } from "@/components/admin/reference-field";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { ContactNote, Task } from "../types";
import type { ActivityKind } from "./activityByDay";
import {
  ACTIVITY_KIND_ORDER,
  activityItemsFromNotes,
  activityItemsFromTasks,
  formatActivityTime,
  formatDayHeading,
  getActivityWindowStart,
  groupActivityByDay,
  i18nKindKey,
  mergeTasks,
} from "./activityByDay";

const KIND_BADGE_CLASS: Record<ActivityKind, string> = {
  email:
    "border-[#D4AF37] bg-[#D4AF37]/15 text-[#0A1428] dark:text-[#D4AF37]",
  call: "border-[#0A1428] bg-[#0A1428] text-white dark:border-[#D4AF37]/40",
  meeting: "border-[#0A1428] bg-[#0A1428] text-[#D4AF37]",
  note: "border-border bg-muted text-muted-foreground",
  "follow-up":
    "border-[#0A1428]/30 bg-[#0A1428]/5 text-[#0A1428] dark:text-foreground",
  other: "border-border bg-secondary text-secondary-foreground",
};

export const ActivityByDay = () => {
  const translate = useTranslate();
  const [locale = "en"] = useLocaleState();
  const windowStartIso = useMemo(
    () => getActivityWindowStart().toISOString(),
    [],
  );

  const {
    data: notes,
    isPending: notesPending,
    error: notesError,
  } = useGetList<ContactNote>("contact_notes", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "date", order: "DESC" },
    filter: { "date@gte": windowStartIso },
  });

  const {
    data: dueTasks,
    isPending: duePending,
    error: dueError,
  } = useGetList<Task>("tasks", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "due_date", order: "DESC" },
    filter: { "due_date@gte": windowStartIso },
  });

  const {
    data: doneTasks,
    isPending: donePending,
    error: doneError,
  } = useGetList<Task>("tasks", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "done_date", order: "DESC" },
    filter: { "done_date@gte": windowStartIso },
  });

  const groups = useMemo(
    () =>
      groupActivityByDay([
        ...activityItemsFromNotes(notes),
        ...activityItemsFromTasks(mergeTasks(dueTasks, doneTasks)),
      ]),
    [notes, dueTasks, doneTasks],
  );

  const isPending = notesPending || duePending || donePending;
  const hasError = Boolean(notesError || dueError || doneError);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center">
        <div className="mr-3 flex">
          <CalendarDays className="text-muted-foreground w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-muted-foreground">
          {translate("crm.dashboard.activity_by_day", {
            _: "Activity by day",
          })}
        </h2>
      </div>
      <Card className="py-0 overflow-hidden">
        {isPending ? (
          <div className="p-4 text-sm text-muted-foreground">
            {translate("crm.common.loading", { _: "Loading..." })}
          </div>
        ) : hasError ? (
          <div className="p-4 text-sm text-muted-foreground">
            {translate("crm.dashboard.activity_by_day_error", {
              _: "Could not load activity.",
            })}
          </div>
        ) : groups.length ? (
          <div className="divide-y">
            {groups.map((group) => (
              <section key={group.dayKey} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pb-2">
                  <h3 className="text-sm font-semibold text-[#0A1428] dark:text-foreground">
                    {formatDayHeading(group.dayKey, locale)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {formatCounts(group.counts, translate)}
                  </p>
                </div>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <div className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors">
                        <Badge
                          variant="outline"
                          className={cn(
                            "uppercase tracking-wide text-[10px] justify-center",
                            KIND_BADGE_CLASS[item.kind],
                          )}
                        >
                          {translate(
                            `crm.dashboard.activity_kind.${i18nKindKey(item.kind)}`,
                            { _: item.kind },
                          )}
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums w-16 shrink-0">
                          {formatActivityTime(item.at, locale)}
                        </span>
                        <Link
                          to={`/contacts/${item.contact_id}/show`}
                          className="text-sm font-medium truncate hover:underline shrink-0 max-w-[40%]"
                        >
                          <ReferenceField
                            record={item}
                            source="contact_id"
                            reference="contacts"
                            link={false}
                          >
                            <RecordRepresentation />
                          </ReferenceField>
                        </Link>
                        <span className="text-sm text-muted-foreground truncate min-w-0">
                          {item.subject}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              {translate("crm.dashboard.activity_by_day_empty", {
                _: "No emails, calls, meetings, or notes in the last 14 days.",
              })}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

function formatCounts(
  counts: Record<ActivityKind, number>,
  translate: ReturnType<typeof useTranslate>,
): string {
  return ACTIVITY_KIND_ORDER.filter((kind) => counts[kind] > 0)
    .map((kind) =>
      translate(`crm.dashboard.activity_count.${i18nKindKey(kind)}`, {
        smart_count: counts[kind],
        _: `${counts[kind]} ${kind}${counts[kind] === 1 ? "" : "s"}`,
      }),
    )
    .join(", ");
}
