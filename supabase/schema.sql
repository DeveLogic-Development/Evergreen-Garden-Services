-- Evergreen Garden Services schema bootstrap
-- Run this file in the Supabase SQL editor.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'user_role'
  ) then
    create type public.user_role as enum ('customer', 'admin');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'monthly_plan_status'
  ) then
    create type public.monthly_plan_status as enum ('draft', 'quoted', 'active', 'paused', 'cancelled', 'completed');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'monthly_plan_request_status'
  ) then
    create type public.monthly_plan_request_status as enum ('requested', 'contacted', 'quoted', 'closed');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'booking_status'
  ) then
    create type public.booking_status as enum ('requested', 'confirmed', 'completed', 'cancelled');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'quote_status'
  ) then
    create type public.quote_status as enum ('draft', 'sent', 'accepted', 'declined', 'expired');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'invoice_status'
  ) then
    create type public.invoice_status as enum ('draft', 'sent', 'overdue', 'paid', 'void');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'payment_method'
  ) then
    create type public.payment_method as enum ('eft', 'cash', 'card', 'other');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id bigserial primary key,
  name text not null,
  default_duration_minutes integer not null default 120,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  service_id bigint not null references public.services(id),
  requested_datetime timestamptz not null,
  confirmed_datetime timestamptz,
  address text not null,
  notes text,
  status public.booking_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  status public.quote_status not null default 'draft',
  valid_until date not null,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  vat_rate numeric(6, 4) not null default 0.15 check (vat_rate >= 0 and vat_rate <= 1),
  vat_amount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  description text not null,
  qty numeric(12, 2) not null check (qty > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  status public.invoice_status not null default 'draft',
  issue_date date not null,
  due_date date not null,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  vat_rate numeric(6, 4) not null default 0.15 check (vat_rate >= 0 and vat_rate <= 1),
  vat_amount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null check (total >= 0),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  qty numeric(12, 2) not null check (qty > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  method public.payment_method not null default 'eft',
  amount numeric(12, 2) not null check (amount >= 0),
  reference text,
  proof_file_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id integer primary key check (id = 1),
  business_name text not null,
  reg_number text,
  vat_registered boolean not null default true,
  vat_number text,
  vat_rate numeric(6, 4) not null default 0.15,
  address text not null,
  banking_details text not null,
  next_quote_number integer not null default 1,
  next_invoice_number integer not null default 1,
  service_areas text[] not null default array[
    'Hartenbos',
    'Hartenbos Heuwels',
    'Hartenbosrif',
    'Bayview',
    'Menkenkop',
    'Voorbaai',
    'De Bakke',
    'Heiderand',
    'Aalwyndal',
    'D''Almeida',
    'Mossel Bay Central',
    'Diaz Beach',
    'Dana Bay',
    'Tergniet',
    'Reebok',
    'Fraai Uitsig',
    'Klein Brak River',
    'Great Brak River',
    'Outeniqua Strand',
    'Glentana'
  ],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.settings
add column if not exists service_areas text[] not null default array[
  'Hartenbos',
  'Hartenbos Heuwels',
  'Hartenbosrif',
  'Bayview',
  'Menkenkop',
  'Voorbaai',
  'De Bakke',
  'Heiderand',
  'Aalwyndal',
  'D''Almeida',
  'Mossel Bay Central',
  'Diaz Beach',
  'Dana Bay',
  'Tergniet',
  'Reebok',
  'Fraai Uitsig',
  'Klein Brak River',
  'Great Brak River',
  'Outeniqua Strand',
  'Glentana'
];

create table if not exists public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  anchor_booking_id uuid not null references public.bookings(id) on delete cascade,
  quote_id uuid unique references public.quotes(id) on delete set null,
  title text not null,
  address text not null,
  start_date date not null,
  end_date date,
  vat_rate numeric(6, 4) not null default 0.15 check (vat_rate >= 0 and vat_rate <= 1),
  status public.monthly_plan_status not null default 'draft',
  activated_at timestamptz,
  paused_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monthly_plan_schedule (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.monthly_plans(id) on delete cascade,
  service_id bigint not null references public.services(id),
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  duration_minutes integer not null check (duration_minutes > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  unique (plan_id, day_of_week, start_time)
);

create table if not exists public.monthly_plan_occurrences (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.monthly_plans(id) on delete cascade,
  schedule_id uuid not null references public.monthly_plan_schedule(id) on delete cascade,
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  occurrence_date date not null,
  created_at timestamptz not null default now(),
  unique (plan_id, schedule_id, occurrence_date)
);

create table if not exists public.monthly_plan_invoices (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.monthly_plans(id) on delete cascade,
  invoice_id uuid not null unique references public.invoices(id) on delete cascade,
  billing_month date not null,
  created_at timestamptz not null default now(),
  unique (plan_id, billing_month)
);

create table if not exists public.monthly_plan_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  address text not null,
  preferred_start_date date,
  frequency_per_week integer not null default 1 check (frequency_per_week between 1 and 7),
  notes text,
  status public.monthly_plan_request_status not null default 'requested',
  admin_notes text,
  contacted_at timestamptz,
  quoted_plan_id uuid references public.monthly_plans(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_bookings_customer_id on public.bookings(customer_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_requested_datetime on public.bookings(requested_datetime);
create index if not exists idx_quotes_customer_id on public.quotes(customer_id);
create index if not exists idx_quotes_status on public.quotes(status);
create index if not exists idx_invoices_customer_id on public.invoices(customer_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_payments_invoice_id on public.payments(invoice_id);
create index if not exists idx_monthly_plans_customer_id on public.monthly_plans(customer_id);
create index if not exists idx_monthly_plans_status on public.monthly_plans(status);
create index if not exists idx_monthly_plan_schedule_plan_id on public.monthly_plan_schedule(plan_id);
create index if not exists idx_monthly_plan_occurrences_plan_id on public.monthly_plan_occurrences(plan_id);
create index if not exists idx_monthly_plan_occurrences_booking_id on public.monthly_plan_occurrences(booking_id);
create index if not exists idx_monthly_plan_invoices_plan_id on public.monthly_plan_invoices(plan_id);
create index if not exists idx_monthly_plan_requests_customer_id on public.monthly_plan_requests(customer_id);
create index if not exists idx_monthly_plan_requests_status on public.monthly_plan_requests(status);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'customer')
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow privileged database roles (SQL editor/service context) to manage roles.
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.role = 'customer';
    elsif tg_op = 'UPDATE' and new.role is distinct from old.role then
      raise exception 'Only admins can change role';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.prevent_booking_slot_overlap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.confirmed_datetime is null or new.status = 'cancelled' then
    return new;
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and b.status in ('requested', 'confirmed', 'completed')
      and b.confirmed_datetime = new.confirmed_datetime
  ) then
    raise exception 'Booking slot is already reserved for %', new.confirmed_datetime;
  end if;

  return new;
end;
$$;

create or replace function public.create_monthly_plan_with_quote(
  p_customer_id uuid,
  p_title text,
  p_address text,
  p_start_date date,
  p_end_date date default null,
  p_valid_until date default current_date + 7,
  p_vat_rate numeric default 0.15,
  p_schedule jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_id uuid;
  created_quote_id uuid;
  quote_number text;
  anchor_booking_id uuid;
  month_start date;
  month_end date;
  subtotal_amount numeric(12, 2) := 0;
  vat_amount numeric(12, 2);
  total_amount numeric(12, 2);
  item jsonb;
  first_item jsonb;
  line_service_id bigint;
  line_day_of_week integer;
  line_start_time time;
  line_duration integer;
  line_unit_price numeric(12, 2);
  line_description text;
  line_occurrences integer;
  line_total numeric(12, 2);
  service_name text;
  line_slot public.monthly_plan_schedule%rowtype;
  validation_date date;
  validation_slot_ts timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Only admins can create monthly plans';
  end if;

  if p_schedule is null or jsonb_typeof(p_schedule) <> 'array' or jsonb_array_length(p_schedule) = 0 then
    raise exception 'Monthly plan requires at least one schedule slot';
  end if;

  if p_end_date is not null and p_end_date < p_start_date then
    raise exception 'End date cannot be before start date';
  end if;

  first_item := (select value from jsonb_array_elements(p_schedule) value limit 1);
  line_service_id := coalesce((first_item ->> 'service_id')::bigint, null);
  line_start_time := coalesce((first_item ->> 'start_time')::time, null);
  if line_service_id is null or line_start_time is null then
    raise exception 'Each schedule slot needs service_id and start_time';
  end if;

  insert into public.bookings (
    customer_id,
    service_id,
    requested_datetime,
    address,
    notes,
    status
  )
  values (
    p_customer_id,
    line_service_id,
    ((p_start_date::text || ' ' || line_start_time::text)::timestamp at time zone 'Africa/Johannesburg'),
    p_address,
    'Monthly plan anchor booking',
    'requested'
  )
  returning id into anchor_booking_id;

  insert into public.monthly_plans (
    customer_id,
    anchor_booking_id,
    title,
    address,
    start_date,
    end_date,
    vat_rate,
    status
  )
  values (
    p_customer_id,
    anchor_booking_id,
    p_title,
    p_address,
    p_start_date,
    p_end_date,
    coalesce(p_vat_rate, 0),
    'draft'
  )
  returning id into plan_id;

  month_start := date_trunc('month', p_start_date)::date;
  month_end := (month_start + interval '1 month - 1 day')::date;

  for item in select * from jsonb_array_elements(p_schedule)
  loop
    line_service_id := coalesce((item ->> 'service_id')::bigint, null);
    line_day_of_week := coalesce((item ->> 'day_of_week')::integer, null);
    line_start_time := coalesce((item ->> 'start_time')::time, null);
    line_duration := coalesce((item ->> 'duration_minutes')::integer, 120);
    line_unit_price := round(coalesce((item ->> 'unit_price')::numeric, 0), 2);

    if line_service_id is null or line_day_of_week is null or line_start_time is null then
      raise exception 'Each schedule slot requires service_id, day_of_week, and start_time';
    end if;
    if line_day_of_week < 0 or line_day_of_week > 6 then
      raise exception 'day_of_week must be between 0 and 6';
    end if;
    if line_duration <= 0 then
      raise exception 'duration_minutes must be greater than 0';
    end if;
    if line_unit_price < 0 then
      raise exception 'unit_price must be greater than or equal to 0';
    end if;

    validation_date := month_start;
    while validation_date <= month_end loop
      if extract(dow from validation_date)::integer = line_day_of_week
         and validation_date >= p_start_date
         and (p_end_date is null or validation_date <= p_end_date) then
        validation_slot_ts := ((validation_date::text || ' ' || line_start_time::text)::timestamp at time zone 'Africa/Johannesburg');
        if exists (
          select 1
          from public.bookings b
          where b.status in ('requested', 'confirmed', 'completed')
            and b.confirmed_datetime = validation_slot_ts
        ) then
          raise exception 'Schedule conflict detected at %', validation_slot_ts;
        end if;
      end if;
      validation_date := validation_date + 1;
    end loop;

    insert into public.monthly_plan_schedule (
      plan_id,
      service_id,
      day_of_week,
      start_time,
      duration_minutes,
      unit_price
    )
    values (
      plan_id,
      line_service_id,
      line_day_of_week,
      line_start_time,
      line_duration,
      line_unit_price
    );
  end loop;

  for line_slot in
    select *
    from public.monthly_plan_schedule s
    where s.plan_id = plan_id
    order by s.day_of_week, s.start_time
  loop
    select s.name into service_name
    from public.services s
    where s.id = line_slot.service_id;

    select count(*)::integer into line_occurrences
    from generate_series(month_start, month_end, interval '1 day') d
    where extract(dow from d)::integer = line_slot.day_of_week
      and d::date >= p_start_date
      and (p_end_date is null or d::date <= p_end_date);

    if line_occurrences <= 0 then
      continue;
    end if;

    line_total := round(line_occurrences * line_slot.unit_price, 2);
    subtotal_amount := subtotal_amount + line_total;

    line_description := coalesce(service_name, 'Service') || ' - ' || line_slot.start_time::text || ' weekly';
  end loop;

  if subtotal_amount <= 0 then
    raise exception 'Monthly plan quote total must be greater than zero';
  end if;

  vat_amount := round(subtotal_amount * coalesce(p_vat_rate, 0), 2);
  total_amount := subtotal_amount + vat_amount;
  quote_number := public.allocate_quote_number();

  insert into public.quotes (
    quote_number,
    customer_id,
    booking_id,
    status,
    valid_until,
    subtotal,
    vat_rate,
    vat_amount,
    total
  )
  values (
    quote_number,
    p_customer_id,
    anchor_booking_id,
    'sent',
    p_valid_until,
    subtotal_amount,
    coalesce(p_vat_rate, 0),
    vat_amount,
    total_amount
  )
  returning id into created_quote_id;

  for line_slot in
    select *
    from public.monthly_plan_schedule s
    where s.plan_id = plan_id
    order by s.day_of_week, s.start_time
  loop
    select s.name into service_name
    from public.services s
    where s.id = line_slot.service_id;

    select count(*)::integer into line_occurrences
    from generate_series(month_start, month_end, interval '1 day') d
    where extract(dow from d)::integer = line_slot.day_of_week
      and d::date >= p_start_date
      and (p_end_date is null or d::date <= p_end_date);

    if line_occurrences <= 0 then
      continue;
    end if;

    line_total := round(line_occurrences * line_slot.unit_price, 2);
    line_description := coalesce(service_name, 'Service') || ' - ' || line_slot.start_time::text || ' weekly';

    insert into public.quote_items (quote_id, description, qty, unit_price, line_total)
    values (
      created_quote_id,
      line_description,
      line_occurrences,
      line_slot.unit_price,
      line_total
    );
  end loop;

  update public.monthly_plans
  set quote_id = created_quote_id,
      status = 'quoted',
      updated_at = now()
  where id = plan_id;

  return plan_id;
end;
$$;

create or replace function public.create_monthly_plan_request(
  p_title text,
  p_address text,
  p_preferred_start_date date default null,
  p_frequency_per_week integer default 1,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id uuid;
  clean_title text;
  clean_address text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  clean_title := coalesce(trim(p_title), '');
  clean_address := coalesce(trim(p_address), '');

  if clean_title = '' then
    raise exception 'Request title is required';
  end if;

  if clean_address = '' then
    raise exception 'Service address is required';
  end if;

  if coalesce(p_frequency_per_week, 0) < 1 or coalesce(p_frequency_per_week, 0) > 7 then
    raise exception 'frequency_per_week must be between 1 and 7';
  end if;

  insert into public.monthly_plan_requests (
    customer_id,
    title,
    address,
    preferred_start_date,
    frequency_per_week,
    notes
  )
  values (
    auth.uid(),
    clean_title,
    clean_address,
    p_preferred_start_date,
    p_frequency_per_week,
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into request_id;

  return request_id;
end;
$$;

create or replace function public.generate_monthly_plan_bookings(
  p_plan_id uuid,
  p_month_start date default date_trunc('month', current_date)::date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_row public.monthly_plans%rowtype;
  slot_row public.monthly_plan_schedule%rowtype;
  month_start date;
  month_end date;
  day_cursor date;
  slot_ts timestamptz;
  created_count integer := 0;
  booking_id uuid;
begin
  select * into plan_row
  from public.monthly_plans
  where id = p_plan_id;

  if plan_row.id is null then
    raise exception 'Monthly plan not found';
  end if;

  if not public.is_admin() and plan_row.customer_id <> auth.uid() then
    raise exception 'Not allowed to generate bookings for this plan';
  end if;

  if plan_row.status in ('cancelled', 'completed') then
    return 0;
  end if;

  month_start := date_trunc('month', p_month_start)::date;
  month_end := (month_start + interval '1 month - 1 day')::date;

  if plan_row.start_date > month_end then
    return 0;
  end if;
  if plan_row.end_date is not null and plan_row.end_date < month_start then
    return 0;
  end if;

  for slot_row in
    select *
    from public.monthly_plan_schedule
    where plan_id = plan_row.id
    order by day_of_week, start_time
  loop
    day_cursor := month_start;
    while day_cursor <= month_end loop
      if extract(dow from day_cursor)::integer = slot_row.day_of_week
         and day_cursor >= plan_row.start_date
         and (plan_row.end_date is null or day_cursor <= plan_row.end_date) then
        if exists (
          select 1
          from public.monthly_plan_occurrences occ
          where occ.plan_id = plan_row.id
            and occ.schedule_id = slot_row.id
            and occ.occurrence_date = day_cursor
        ) then
          day_cursor := day_cursor + 1;
          continue;
        end if;

        slot_ts := ((day_cursor::text || ' ' || slot_row.start_time::text)::timestamp at time zone 'Africa/Johannesburg');

        if exists (
          select 1
          from public.bookings b
          where b.status in ('requested', 'confirmed', 'completed')
            and b.confirmed_datetime = slot_ts
        ) then
          raise exception 'Time clash: % is already booked', slot_ts;
        end if;

        insert into public.bookings (
          customer_id,
          service_id,
          requested_datetime,
          confirmed_datetime,
          address,
          notes,
          status
        )
        values (
          plan_row.customer_id,
          slot_row.service_id,
          slot_ts,
          slot_ts,
          plan_row.address,
          'Monthly plan: ' || plan_row.title,
          'confirmed'
        )
        returning id into booking_id;

        insert into public.monthly_plan_occurrences (plan_id, schedule_id, booking_id, occurrence_date)
        values (plan_row.id, slot_row.id, booking_id, day_cursor);

        created_count := created_count + 1;
      end if;

      day_cursor := day_cursor + 1;
    end loop;
  end loop;

  return created_count;
end;
$$;

create or replace function public.activate_monthly_plan_from_quote(p_quote_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_row public.monthly_plans%rowtype;
begin
  select * into plan_row
  from public.monthly_plans
  where quote_id = p_quote_id;

  if plan_row.id is null then
    return;
  end if;

  if plan_row.status in ('cancelled', 'completed') then
    return;
  end if;

  update public.monthly_plans
  set status = 'active',
      activated_at = coalesce(activated_at, now()),
      paused_at = null,
      updated_at = now()
  where id = plan_row.id;

  perform public.generate_monthly_plan_bookings(plan_row.id, date_trunc('month', current_date)::date);
end;
$$;

create or replace function public.set_monthly_plan_status(
  p_plan_id uuid,
  p_status public.monthly_plan_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can manage monthly plans';
  end if;

  update public.monthly_plans
  set status = p_status,
      activated_at = case when p_status = 'active' then coalesce(activated_at, now()) else activated_at end,
      paused_at = case when p_status = 'paused' then now() else null end,
      cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end,
      updated_at = now()
  where id = p_plan_id;

  if p_status = 'active' then
    perform public.generate_monthly_plan_bookings(p_plan_id, date_trunc('month', current_date)::date);
  end if;
end;
$$;

create or replace function public.generate_monthly_plan_invoices(
  p_month_start date default date_trunc('month', current_date)::date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  month_start date;
  month_end date;
  plan_row public.monthly_plans%rowtype;
  slot_row public.monthly_plan_schedule%rowtype;
  service_name text;
  qty_count integer;
  subtotal_amount numeric(12, 2);
  vat_amount numeric(12, 2);
  total_amount numeric(12, 2);
  invoice_id uuid;
  invoice_number text;
  created_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Only admins can generate monthly invoices';
  end if;

  month_start := date_trunc('month', p_month_start)::date;
  month_end := (month_start + interval '1 month - 1 day')::date;

  if current_date < month_end then
    raise exception 'Monthly invoices can only be generated on or after month end';
  end if;

  for plan_row in
    select *
    from public.monthly_plans mp
    where mp.status in ('active', 'paused', 'completed')
      and mp.start_date <= month_end
      and (mp.end_date is null or mp.end_date >= month_start)
  loop
    if exists (
      select 1
      from public.monthly_plan_invoices mpi
      where mpi.plan_id = plan_row.id and mpi.billing_month = month_start
    ) then
      continue;
    end if;

    subtotal_amount := 0;

    for slot_row in
      select *
      from public.monthly_plan_schedule s
      where s.plan_id = plan_row.id
    loop
      select count(*)::integer into qty_count
      from public.monthly_plan_occurrences occ
      join public.bookings b on b.id = occ.booking_id
      where occ.plan_id = plan_row.id
        and occ.schedule_id = slot_row.id
        and occ.occurrence_date between month_start and month_end
        and b.status <> 'cancelled';

      if qty_count > 0 then
        subtotal_amount := subtotal_amount + round(qty_count * slot_row.unit_price, 2);
      end if;
    end loop;

    if subtotal_amount <= 0 then
      continue;
    end if;

    vat_amount := round(subtotal_amount * coalesce(plan_row.vat_rate, 0), 2);
    total_amount := subtotal_amount + vat_amount;
    invoice_number := public.allocate_invoice_number();

    insert into public.invoices (
      invoice_number,
      customer_id,
      booking_id,
      quote_id,
      status,
      issue_date,
      due_date,
      subtotal,
      vat_rate,
      vat_amount,
      total
    )
    values (
      invoice_number,
      plan_row.customer_id,
      plan_row.anchor_booking_id,
      plan_row.quote_id,
      'sent',
      month_end,
      month_end,
      subtotal_amount,
      coalesce(plan_row.vat_rate, 0),
      vat_amount,
      total_amount
    )
    returning id into invoice_id;

    for slot_row in
      select *
      from public.monthly_plan_schedule s
      where s.plan_id = plan_row.id
      order by s.day_of_week, s.start_time
    loop
      select count(*)::integer into qty_count
      from public.monthly_plan_occurrences occ
      join public.bookings b on b.id = occ.booking_id
      where occ.plan_id = plan_row.id
        and occ.schedule_id = slot_row.id
        and occ.occurrence_date between month_start and month_end
        and b.status <> 'cancelled';

      if qty_count <= 0 then
        continue;
      end if;

      select name into service_name
      from public.services
      where id = slot_row.service_id;

      insert into public.invoice_items (invoice_id, description, qty, unit_price, line_total)
      values (
        invoice_id,
        coalesce(service_name, 'Service') || ' - monthly plan ' || to_char(month_start, 'Mon YYYY'),
        qty_count,
        slot_row.unit_price,
        round(qty_count * slot_row.unit_price, 2)
      );
    end loop;

    insert into public.monthly_plan_invoices (plan_id, invoice_id, billing_month)
    values (plan_row.id, invoice_id, month_start);

    created_count := created_count + 1;
  end loop;

  return created_count;
end;
$$;

create or replace function public.allocate_quote_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_number integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can allocate quote numbers';
  end if;

  update public.settings
  set next_quote_number = next_quote_number + 1,
      updated_at = now()
  where id = 1
  returning next_quote_number - 1 into current_number;

  if current_number is null then
    raise exception 'Settings row is missing';
  end if;

  return 'Q-' || lpad(current_number::text, 6, '0');
end;
$$;

create or replace function public.allocate_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_number integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can allocate invoice numbers';
  end if;

  update public.settings
  set next_invoice_number = next_invoice_number + 1,
      updated_at = now()
  where id = 1
  returning next_invoice_number - 1 into current_number;

  if current_number is null then
    raise exception 'Settings row is missing';
  end if;

  return 'INV-' || lpad(current_number::text, 6, '0');
end;
$$;

create or replace function public.create_quote_with_items(
  p_customer_id uuid,
  p_booking_id uuid,
  p_valid_until date,
  p_vat_rate numeric,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  quote_id uuid;
  quote_number text;
  subtotal_amount numeric(12, 2) := 0;
  vat_amount numeric(12, 2);
  total_amount numeric(12, 2);
  item jsonb;
  line_qty numeric(12, 2);
  line_unit numeric(12, 2);
  line_total numeric(12, 2);
begin
  if not public.is_admin() then
    raise exception 'Only admins can create quotes';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Quote requires at least one item';
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    line_qty := coalesce((item ->> 'qty')::numeric, 0);
    line_unit := coalesce((item ->> 'unit_price')::numeric, 0);
    subtotal_amount := subtotal_amount + round(line_qty * line_unit, 2);
  end loop;

  vat_amount := round(subtotal_amount * coalesce(p_vat_rate, 0), 2);
  total_amount := subtotal_amount + vat_amount;
  quote_number := public.allocate_quote_number();

  insert into public.quotes (
    quote_number,
    customer_id,
    booking_id,
    status,
    valid_until,
    subtotal,
    vat_rate,
    vat_amount,
    total
  )
  values (
    quote_number,
    p_customer_id,
    p_booking_id,
    'sent',
    p_valid_until,
    subtotal_amount,
    coalesce(p_vat_rate, 0),
    vat_amount,
    total_amount
  )
  returning id into quote_id;

  for item in select * from jsonb_array_elements(p_items)
  loop
    line_qty := coalesce((item ->> 'qty')::numeric, 0);
    line_unit := coalesce((item ->> 'unit_price')::numeric, 0);
    line_total := round(line_qty * line_unit, 2);

    insert into public.quote_items (quote_id, description, qty, unit_price, line_total)
    values (
      quote_id,
      coalesce(item ->> 'description', 'Item'),
      line_qty,
      line_unit,
      line_total
    );
  end loop;

  return quote_id;
end;
$$;

create or replace function public.create_invoice_with_items(
  p_customer_id uuid,
  p_booking_id uuid,
  p_quote_id uuid,
  p_issue_date date,
  p_due_date date,
  p_vat_rate numeric,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_id uuid;
  invoice_number text;
  subtotal_amount numeric(12, 2) := 0;
  vat_amount numeric(12, 2);
  total_amount numeric(12, 2);
  item jsonb;
  line_qty numeric(12, 2);
  line_unit numeric(12, 2);
  line_total numeric(12, 2);
begin
  if not public.is_admin() then
    raise exception 'Only admins can create invoices';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Invoice requires at least one item';
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    line_qty := coalesce((item ->> 'qty')::numeric, 0);
    line_unit := coalesce((item ->> 'unit_price')::numeric, 0);
    subtotal_amount := subtotal_amount + round(line_qty * line_unit, 2);
  end loop;

  vat_amount := round(subtotal_amount * coalesce(p_vat_rate, 0), 2);
  total_amount := subtotal_amount + vat_amount;
  invoice_number := public.allocate_invoice_number();

  insert into public.invoices (
    invoice_number,
    customer_id,
    booking_id,
    quote_id,
    status,
    issue_date,
    due_date,
    subtotal,
    vat_rate,
    vat_amount,
    total
  )
  values (
    invoice_number,
    p_customer_id,
    p_booking_id,
    p_quote_id,
    'sent',
    p_issue_date,
    p_due_date,
    subtotal_amount,
    coalesce(p_vat_rate, 0),
    vat_amount,
    total_amount
  )
  returning id into invoice_id;

  for item in select * from jsonb_array_elements(p_items)
  loop
    line_qty := coalesce((item ->> 'qty')::numeric, 0);
    line_unit := coalesce((item ->> 'unit_price')::numeric, 0);
    line_total := round(line_qty * line_unit, 2);

    insert into public.invoice_items (invoice_id, description, qty, unit_price, line_total)
    values (
      invoice_id,
      coalesce(item ->> 'description', 'Item'),
      line_qty,
      line_unit,
      line_total
    );
  end loop;

  return invoice_id;
end;
$$;

create or replace function public.create_invoice_from_quote(p_quote_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.quotes%rowtype;
  existing_invoice_id uuid;
  created_invoice_id uuid;
  generated_number text;
begin
  select * into q
  from public.quotes
  where id = p_quote_id;

  if q.id is null then
    raise exception 'Quote not found';
  end if;

  if not public.is_admin() then
    raise exception 'Only admins can create invoice for this quote';
  end if;

  select i.id into existing_invoice_id
  from public.invoices i
  where i.quote_id = q.id
  order by i.created_at desc
  limit 1;

  if existing_invoice_id is not null then
    return existing_invoice_id;
  end if;

  generated_number := public.allocate_invoice_number();

  insert into public.invoices (
    invoice_number,
    customer_id,
    booking_id,
    quote_id,
    status,
    issue_date,
    due_date,
    subtotal,
    vat_rate,
    vat_amount,
    total
  )
  values (
    generated_number,
    q.customer_id,
    q.booking_id,
    q.id,
    'draft',
    current_date,
    current_date + 7,
    q.subtotal,
    q.vat_rate,
    q.vat_amount,
    q.total
  )
  returning id into created_invoice_id;

  insert into public.invoice_items (invoice_id, description, qty, unit_price, line_total)
  select created_invoice_id, qi.description, qi.qty, qi.unit_price, qi.line_total
  from public.quote_items qi
  where qi.quote_id = q.id;

  return created_invoice_id;
end;
$$;

create or replace function public.set_quote_status(
  p_quote_id uuid,
  p_status public.quote_status,
  p_auto_create_invoice boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  quote_row public.quotes%rowtype;
  is_monthly_plan_quote boolean := false;
begin
  if p_status not in ('accepted', 'declined') then
    raise exception 'Only accepted or declined are allowed';
  end if;

  select * into quote_row
  from public.quotes
  where id = p_quote_id;

  if quote_row.id is null then
    raise exception 'Quote not found';
  end if;

  if not public.is_admin() and quote_row.customer_id <> auth.uid() then
    raise exception 'Not allowed to update this quote';
  end if;

  update public.quotes
  set status = p_status
  where id = p_quote_id;

  select exists (
    select 1
    from public.monthly_plans mp
    where mp.quote_id = p_quote_id
  ) into is_monthly_plan_quote;

  if p_status = 'accepted' then
    perform public.activate_monthly_plan_from_quote(p_quote_id);
  end if;

  if p_status = 'accepted' and p_auto_create_invoice and not is_monthly_plan_quote then
    perform public.create_invoice_from_quote(p_quote_id);
  end if;
end;
$$;

create or replace function public.mark_invoice_paid(
  p_invoice_id uuid,
  p_method public.payment_method,
  p_amount numeric,
  p_reference text default null,
  p_proof_file_path text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can mark invoices paid';
  end if;

  insert into public.payments (invoice_id, method, amount, reference, proof_file_path)
  values (p_invoice_id, p_method, p_amount, p_reference, p_proof_file_path);

  update public.invoices
  set status = 'paid', paid_at = now()
  where id = p_invoice_id;
end;
$$;

drop function if exists public.get_public_settings();

create or replace function public.get_public_settings()
returns table (
  business_name text,
  reg_number text,
  vat_registered boolean,
  vat_number text,
  vat_rate numeric,
  address text,
  banking_details text,
  service_areas text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.business_name,
    s.reg_number,
    s.vat_registered,
    s.vat_number,
    s.vat_rate,
    s.address,
    s.banking_details,
    s.service_areas
  from public.settings s
  where s.id = 1;
$$;

grant execute on function public.allocate_quote_number() to authenticated;
grant execute on function public.allocate_invoice_number() to authenticated;
grant execute on function public.create_quote_with_items(uuid, uuid, date, numeric, jsonb) to authenticated;
grant execute on function public.create_invoice_with_items(uuid, uuid, uuid, date, date, numeric, jsonb) to authenticated;
grant execute on function public.create_invoice_from_quote(uuid) to authenticated;
grant execute on function public.set_quote_status(uuid, public.quote_status, boolean) to authenticated;
grant execute on function public.mark_invoice_paid(uuid, public.payment_method, numeric, text, text) to authenticated;
grant execute on function public.get_public_settings() to authenticated;
grant execute on function public.create_monthly_plan_with_quote(uuid, text, text, date, date, date, numeric, jsonb) to authenticated;
grant execute on function public.create_monthly_plan_request(text, text, date, integer, text) to authenticated;
grant execute on function public.generate_monthly_plan_bookings(uuid, date) to authenticated;
grant execute on function public.activate_monthly_plan_from_quote(uuid) to authenticated;
grant execute on function public.set_monthly_plan_status(uuid, public.monthly_plan_status) to authenticated;
grant execute on function public.generate_monthly_plan_invoices(date) to authenticated;

drop trigger if exists trg_touch_bookings_updated_at on public.bookings;
create trigger trg_touch_bookings_updated_at
before update on public.bookings
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_touch_settings_updated_at on public.settings;
create trigger trg_touch_settings_updated_at
before update on public.settings
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_touch_monthly_plans_updated_at on public.monthly_plans;
create trigger trg_touch_monthly_plans_updated_at
before update on public.monthly_plans
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_touch_monthly_plan_requests_updated_at on public.monthly_plan_requests;
create trigger trg_touch_monthly_plan_requests_updated_at
before update on public.monthly_plan_requests
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_prevent_booking_slot_overlap on public.bookings;
create trigger trg_prevent_booking_slot_overlap
before insert or update of confirmed_datetime, status on public.bookings
for each row
execute function public.prevent_booking_slot_overlap();

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
after insert on auth.users
for each row
execute function public.handle_new_user();

drop trigger if exists trg_protect_profile_role on public.profiles;
create trigger trg_protect_profile_role
before insert or update on public.profiles
for each row
execute function public.protect_profile_role();

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.settings enable row level security;
alter table public.monthly_plans enable row level security;
alter table public.monthly_plan_schedule enable row level security;
alter table public.monthly_plan_occurrences enable row level security;
alter table public.monthly_plan_invoices enable row level security;
alter table public.monthly_plan_requests enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert"
on public.profiles
for insert
to authenticated
with check ((id = auth.uid() and role = 'customer') or public.is_admin());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check ((id = auth.uid() and role = 'customer') or public.is_admin());

drop policy if exists "services_select" on public.services;
create policy "services_select"
on public.services
for select
to authenticated
using (true);

drop policy if exists "services_admin_all" on public.services;
create policy "services_admin_all"
on public.services
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "bookings_select" on public.bookings;
create policy "bookings_select"
on public.bookings
for select
to authenticated
using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "bookings_insert" on public.bookings;
create policy "bookings_insert"
on public.bookings
for insert
to authenticated
with check (customer_id = auth.uid() or public.is_admin());

drop policy if exists "bookings_update_admin" on public.bookings;
create policy "bookings_update_admin"
on public.bookings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "quotes_select" on public.quotes;
create policy "quotes_select"
on public.quotes
for select
to authenticated
using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "quotes_admin_manage" on public.quotes;
create policy "quotes_admin_manage"
on public.quotes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "quote_items_select" on public.quote_items;
create policy "quote_items_select"
on public.quote_items
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.quotes q
    where q.id = quote_id and q.customer_id = auth.uid()
  )
);

drop policy if exists "quote_items_admin_manage" on public.quote_items;
create policy "quote_items_admin_manage"
on public.quote_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "invoices_select" on public.invoices;
create policy "invoices_select"
on public.invoices
for select
to authenticated
using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "invoices_admin_manage" on public.invoices;
create policy "invoices_admin_manage"
on public.invoices
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "invoice_items_select" on public.invoice_items;
create policy "invoice_items_select"
on public.invoice_items
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.invoices i
    where i.id = invoice_id and i.customer_id = auth.uid()
  )
);

drop policy if exists "invoice_items_admin_manage" on public.invoice_items;
create policy "invoice_items_admin_manage"
on public.invoice_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "payments_select" on public.payments;
create policy "payments_select"
on public.payments
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.invoices i
    where i.id = invoice_id and i.customer_id = auth.uid()
  )
);

drop policy if exists "payments_insert_customer" on public.payments;
create policy "payments_insert_customer"
on public.payments
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.invoices i
    where i.id = invoice_id and i.customer_id = auth.uid()
  )
);

drop policy if exists "payments_admin_update" on public.payments;
create policy "payments_admin_update"
on public.payments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "settings_admin_only" on public.settings;
create policy "settings_admin_only"
on public.settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "monthly_plans_select" on public.monthly_plans;
create policy "monthly_plans_select"
on public.monthly_plans
for select
to authenticated
using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "monthly_plans_admin_manage" on public.monthly_plans;
create policy "monthly_plans_admin_manage"
on public.monthly_plans
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "monthly_plan_schedule_select" on public.monthly_plan_schedule;
create policy "monthly_plan_schedule_select"
on public.monthly_plan_schedule
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.monthly_plans mp
    where mp.id = plan_id and mp.customer_id = auth.uid()
  )
);

drop policy if exists "monthly_plan_schedule_admin_manage" on public.monthly_plan_schedule;
create policy "monthly_plan_schedule_admin_manage"
on public.monthly_plan_schedule
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "monthly_plan_occurrences_select" on public.monthly_plan_occurrences;
create policy "monthly_plan_occurrences_select"
on public.monthly_plan_occurrences
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.monthly_plans mp
    where mp.id = plan_id and mp.customer_id = auth.uid()
  )
);

drop policy if exists "monthly_plan_occurrences_admin_manage" on public.monthly_plan_occurrences;
create policy "monthly_plan_occurrences_admin_manage"
on public.monthly_plan_occurrences
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "monthly_plan_invoices_select" on public.monthly_plan_invoices;
create policy "monthly_plan_invoices_select"
on public.monthly_plan_invoices
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.monthly_plans mp
    where mp.id = plan_id and mp.customer_id = auth.uid()
  )
);

drop policy if exists "monthly_plan_invoices_admin_manage" on public.monthly_plan_invoices;
create policy "monthly_plan_invoices_admin_manage"
on public.monthly_plan_invoices
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "monthly_plan_requests_select" on public.monthly_plan_requests;
create policy "monthly_plan_requests_select"
on public.monthly_plan_requests
for select
to authenticated
using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "monthly_plan_requests_insert" on public.monthly_plan_requests;
create policy "monthly_plan_requests_insert"
on public.monthly_plan_requests
for insert
to authenticated
with check (customer_id = auth.uid() or public.is_admin());

drop policy if exists "monthly_plan_requests_admin_update" on public.monthly_plan_requests;
create policy "monthly_plan_requests_admin_update"
on public.monthly_plan_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.services (name, default_duration_minutes, active)
values ('General Garden Maintenance', 120, true)
on conflict do nothing;

insert into public.settings (
  id,
  business_name,
  reg_number,
  vat_registered,
  vat_number,
  vat_rate,
  address,
  banking_details,
  next_quote_number,
  next_invoice_number,
  service_areas
)
values (
  1,
  'Evergreen Garden Services',
  null,
  true,
  null,
  0.15,
  'South Africa',
  'Bank: Example Bank\nAccount: 000000000\nBranch: 000000',
  1,
  1,
  array[
    'Hartenbos',
    'Hartenbos Heuwels',
    'Hartenbosrif',
    'Bayview',
    'Menkenkop',
    'Voorbaai',
    'De Bakke',
    'Heiderand',
    'Aalwyndal',
    'D''Almeida',
    'Mossel Bay Central',
    'Diaz Beach',
    'Dana Bay',
    'Tergniet',
    'Reebok',
    'Fraai Uitsig',
    'Klein Brak River',
    'Great Brak River',
    'Outeniqua Strand',
    'Glentana'
  ]
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "documents_admin_all" on storage.objects;
create policy "documents_admin_all"
on storage.objects
for all
to authenticated
using (bucket_id = 'documents' and public.is_admin())
with check (bucket_id = 'documents' and public.is_admin());

drop policy if exists "documents_customer_insert_own" on storage.objects;
create policy "documents_customer_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or (
      split_part(name, '/', 1) = 'pop'
      and split_part(name, '/', 2) = auth.uid()::text
    )
  )
);

drop policy if exists "documents_customer_select_own" on storage.objects;
create policy "documents_customer_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or (
      split_part(name, '/', 1) = 'pop'
      and split_part(name, '/', 2) = auth.uid()::text
    )
  )
);
