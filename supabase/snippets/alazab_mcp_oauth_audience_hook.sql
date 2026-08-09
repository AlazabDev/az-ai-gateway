-- NOT AUTO-APPLIED.
-- Apply this only to the Supabase project that actually backs Alazab AI Console Auth,
-- then enable it under Authentication > Hooks > Custom Access Token.
--
-- Purpose:
--   Supabase OAuth access tokens default to aud="authenticated".
--   The Alazab MCP resource server validates aud=https://api.alazab.com.
--   Only OAuth-issued tokens (client_id present) receive the MCP audience;
--   normal Alazab browser/password sessions keep their existing audience.

create or replace function public.alazab_mcp_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  oauth_client_id text;
begin
  claims := coalesce(event -> 'claims', '{}'::jsonb);

  -- Supabase OAuth hook payloads expose client_id for OAuth flows. Keep a
  -- claims fallback so the hook remains explicit if the payload shape evolves.
  oauth_client_id := coalesce(
    nullif(event ->> 'client_id', ''),
    nullif(claims ->> 'client_id', '')
  );

  if oauth_client_id is not null then
    claims := jsonb_set(
      claims,
      '{aud}',
      to_jsonb('https://api.alazab.com'::text),
      true
    );
  end if;

  event := jsonb_set(event, '{claims}', claims, true);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.alazab_mcp_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.alazab_mcp_access_token_hook(jsonb) from authenticated, anon, public;

-- Verification after enabling the hook:
-- 1. Complete one OAuth authorization-code flow through the Alazab MCP client.
-- 2. Decode the access token and verify:
--      iss = https://<correct-project-ref>.supabase.co/auth/v1
--      aud = https://api.alazab.com
--      client_id is present
--      exp is in the future
-- 3. Confirm a normal direct Alazab session still keeps its normal audience.
