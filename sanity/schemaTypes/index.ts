import {
  campaignType,
} from "./campaign";

import {
  localePortableTextType,
  localeStringType,
  localeTextType,
} from "./localeCampaignContent";

export const schema = {
  types: [
    campaignType,

    localeStringType,
    localeTextType,
    localePortableTextType,
  ],
};