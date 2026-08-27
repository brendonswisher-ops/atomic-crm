import { Calendar, CheckSquare, Mail, Phone, StickyNote } from "lucide-react";
import {
  useGetList,
  useListContext,
  useRecordContext,
  useTranslate,
} from "ra-core";
import { Fragment } from "react";
import { DateField } from "@/components/admin/date-field";
import { Separator } from "@/components/ui/separator";

import { Note } from "../notes/Note";
import { NoteCreate } from "../notes/NoteCreate";
import { InfinitePagination } from "../misc/InfinitePagination";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { Task } from "../tasks/Task";
import type { Contact, ContactNote, Task as TaskRecord } from "../types";
import { LogActivityBar } from "./LogActivityBar";

type TimelineItem =
  | { kind: "note"; date: string; note: ContactNote }
  | { kind: "task"; date: string; task: TaskRecord };

const taskIcon = (type?: string) => {
  if (type === "call") return Phone;
  if (type === "email") return Mail;
  if (type === "meeting") return Calendar;
  return CheckSquare;
};

export const ContactActivityTimeline = ({
  showStatus,
}: {
  showStatus?: boolean;
}) => {
  const record = useRecordContext<Contact>();
  const translate = useTranslate();
  const { taskTypes } = useConfigurationContext();
  const { data: notes = [], isPending: notesPending } =
    useListContext<ContactNote>();
  const {
    data: tasks = [],
    isPending: tasksPending,
    refetch: refetchTasks,
  } = useGetList<TaskRecord>(
    "tasks",
    {
      filter: { contact_id: record?.id },
      pagination: { page: 1, perPage: 200 },
      sort: { field: "due_date", order: "DESC" },
    },
    { enabled: !!record?.id },
  );

  if (!record) return null;

  const now = Date.now();
  const upcoming = tasks
    .filter(
      (task) =>
        !task.done_date && new Date(task.due_date).getTime() >= now - 60_000,
    )
    .sort(
      (a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    );

  const items: TimelineItem[] = [
    ...notes.map((note) => ({
      kind: "note" as const,
      date: note.date,
      note,
    })),
    ...tasks
      .filter((task) => !!task.done_date)
      .map((task) => ({
        kind: "task" as const,
        date: task.done_date || task.due_date,
        task,
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="mt-4">
      <LogActivityBar onLogged={() => refetchTasks()} />
      <NoteCreate
        reference="contacts"
        showStatus={showStatus}
        className="mt-4"
      />

      {upcoming.length > 0 && (
        <div className="mt-6">
          <h6 className="text-sm font-semibold mb-3">
            {translate("crm.activity.upcoming", { _: "Upcoming" })}
          </h6>
          <div className="space-y-3">
            {upcoming.map((task) => (
              <Task key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h6 className="text-sm font-semibold mb-3">
          {translate("crm.activity.timeline", { _: "Activity" })}
        </h6>
        {notesPending || tasksPending ? null : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {translate("crm.activity.empty", {
              _: "No logged calls, emails, or notes yet.",
            })}
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <Fragment
                key={`${item.kind}-${item.kind === "note" ? item.note.id : item.task.id}`}
              >
                {item.kind === "note" ? (
                  <div className="flex gap-3">
                    <StickyNote className="w-4 h-4 mt-1 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <Note
                        note={item.note}
                        isLast
                        showStatus={showStatus}
                      />
                    </div>
                  </div>
                ) : (
                  <LoggedTask task={item.task} taskTypes={taskTypes} />
                )}
                {index < items.length - 1 && <Separator />}
              </Fragment>
            ))}
          </div>
        )}
      </div>
      <InfinitePagination />
    </div>
  );
};

const LoggedTask = ({
  task,
  taskTypes,
}: {
  task: TaskRecord;
  taskTypes: { value: string; label: string }[];
}) => {
  const Icon = taskIcon(task.type);
  const label =
    taskTypes.find((taskType) => taskType.value === task.type)?.label ||
    task.type;

  return (
    <div className="flex gap-3">
      <Icon className="w-4 h-4 mt-1 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-semibold">{label}</span>
          {task.text ? `: ${task.text}` : ""}
        </div>
        <div className="text-sm text-muted-foreground">
          <DateField source="done_date" record={task} showDate showTime />
        </div>
      </div>
    </div>
  );
};
