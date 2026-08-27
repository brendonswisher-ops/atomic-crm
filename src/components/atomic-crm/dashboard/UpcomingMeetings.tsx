import { Calendar } from "lucide-react";
import {
  RecordRepresentation,
  useGetList,
  useLocaleState,
  useTranslate,
} from "ra-core";
import { Link } from "react-router";
import { ReferenceField } from "@/components/admin/reference-field";
import { Card } from "@/components/ui/card";

import { formatRelativeDate } from "../misc/RelativeDate";
import type { Task } from "../types";

export const UpcomingMeetings = () => {
  const translate = useTranslate();
  const [locale = "en"] = useLocaleState();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data, isPending } = useGetList<Task>("tasks", {
    pagination: { page: 1, perPage: 8 },
    sort: { field: "due_date", order: "ASC" },
    filter: {
      type: "meeting",
      "done_date@is": null,
      "due_date@gte": startOfToday.toISOString(),
    },
  });

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-4 md:mb-2">
        <div className="mr-3 flex">
          <Calendar className="text-muted-foreground w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-muted-foreground">
          {translate("crm.dashboard.upcoming_meetings", {
            _: "Upcoming meetings",
          })}
        </h2>
      </div>
      <Card className="mb-2 py-0">
        {isPending ? (
          <div className="p-4 text-sm text-muted-foreground">
            {translate("crm.common.loading", { _: "Loading..." })}
          </div>
        ) : data?.length ? (
          <ul className="divide-y">
            {data.map((task) => (
              <li key={task.id}>
                <Link
                  to={`/contacts/${task.contact_id}/show`}
                  className="flex justify-between gap-3 px-4 py-3 hover:bg-muted transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {task.text ||
                        translate("crm.dashboard.meeting_fallback", {
                          _: "Meeting",
                        })}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      <ReferenceField
                        record={task}
                        source="contact_id"
                        reference="contacts"
                        link={false}
                      >
                        <RecordRepresentation />
                      </ReferenceField>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelativeDate(task.due_date, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              {translate("crm.dashboard.upcoming_meetings_empty", {
                _: "No upcoming meetings.",
              })}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
