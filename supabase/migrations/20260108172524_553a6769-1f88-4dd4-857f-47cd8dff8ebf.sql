-- Add a free plan
INSERT INTO public.plans (code, name, max_professionals)
VALUES ('free', 'Gratuito', 1)
ON CONFLICT DO NOTHING;