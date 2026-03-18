update auth.users
set
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'first_name', 'Eduardo',
    'last_name', 'Alves Araujo'
  ),
  updated_at = timezone('utc'::text, now())
where email = 'eduardo.ti.vix@gmail.com';

update auth.users
set
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'first_name', 'Flavia',
    'last_name', 'Pitanga Barcelos Araujo'
  ),
  updated_at = timezone('utc'::text, now())
where email = 'flaviapbarcelos@gmail.com';
