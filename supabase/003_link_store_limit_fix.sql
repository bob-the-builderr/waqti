-- =====================================================================
-- 003: makes the "10 tries an hour" limit on store codes actually count.
-- Paste into the Supabase SQL Editor once, after 002.
--
-- In 002, a wrong code raised an error, and the error rolled back the
-- attempt that had just been recorded, so the counter never grew.
-- Now a wrong code returns {"error": "unknown store code"} instead, and the
-- attempt stays recorded.
-- =====================================================================

create or replace function public.link_store(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(trim(coalesce(p_code, '')));
  v_store public.stores%rowtype;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if (select count(*) from public.link_attempts a where a.user_id = v_user and a.at > now() - interval '1 hour') >= 10 then
    return jsonb_build_object('error', 'too many tries');
  end if;
  insert into public.link_attempts (user_id) values (v_user);

  select * into v_store from public.stores s
  where (s.referral_code = v_code or s.pin_code = v_code) and s.is_active;
  if not found then
    return jsonb_build_object('error', 'unknown store code');
  end if;
  insert into public.customer_stores (user_id, store_id) values (v_user, v_store.id) on conflict do nothing;
  return jsonb_build_object('store_id', v_store.id, 'name', v_store.name);
end;
$$;

revoke all on function public.link_store(text) from public, anon;
grant execute on function public.link_store(text) to authenticated;
