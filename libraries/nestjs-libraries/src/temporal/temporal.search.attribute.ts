import {
  defineSearchAttributeKey,
  SearchAttributeType,
} from '@temporalio/common';

// ROAM: These are exact-match IDs, so KEYWORD is the correct type (TEXT is
// tokenized full-text search — wrong for IDs). It also sidesteps a hard limit
// in Temporal's SQL (Postgres) visibility store: at most 3 custom search
// attributes of type Text. The auto-setup image pre-registers its legacy
// CustomTextField/CustomStringField (Text), so adding these two as Text pushes
// past 3 and Temporal rejects the whole batch — leaving postId unmapped and
// every publish workflow failing with "no mapping defined for search attribute
// postId". KEYWORD has far more slots (~10), so registration succeeds.
export const organizationId = defineSearchAttributeKey(
  'organizationId',
  SearchAttributeType.KEYWORD
);

export const postId = defineSearchAttributeKey(
  'postId',
  SearchAttributeType.KEYWORD
);
