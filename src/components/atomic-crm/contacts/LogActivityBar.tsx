import { Calendar, Mail, Phone } from "lucide-react";
import {
  CreateBase,
  Form,
  required,
  useDataProvider,
  useGetIdentity,
  useNotify,
  useRecordContext,
  useTranslate,
  useUpdate,
} from "ra-core";
import { useState } from "react";
import { SaveButton } from "@/components/admin/form";
import { DateTimeInput } from "@/components/admin";
import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Contact } from "../types";

type ActivityKind = "call" | "email" | "meeting";

const KINDS: Record<
  ActivityKind,
  {
    label: string;
    title: string;
    type: string;
    done: boolean;
    whenLabel: string;
  }
> = {
  call: {
    label: "Log call",
    title: "Log a call",
    type: "call",
    done: true,
    whenLabel: "When",
  },
  email: {
    label: "Log email",
    title: "Log an email",
    type: "email",
    done: true,
    whenLabel: "When",
  },
  meeting: {
    label: "Schedule meeting",
    title: "Schedule a meeting",
    type: "meeting",
    done: false,
    whenLabel: "Meeting time",
  },
};

export const LogActivityBar = ({ onLogged }: { onLogged?: () => void }) => {
  const { identity } = useGetIdentity();
  const contact = useRecordContext<Contact>();
  const dataProvider = useDataProvider();
  const [update] = useUpdate();
  const notify = useNotify();
  const translate = useTranslate();
  const [kind, setKind] = useState<ActivityKind | null>(null);

  if (!identity || !contact) return null;

  const config = kind ? KINDS[kind] : null;
  const now = new Date().toISOString();

  const handleSuccess = async (data: { contact_id: number }) => {
    setKind(null);
    const latest = await dataProvider.getOne("contacts", {
      id: data.contact_id,
    });
    if (latest.data) {
      await update("contacts", {
        id: latest.data.id,
        data: { last_seen: new Date().toISOString() },
        previousData: latest.data,
      });
    }
    notify("resources.tasks.added", {
      messageArgs: { _: config?.title ? `${config.title} saved` : "Saved" },
    });
    onLogged?.();
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer"
          onClick={() => setKind("call")}
        >
          <Phone className="w-4 h-4" />
          {translate("crm.activity.log_call", { _: "Log call" })}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer"
          onClick={() => setKind("email")}
        >
          <Mail className="w-4 h-4" />
          {translate("crm.activity.log_email", { _: "Log email" })}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer"
          onClick={() => setKind("meeting")}
        >
          <Calendar className="w-4 h-4" />
          {translate("crm.activity.schedule_meeting", {
            _: "Schedule meeting",
          })}
        </Button>
      </div>

      {config && (
        <CreateBase
          key={kind}
          resource="tasks"
          record={{
            type: config.type,
            contact_id: contact.id,
            due_date: now,
            sales_id: identity.id,
            done_date: config.done ? now : null,
          }}
          mutationOptions={{ onSuccess: handleSuccess }}
        >
          <Dialog open={!!kind} onOpenChange={(open) => !open && setKind(null)}>
            <DialogContent className="lg:max-w-xl overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
              <Form className="flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle>{config.title}</DialogTitle>
                </DialogHeader>
                <TextInput
                  autoFocus
                  source="text"
                  label={translate("resources.tasks.fields.text", {
                    _: "Notes",
                  })}
                  validate={required()}
                  multiline
                  helperText={false}
                />
                <DateTimeInput
                  source="due_date"
                  label={config.whenLabel}
                  helperText={false}
                  validate={required()}
                />
                <DialogFooter className="w-full justify-end">
                  <SaveButton
                    transform={(values) => ({
                      ...values,
                      type: config.type,
                      done_date: config.done
                        ? values.due_date || now
                        : null,
                    })}
                  />
                </DialogFooter>
              </Form>
            </DialogContent>
          </Dialog>
        </CreateBase>
      )}
    </>
  );
};
