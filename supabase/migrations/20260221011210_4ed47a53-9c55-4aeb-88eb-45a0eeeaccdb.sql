
-- Add capacity and amenities columns to rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS capacity text;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS amenities_th text;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS amenities_en text;

-- Add storage policies for rooms bucket to allow admin delete/upload
CREATE POLICY "Anyone can view room images"
ON storage.objects FOR SELECT
USING (bucket_id = 'rooms');

CREATE POLICY "Admins can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'rooms' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update room images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'rooms' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete room images"
ON storage.objects FOR DELETE
USING (bucket_id = 'rooms' AND public.has_role(auth.uid(), 'admin'));
