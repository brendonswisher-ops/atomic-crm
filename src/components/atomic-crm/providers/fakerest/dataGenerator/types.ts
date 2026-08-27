import type {
  Campaign,
  CampaignContact,
  Company,
  Contact,
  ContactNote,
  Deal,
  DealNote,
  Sale,
  Tag,
  Task,
} from "../../../types";
import type { ConfigurationContextValue } from "../../../root/ConfigurationContext";

export interface Db {
  companies: Company[];
  contacts: Contact[];
  contact_notes: ContactNote[];
  deals: Deal[];
  deal_notes: DealNote[];
  sales: Sale[];
  tags: Tag[];
  tasks: Task[];
  campaigns: Campaign[];
  campaign_contacts: CampaignContact[];
  configuration: Array<{ id: number; config: ConfigurationContextValue }>;
}
