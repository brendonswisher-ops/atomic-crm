import {
  RecordRepresentation,
  ShowBase,
  useListContext,
  useShowContext,
  useTranslate,
} from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { TextField } from "@/components/admin/text-field";
import { Card, CardContent } from "@/components/ui/card";

import type { Campaign, CampaignContact } from "../types";
import { campaignContactStatuses } from "./consts";

const statusLabel = (status?: string) =>
  campaignContactStatuses.find((item) => item.id === status)?.name ?? status;

export const CampaignShow = () => (
  <ShowBase>
    <CampaignShowContent />
  </ShowBase>
);

const CampaignShowContent = () => {
  const translate = useTranslate();
  const { record, isPending } = useShowContext<Campaign>();
  if (isPending || !record) return null;

  return (
    <div className="mt-2 mb-2 flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold">{record.name}</h2>
        {record.description ? (
          <p className="text-sm text-muted-foreground mt-1">
            {record.description}
          </p>
        ) : null}
      </div>
      <Card>
        <CardContent>
          <h3 className="text-base font-medium mb-3">
            {translate("resources.campaigns.fields.members", {
              _: "Members",
            })}
          </h3>
          <ReferenceManyField
            reference="campaign_contacts"
            target="campaign_id"
            sort={{ field: "created_at", order: "ASC" }}
            perPage={100}
          >
            <CampaignMemberList />
          </ReferenceManyField>
        </CardContent>
      </Card>
    </div>
  );
};

const CampaignMemberList = () => {
  const translate = useTranslate();
  const { data, isPending } = useListContext<CampaignContact>();
  if (isPending) return null;
  if (!data?.length) {
    return (
      <p className="text-sm text-muted-foreground py-3">
        {translate("resources.campaigns.empty.members", {
          _: "No contacts in this list yet.",
        })}
      </p>
    );
  }

  return (
    <div className="divide-y">
      {data.map((row) => (
        <div
          key={row.id}
          className="flex items-center justify-between py-2 text-sm"
        >
          <div className="min-w-0">
            <ReferenceField
              source="contact_id"
              reference="contacts"
              record={row}
              link="show"
            >
              <RecordRepresentation />
            </ReferenceField>
            <div className="text-muted-foreground">
              <ReferenceField
                source="contact_id"
                reference="contacts"
                record={row}
                link={false}
              >
                <TextField source="company_name" />
              </ReferenceField>
            </div>
          </div>
          <span className="text-muted-foreground shrink-0 ml-4">
            {statusLabel(row.status)}
          </span>
        </div>
      ))}
    </div>
  );
};
