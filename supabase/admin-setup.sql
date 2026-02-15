-- Set one user as admin (replace with real UUID)
update public.profiles
set role = 'admin'
where id = '00000000-0000-0000-0000-000000000000';

-- Verify
select id, full_name, role, created_at
from public.profiles
order by created_at desc;
