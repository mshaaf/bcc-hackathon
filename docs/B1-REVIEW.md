# B1 independent review — required repairs

Reviewed October 21, 2026, at code commit `f36867b` (backend `d52adb2`). The local shared community works on the existing happy-path checks, but the following defects remain open. Implement the repairs as part of the B2 assignment, not a set of separate hand-back tasks. No repair is claimed complete in this document.

## Evidence and scope

Independent default suite: **97 passed, 0 failed, 13 skipped**; explicitly enabled local backend suite: **13 passed, 0 failed, 0 skipped**, with 439 ms measured Realtime delivery after a warm-up post. Extra tests used throwaway local communities/accounts and left existing community data alone. The actual send function was also exercised with a controlled pending promise. [Recorded evidence](workflow/b1-independent-review.json).

The full browser driver was not rerun in that review. Fresh join-preview inspection and two independent UI passes supplemented Sonnet's stored 51-check browser evidence. No hosted project, real phone or venue network was tested.

## 1 — Newer unsent text disappears after a successful send

[UI send handler](../public/community.mjs), around lines 199–225: the textarea remains editable while a request is pending, but success unconditionally clears its draft. Send one message, type the next while waiting, then resolve the first request: the new unsent text disappears. The controlled execution reproduced this.

Preserve edits made after the submitted draft was captured. A completion after navigation must not clear another community's draft. Cover new posts, replies and edits with delayed-success/navigation regression checks. This is a data-loss repair, not a styling refactor.

## 2 — Membership deletion events expose metadata to non-members

[Publication](../supabase/migrations/20261021120000_community_posts.sql), line 212, and [subscription](../public/community-api.mjs), around line 50: an authenticated outsider subscribed directly to membership DELETE events and received test community/user identifiers after a departure. Normal SELECT still denied reads; the probe did not reveal post bodies.

Protect the actual publication/event design, not merely the UI callback. Membership changes already bump `communities.activity_at`; use an authorized refetch signal without exposing the unnecessary membership DELETE stream. Test outsiders against membership departure and other published DELETE paths. The existing outsider test only checks new posts. [Supabase's documented DELETE limitation](https://supabase.com/docs/guides/realtime/postgres-changes#receiving-old-records).

## 3 — Old operation replay bypasses the membership check

[`create_post`](../supabase/migrations/20261021120000_community_posts.sql), around lines 145–151: it returns an existing operation before checking current membership. Join, send operation X, leave, replay X: the old post returns even though normal reads return no rows. This was reproduced against the local backend.

Authorize before returning an old result and validate the operation's community binding. Keep legitimate retries idempotent. Add leave-then-retry and cross-community operation reuse tests; reject unauthorized replay rather than treating the display name as authority.

## 4 — The main composer loses its visible label association

[`renderComposer`](../public/community.mjs), around line 436: `formField` creates a label targeting `field-new`, then only the textarea ID changes to `composer-body`. Preserve a matching label/field pair and test the actual rendered association.

Also repair the small adjacent accessibility defects: selected navigation needs `aria-current="page"`, connection/new-post updates need concise announcements, and cancelling Reply/Edit should restore focus to its trigger. These fit the existing app design.

## What this review does not establish

There is no demonstrated rate-limit bypass: the extra rate probe accepted 19 initial posts plus one concurrent post by that user, totaling the configured 20. Its community-wide count of 21 included another author's earlier post. Do not report that count as a vulnerability. No security fix, mission implementation or public readiness is claimed from this documentation batch.
