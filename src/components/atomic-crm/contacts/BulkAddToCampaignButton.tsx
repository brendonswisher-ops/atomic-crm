import { Mail } from "lucide-react";
import { useState } from "react";
import {
  useDataProvider,
  useListContext,
  useNotify,
  useRefresh,
  useTranslate,
} from "ra-core";
import { Button } from "@/components/ui/button";

import { STMS_INTRO_CAMPAIGN_NAME } from "../campaigns/consts";
import type { Campaign, CampaignContact, Contact } from "../types";

export function BulkAddToCampaignButton() {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const { selectedIds = [], onUnselectItems } = useListContext<Contact>();
  const [isApplying, setIsApplying] = useState(false);

  if (!selectedIds.length) return null;

  const handleAdd = async () => {
    setIsApplying(true);
    try {
      const { data: campaigns } = await dataProvider.getList<Campaign>(
        "campaigns",
        {
          filter: { name: STMS_INTRO_CAMPAIGN_NAME },
          pagination: { page: 1, perPage: 1 },
          sort: { field: "id", order: "ASC" },
        },
      );
      const campaign = campaigns?.[0];
      if (!campaign) {
        notify("resources.contacts.campaigns.missing", {
          type: "error",
          messageArgs: { _: "STMS intro list was not found" },
        });
        return;
      }

      const { data: existing } = await dataProvider.getList<CampaignContact>(
        "campaign_contacts",
        {
          filter: {
            campaign_id: campaign.id,
            "contact_id@in": `(${selectedIds.join(",")})`,
          },
          pagination: { page: 1, perPage: selectedIds.length || 1 },
          sort: { field: "id", order: "ASC" },
        },
      );
      const alreadyAdded = new Set(
        (existing ?? []).map((row) => String(row.contact_id)),
      );
      const idsToAdd = selectedIds.filter(
        (id) => !alreadyAdded.has(String(id)),
      );

      await Promise.all(
        idsToAdd.map((contactId) =>
          dataProvider.create("campaign_contacts", {
            data: {
              campaign_id: campaign.id,
              contact_id: contactId,
              status: "planned",
            },
          }),
        ),
      );

      notify(
        idsToAdd.length > 0
          ? "resources.contacts.campaigns.added"
          : "resources.contacts.campaigns.already_added",
        {
          type: "success",
          messageArgs: {
            smart_count: idsToAdd.length,
            _:
              idsToAdd.length > 0
                ? `Added ${idsToAdd.length} contact(s) to STMS intro`
                : "Already in STMS intro",
          },
        },
      );
      onUnselectItems();
      refresh();
    } catch (error) {
      notify("resources.contacts.campaigns.error", {
        type: "error",
        messageArgs: { _: "Could not add to STMS intro" },
      });
      console.error("Add to STMS intro failed:", error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9"
      disabled={isApplying}
      onClick={handleAdd}
    >
      <Mail />
      {translate("resources.contacts.campaigns.add_to_stms", {
        _: "Add to STMS intro",
      })}
    </Button>
  );
}
