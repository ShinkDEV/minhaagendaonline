-- Create salon for existing user
INSERT INTO public.salons (id, name) 
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Meu Salão');

-- Update profile with salon_id
UPDATE public.profiles 
SET salon_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE id = 'cc5899f8-4ac5-4041-9b5c-ee9bf5e0c006';

-- Add admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('cc5899f8-4ac5-4041-9b5c-ee9bf5e0c006', 'admin');

-- Create salon plan with free plan
INSERT INTO public.salon_plan (salon_id, plan_id)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c18e05f3-cb14-4aa6-b6db-7a7fdb79c374');

-- Create professional
INSERT INTO public.professionals (salon_id, profile_id, display_name, commission_percent_default)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc5899f8-4ac5-4041-9b5c-ee9bf5e0c006', 'eduardo', 0);