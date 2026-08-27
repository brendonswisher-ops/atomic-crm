import { useMemo } from "react";
import {
  useDataProvider,
  useGetList,
  useNotify,
  useRecordContext,
  useRefresh,
  useTranslate,
  useUpdate,
} from "ra-core";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  STMS_INTRO_CAMPAIGN_NAME,
  campaignContactStatuses,
} from "../campaigns/consts";
import type { Campaign, CampaignContact, Contact } from "../types";

export const ContactCampaigns = () => {
  const record = useRecordContext<Contact>();
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const [update] = useUpdate<CampaignContact>();

  const { data: campaigns } = useGetList<Campaign>("campaigns", {
    filter: { name: STMS_INTRO_CAMPAIGN_NAME },
    pagination: { page: 1, perPage: 1 },
    sort: { field: "id", order: "ASC" },
  });
  const campaign = campaigns?.[0];

  const { data: memberships, isPending } = useGetList<CampaignContact>(
    "campaign_contacts",
    {
      filter: {
        contact_id: record?.id,
        campaign_id: campaign?.id,
      },
      pagination: { page: 1, perPage: 1 },
      sort: { field: "id", order: "ASC" },
    },
    { enabled: record?.id != null && campaign?.id != null },
  );
  const membership = memberships?.[0];

  const statusChoices = useMemo(
    () =>
      campaignContactStatuses.map((status) => ({
        ...status,
        name: translate(`resources.campaigns.statuses.${status.id}`, {
          _: status.name,
        }),
      })),
    [translate],
  );

  if (!record) return null;

  const handleAdd = async () => {
    if (!campaign) {
      notify("resources.contacts.campaigns.missing", {
        type: "error",
        messageArgs: { _: "STMS intro list was not found" },
      });
      return;
    }
    try {
      await dataProvider.create("campaign_contacts", {
        data: {
          campaign_id: campaign.id,
          contact_id: record.id,
          status: "planned",
        },
      });
      notify("resources.contacts.campaigns.added", {
        type: "success",
        messageArgs: { _: "Added to STMS intro" },
      });
      refresh();
    } catch (error) {
      notify("resources.contacts.campaigns.error", {
        type: "error",
        messageArgs: { _: "Could not add to STMS intro" },
      });
      console.error("Add to STMS intro failed:", error);
    }
  };

  const handleStatusChange = (status: string) => {
    if (!membership || status === membership.status) return;
    update(
      "campaign_contacts",
      {
        id: membership.id,
        data: { status },
        previousData: membership,
      },
      {
        mutationMode: "optimistic",
        onError: () => {
          notify("resources.contacts.campaigns.error", {
            type: "error",
            messageArgs: { _: "Could not update outreach status" },
          });
        },
      },
    );
  };

  if (isPending && campaign) return null;

  if (!membership) {
    return (
      <div className="flex flex-col gap-2 items-start">
        <p className="text-muted-foreground">
          {translate("resources.contacts.campaigns.not_in", {
            _: "Not in STMS intro",
          })}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleAdd}
        >
          {translate("resources.contacts.campaigns.add", { _: "Add" })}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p>
        {translate("resources.contacts.campaigns.in_list", {
          _: "In STMS intro",
        })}
      </p>
      <Select value={membership.status} onValueChange={handleStatusChange}>
        <SelectTrigger size="sm" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusChoices.map((status) => (
            <SelectItem key={status.id} value={status.id}>
              {status.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
