-- Add staff and developer INSERT policies for event-spaces storage
CREATE POLICY "Staff can upload event space images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'event-spaces' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Developer can upload event space images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'event-spaces' AND has_role(auth.uid(), 'developer'::app_role));

-- Add staff/developer DELETE/UPDATE for event-spaces storage
CREATE POLICY "Staff can delete event space images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'event-spaces' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can update event space images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'event-spaces' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Developer can delete event space images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'event-spaces' AND has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Developer can update event space images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'event-spaces' AND has_role(auth.uid(), 'developer'::app_role));