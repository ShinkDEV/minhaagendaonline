-- Add super_admin role to the user
INSERT INTO public.user_roles (user_id, role)
VALUES ('cc5899f8-4ac5-4041-9b5c-ee9bf5e0c006', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;