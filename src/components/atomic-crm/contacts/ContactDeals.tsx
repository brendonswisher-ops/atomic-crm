import { Briefcase, Plus } from "lucide-react";
import { useGetList, useRecordContext, useTranslate } from "ra-core";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

import { findDealLabel } from "../deals/dealUtils";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Contact, Deal } from "../types";

export const ContactDeals = () => {
  const record = useRecordContext<Contact>();
  const translate = useTranslate();
  const { dealStages } = useConfigurationContext();
  const { data: deals, isPending } = useGetList<Deal>(
    "deals",
    {
      pagination: { page: 1, perPage: 50 },
      sort: { field: "updated_at", order: "DESC" },
      filter: {
        "contact_ids@cs": `{${record?.id}}`,
        "archived_at@is": null,
      },
    },
    { enabled: record?.id != null },
  );

  if (!record) return null;

  return (
    <div className="flex flex-col gap-2">
      {isPending ? null : deals?.length ? (
        deals.map((deal) => (
          <Link
            key={deal.id}
            to={`/deals/${deal.id}/show`}
            className="flex items-start gap-2 hover:bg-muted rounded-md px-1 py-1 -mx-1 transition-colors"
          >
            <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="font-medium leading-5">{deal.name}</div>
              <div className="text-muted-foreground">
                {findDealLabel(dealStages, deal.stage) ?? deal.stage}
              </div>
            </div>
          </Link>
        ))
      ) : (
        <p className="text-muted-foreground">
          {translate("resources.contacts.deals.empty", {
            _: "No deals yet",
          })}
        </p>
      )}
      <Button variant="outline" size="sm" className="h-8 w-fit mt-1" asChild>
        <Link to={`/deals/create?contact_id=${record.id}`}>
          <Plus className="h-4 w-4" />
          {translate("resources.contacts.deals.add", { _: "New deal" })}
        </Link>
      </Button>
    </div>
  );
};
