-- One clearly labeled demonstration community. Fixed id so setup docs, tests and the browser can refer to it.
insert into public.communities (id, title, description, is_demo)
values (
  'b10c0000-0000-4000-8000-000000000001',
  'Ward 8 neighbors (demonstration)',
  'A demonstration community for Block Ops. Join with any display name to talk with other neighbors about dumping and other concerns on your block. Guest accounts here are not verified residents, and nothing here is an official DC channel.',
  true
) on conflict (id) do nothing;
