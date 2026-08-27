import { CampaignList } from "./CampaignList";
import { CampaignShow } from "./CampaignShow";

export default {
  list: CampaignList,
  show: CampaignShow,
  recordRepresentation: (record: { name?: string }) => record?.name,
};
