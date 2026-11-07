-- Blockwise: move existing categories to the "Calm focus" earthy palette.
-- Each old color maps to its closest new one, so categories keep their identity.
-- Run once in Supabase: SQL Editor -> New query -> paste this file -> Run.

update public.categories
set color = case lower(color)
  when '#4f46e5' then '#55609a' -- Indigo -> Slate
  when '#2563eb' then '#3b6c8c' -- Blue   -> Lake
  when '#0369a1' then '#2f6f6a' -- Sky    -> Teal
  when '#0f766e' then '#4f7a55' -- Teal   -> Sage
  when '#15803d' then '#5e6c2c' -- Green  -> Moss
  when '#4d7c0f' then '#76573a' -- Olive  -> Walnut
  when '#b45309' then '#865f12' -- Amber  -> Ochre
  when '#c2410c' then '#a2512f' -- Orange -> Clay
  when '#dc2626' then '#a0485c' -- Red    -> Rose
  when '#be185d' then '#7b4d78' -- Pink   -> Plum
  when '#7e22ce' then '#6c5d9c' -- Purple -> Lavender
  when '#475569' then '#5e5953' -- Slate  -> Stone
  else color
end
where lower(color) in (
  '#4f46e5', '#2563eb', '#0369a1', '#0f766e', '#15803d', '#4d7c0f',
  '#b45309', '#c2410c', '#dc2626', '#be185d', '#7e22ce', '#475569'
);
