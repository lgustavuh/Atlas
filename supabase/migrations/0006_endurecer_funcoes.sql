-- Endurecimento apontado pelo verificador de segurança do Supabase.
--
-- 1. No Supabase toda função nova recebe EXECUTE para PUBLIC (e, por herança, para anon).
--    Revogar só de anon não basta: tiramos de PUBLIC/anon e damos apenas a authenticated.
--    Nenhuma tela sem login chama funções do banco e todas as políticas são "to authenticated".
-- 2. Funções de gatilho não precisam ser chamáveis por ninguém (o gatilho não verifica EXECUTE).
-- 3. Funções sem search_path fixo passam a usar search_path vazio (os corpos já são qualificados).

revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;

alter default privileges in schema public revoke execute on functions from public, anon;
alter default privileges in schema public grant execute on functions to authenticated;

do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke execute on function %s from authenticated', f);
  end loop;
end $$;

alter function public.sem_acento(text) set search_path = '';
alter function public.tg_atualizado_em() set search_path = '';
alter function public.tg_exigir_nivel_status() set search_path = '';
alter function public.exigir(boolean, text) set search_path = '';
alter function public.brl(numeric) set search_path = '';
alter function public.modulo_da_pasta(text) set search_path = '';
