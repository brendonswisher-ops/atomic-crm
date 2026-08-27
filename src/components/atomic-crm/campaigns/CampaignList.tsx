import { useTranslate } from "ra-core";
import { DataTable } from "@/components/admin/data-table";
import { List } from "@/components/admin/list";
import { ReferenceManyCount } from "@/components/admin/reference-many-count";
import { TextField } from "@/components/admin/text-field";

import type { Campaign } from "../types";

export const CampaignList = () => {
  const translate = useTranslate();

  return (
    <List
      sort={{ field: "created_at", order: "DESC" }}
      title={translate("resources.campaigns.name", {
        smart_count: 2,
        _: "Outreach",
      })}
    >
      <DataTable<Campaign> rowClick="show" bulkActionButtons={false}>
        <DataTable.Col source="name" />
        <DataTable.Col
          source="status"
          label={translate("resources.campaigns.fields.status", {
            _: "Status",
          })}
        />
        <DataTable.Col
          label={translate("resources.campaigns.fields.members", {
            _: "Members",
          })}
          disableSort
        >
          <ReferenceManyCount
            reference="campaign_contacts"
            target="campaign_id"
          />
        </DataTable.Col>
        <DataTable.Col
          source="description"
          label={translate("resources.campaigns.fields.description", {
            _: "Description",
          })}
        >
          <TextField source="description" />
        </DataTable.Col>
      </DataTable>
    </List>
  );
};
