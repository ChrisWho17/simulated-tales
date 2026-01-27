# Memory: features/companion-management/campaign-isolation
Updated: now

Companions are locked to a single campaign via a `campaignId` field on `CompanionState`. The `CompanionSystemManager` maintains an `activeCampaignId` that is set when a campaign is loaded via `setActiveCampaign()`. New companions are automatically assigned the active campaign ID on creation. The `getAllCompanions()` method filters by active campaign, ensuring companions from one campaign don't appear in another.
