-- =====================================================
-- Setear contraseña a las cuentas existentes (creadas con magic link)
-- Pega esto en Supabase → SQL Editor → Run.
-- Deja todas las cuentas @uade.edu.ar con la contraseña: uade123
-- (cada usuario puede cambiarla luego desde "¿Olvidaste tu contraseña?").
-- =====================================================

update auth.users
set encrypted_password = crypt('uade123', gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now())
where email like '%@uade.edu.ar';

-- Si diera error "function gen_salt does not exist", corré primero:
--   create extension if not exists pgcrypto with schema extensions;
-- y reemplazá crypt/gen_salt por extensions.crypt / extensions.gen_salt.
