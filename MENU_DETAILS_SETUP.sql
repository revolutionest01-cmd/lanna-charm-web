-- Update menu items with detailed information
-- This script adds comprehensive details to beverage menu items

-- Coffee Category Details
UPDATE public.menus
SET 
  ingredients_th = 'กาแฟคัดสรร เวลีเด้, น้ำ',
  ingredients_en = 'Selected Vellidte Coffee Beans, Water',
  temperature_options = 'Hot, Iced',
  size_options = 'Single Shot, Double Shot',
  preparation_method_th = 'เทกาแฟจากเครื่องบดกาแฟตามลำดับ ใช้ความดัน 9 บาร์ เวลาสกัด 25-30 วินาที',
  preparation_method_en = 'Grind coffee beans and extract with 9 bar pressure for 25-30 seconds',
  allergens_th = 'ไม่มี',
  allergens_en = 'None',
  calories = 2,
  customization_options_th = 'เพิ่มสตีมมิลค์, ซีรัปแนนออปชัน',
  customization_options_en = 'Add steamed milk, optional syrups'
WHERE name_th = 'เอสเพรสโซ่' AND category_id = (SELECT id FROM public.menu_categories WHERE name_th = 'กาแฟ' LIMIT 1);

-- Cappuccino Details
UPDATE public.menus
SET 
  ingredients_th = 'กาแฟเอสเพรสโซ่, นมสด, ฟองนม',
  ingredients_en = 'Espresso, Fresh Milk, Milk Foam',
  temperature_options = 'Hot',
  size_options = 'Small (8oz), Medium (10oz), Large (12oz)',
  preparation_method_th = 'เทกาแฟ 1/3 นมสตีม 1/3 ฟองนม 1/3',
  preparation_method_en = '1/3 Espresso, 1/3 steamed milk, 1/3 foam',
  allergens_th = 'มีนม',
  allergens_en = 'Contains milk',
  calories = 120,
  customization_options_th = 'ปรับระดับความหวาน, แปะก้วยอื่นๆ',
  customization_options_en = 'Adjust sweetness, extra cocoa powder'
WHERE name_th LIKE '%cappuccino%' OR name_th LIKE '%คาปูชิโน%' AND category_id = (SELECT id FROM public.menu_categories WHERE name_th = 'กาแฟ' LIMIT 1);

-- Latte Details
UPDATE public.menus
SET 
  ingredients_th = 'กาแฟเอสเพรสโซ่, นมสตีม, ฟองนม',
  ingredients_en = 'Espresso, Steamed Milk, Milk Foam',
  temperature_options = 'Hot, Iced',
  size_options = 'Small (8oz), Medium (10oz), Large (12oz)',
  preparation_method_th = 'เทกาแฟ 1/5 นมสตีม 4/5 ฟองนม',
  preparation_method_en = '1/5 Espresso, 4/5 steamed milk, light foam',
  allergens_th = 'มีนม',
  allergens_en = 'Contains milk',
  calories = 190,
  customization_options_th = 'บาร์การเลือกกลิ่น (วนิลลา, กินจิบี้)', 
  customization_options_en = 'Flavor options (Vanilla, Pistachio)',
  is_recommended = true
WHERE name_th LIKE '%latte%' OR name_th LIKE '%ลาเต้%' AND category_id = (SELECT id FROM public.menu_categories WHERE name_th = 'กาแฟ' LIMIT 1);

-- Beverage Category - General Drinks
UPDATE public.menus
SET 
  ingredients_th = 'วัสดุดิบ เฉพาะเจาะจง สำหรับเครื่องดื่มแต่ละชนิด',
  ingredients_en = 'Specific ingredients per beverage type',
  temperature_options = 'Hot, Iced, Blended',
  size_options = 'Small (10oz), Medium (12oz), Large (16oz), Extra Large (20oz)',
  preparation_method_th = 'ดูรายละเอียดของเครื่องดื่มที่เลือก',
  preparation_method_en = 'See individual beverage details',
  allergens_th = 'อาจมีนม/สารก่อแพ้บนสิ่งอื่นๆ',
  allergens_en = 'May contain milk/allergens - see details'
WHERE category_id = (SELECT id FROM public.menu_categories WHERE name_th = 'เครื่องดื่ม' LIMIT 1);

-- Thai Iced Tea Example
UPDATE public.menus
SET 
  ingredients_th = 'ชาแดงสกัดเย็น, นมข้นหวาน, น้ำตาล',
  ingredients_en = 'Brewed Thai Red Tea, Condensed Milk, Sugar',
  temperature_options = 'Iced',
  size_options = 'Small (10oz), Medium (12oz), Large (16oz)',
  preparation_method_th = 'ชงชาแดง ผ่านตะแกรง เสริฟเย็นด้วยน้ำแข็งและนมข้นหวาน',
  preparation_method_en = 'Brew Thai tea, strain, serve iced with condensed milk',
  allergens_th = 'มีนมข้นหวาน',
  allergens_en = 'Contains condensed milk',
  calories = 180,
  customization_options_th = 'ปรับความหวาน, เพิ่มนมทั่วไป, ไม่ใส่น้ำแข็ง',
  customization_options_en = 'Adjust sweetness, regular milk option, extra ice'
WHERE name_th LIKE '%ชา%เย็น%' AND category_id = (SELECT id FROM public.menu_categories WHERE name_th = 'เครื่องดื่ม' LIMIT 1);

-- Note: Add more menu items with their specific details as needed
-- The system is ready to display all these details professionally in the menu modal
