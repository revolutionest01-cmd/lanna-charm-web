-- Create business_info table for storing basic business information
CREATE TABLE public.business_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name_th TEXT NOT NULL,
  business_name_en TEXT NOT NULL,
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  email TEXT,
  line_id TEXT,
  instagram TEXT,
  address_th TEXT,
  address_en TEXT,
  google_maps_url TEXT,
  opening_hours_th TEXT,
  opening_hours_en TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Business info is viewable by everyone" 
ON public.business_info 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can modify business info" 
ON public.business_info 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_business_info_updated_at
BEFORE UPDATE ON public.business_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default data
INSERT INTO public.business_info (
  business_name_th,
  business_name_en,
  phone_primary,
  phone_secondary,
  email,
  line_id,
  instagram,
  address_th,
  address_en,
  google_maps_url,
  opening_hours_th,
  opening_hours_en
) VALUES (
  'เปลิน-พิง คาเฟ่',
  'Plern Ping Cafe',
  '0818469098',
  '0817100611',
  'plernping5445@gmail.com',
  '@plernpingcafe',
  '@plernpingcafe',
  'เชียงใหม่, ประเทศไทย',
  'Chiang Mai, Thailand',
  'https://maps.google.com/?q=Plern+Ping+Cafe',
  'เปิดทุกวัน 08:00 - 20:00 น.',
  'Open daily 08:00 AM - 08:00 PM'
);