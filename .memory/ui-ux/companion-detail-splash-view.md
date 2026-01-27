# Memory: ui-ux/companion-detail-splash-view
Updated: now

The 'CompanionDetailSplash' component provides a full-screen modal view for companion details, replacing the buggy inline expansion in the party panel. It features:
- Large portrait display with relationship health border
- Collapsible sections: Stats, Personality, Goals, Grievances, Reactions, Thoughts
- Vertical scroll for all content
- Action bar with Talk, Enter Scene, Journal, and Dismiss buttons
- Proper z-index layering (z-[70]) above the panel modal

Active and waiting companions in the panel now use `CompanionCardSimple`, a clickable card that opens the detail splash instead of inline expansion.
