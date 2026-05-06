-- Reset content-related data for clean re-import (keeps users/profiles).
-- Run in Supabase SQL Editor.

begin;

-- End live gatherings first to avoid dangling references.
update public.gatherings
set is_live = false,
    ended_at = coalesce(ended_at, now());

-- Remove dependent rows first (FK-safe).
delete from public.gathering_participants;
delete from public.gatherings;
delete from public.watch_history;
delete from public.watchlist;
delete from public.content;

commit;

-- Optional verification
-- select
--   (select count(*) from public.content) as content_count,
--   (select count(*) from public.watch_history) as history_count,
--   (select count(*) from public.watchlist) as watchlist_count,
--   (select count(*) from public.gatherings) as gatherings_count,
--   (select count(*) from public.gathering_participants) as participants_count;
