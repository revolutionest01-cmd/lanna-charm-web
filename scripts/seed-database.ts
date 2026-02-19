#!/usr/bin/env node

/**
 * Database Seeder Script
 * This script inserts sample data into the Supabase database
 * Run with: npx ts-node scripts/seed-database.ts
 * @type module
 */

import { createClient } from "@supabase/supabase-js";

declare const process: any;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...\n");

    // 1. Insert Hero Content
    console.log("📝 Inserting hero content...");
    const heroResult = await supabase.from("hero_content").insert({
      image_url:
        "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200&h=800&fit=crop",
      title_th: "ยินดีต้อนรับสู่เปลิน-พิง",
      title_en: "Welcome to Plern Ping",
      subtitle_th: "ร้านกาแฟและจัดเลี้ยงที่สวยงามในเชียงใหม่",
      subtitle_en: "Beautiful Cafe & Event Venue in Chiang Mai",
      is_active: true,
    });

    if (heroResult.error) throw heroResult.error;
    console.log("✅ Hero content inserted\n");

    // 2. Insert Event Spaces
    console.log("📝 Inserting event spaces...");
    const eventResult = await supabase.from("event_spaces").insert({
      title_th: "ห้องจัดงาน",
      title_en: "Event Space",
      description_th:
        "พื้นที่กว้างขวางและสมบูรณ์สำหรับจัดงานต่างๆ เช่น งานแต่งงาน การประชุม และงานเลี้ยง",
      description_en:
        "Spacious and complete event space for various occasions such as weddings, meetings, and parties. Equipped with modern facilities and professional service.",
      image_url:
        "https://images.unsplash.com/photo-1519236395646-e914c58bf2d8?w=1200&h=800&fit=crop",
      keywords_th: "จัดงาน,ห้องประชุม,งานแต่งงาน",
      keywords_en: "events,conference,wedding",
      is_active: true,
    });

    if (eventResult.error) throw eventResult.error;
    console.log("✅ Event spaces inserted\n");

    // 3. Insert Menu Categories
    console.log("📝 Inserting menu categories...");
    const categories = [
      { name_th: "กาแฟ", name_en: "Coffee", sort_order: 1 },
      { name_th: "เครื่องดื่ม", name_en: "Beverages", sort_order: 2 },
      { name_th: "อาหาร", name_en: "Food", sort_order: 3 },
      { name_th: "ของหวาน", name_en: "Desserts", sort_order: 4 },
    ];

    const categoriesResult = await supabase
      .from("menu_categories")
      .insert(categories)
      .select();

    if (categoriesResult.error && !categoriesResult.error.message.includes("23505"))
      throw categoriesResult.error;
    console.log("✅ Menu categories inserted\n");

    // 4. Get category IDs
    const catResult = await supabase
      .from("menu_categories")
      .select("id, name_th")
      .in("name_th", ["กาแฟ", "เครื่องดื่ม", "อาหาร", "ของหวาน"]);

    if (catResult.error) throw catResult.error;

    const categoryMap: Record<string, string> = catResult.data.reduce(
      (acc, cat) => ({ ...acc, [cat.name_th]: cat.id }),
      {} as Record<string, string>
    );
    console.log("category map:", categoryMap);

    // 5. Insert Menus
    console.log("📝 Inserting menus...");
    const menus = [
      {
        name_th: "เอสเพรสโซ่",
        name_en: "Espresso",
        description_th: "โดส 1-2 โดสกาแฟที่ชาติและเข้มข้น",
        description_en: "Single or double shot of strong, concentrated coffee",
        price: 45.0,
        category_id: categoryMap["กาแฟ"] || null,
        image_url:
          "https://images.unsplash.com/photo-1442512595331-e89e6fee58e9?w=400&h=400&fit=crop",
        is_recommended: true,
        is_active: true,
      },
      {
        name_th: "คาปูชิโน่",
        name_en: "Cappuccino",
        description_th: "กาแฟเอสเพรสโซ่ผสมนมร้อนและโฟมนม",
        description_en: "Espresso coffee mixed with hot milk and milk foam",
        price: 55.0,
        category_id: categoryMap["กาแฟ"] || null,
        image_url:
          "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop",
        is_recommended: true,
        is_active: true,
      },
      {
        name_th: "ลาเต้",
        name_en: "Latte",
        description_th: "กาแฟเอสเพรสโซ่ผสมนมร้อน",
        description_en: "Espresso coffee mixed with hot milk",
        price: 55.0,
        category_id: categoryMap["กาแฟ"] || null,
        image_url:
          "https://images.unsplash.com/photo-1517701550927-30cf4ba52fe1?w=400&h=400&fit=crop",
        is_recommended: false,
        is_active: true,
      },
      {
        name_th: "น้ำส้มสด",
        name_en: "Fresh Orange Juice",
        description_th: "น้ำส้มสดปั่นจากส้มสดใหม่",
        description_en: "Freshly extracted juice from fresh oranges",
        price: 50.0,
        category_id: categoryMap["เครื่องดื่ม"] || null,
        image_url:
          "https://images.unsplash.com/photo-1600271886742-f049cd1f85c0?w=400&h=400&fit=crop",
        is_recommended: false,
        is_active: true,
      },
      {
        name_th: "ข้าวไข่เจียว",
        name_en: "Fried Rice with Egg",
        description_th: "ข้าวผัดกับไข่ไก่และเครื่องปรุง",
        description_en: "Fried rice with egg and seasonings",
        price: 70.0,
        category_id: categoryMap["อาหาร"] || null,
        image_url:
          "https://images.unsplash.com/photo-1609501676725-7186f017a4b1?w=400&h=400&fit=crop",
        is_recommended: true,
        is_active: true,
      },
      {
        name_th: "เค้กช็อกโกแลต",
        name_en: "Chocolate Cake",
        description_th: "เค้กช็อกโกแลตสดใหม่",
        description_en: "Fresh chocolate cake",
        price: 80.0,
        category_id: categoryMap["ของหวาน"] || null,
        image_url:
          "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop",
        is_recommended: true,
        is_active: true,
      },
    ];

    const menusResult = await supabase
      .from("menus")
      .insert(menus)
      .select("id, name_th");

    if (menusResult.error) throw menusResult.error;
    console.log("✅ Menus inserted\n");

    // 6. Insert Rooms
    console.log("📝 Inserting rooms...");
    const rooms = [
      {
        name_th: "ห้องประชุมเล็ก",
        name_en: "Small Conference Room",
        description_th: "ห้องประชุมขนาดเล็กสำหรับประชุมขนาด 10-15 คน",
        description_en: "Small conference room for 10-15 people",
        price: 2000.0,
        is_active: true,
        sort_order: 1,
      },
      {
        name_th: "ห้องประชุมกลาง",
        name_en: "Medium Conference Room",
        description_th: "ห้องประชุมขนาดกลางสำหรับประชุมขนาด 30-50 คน",
        description_en: "Medium conference room for 30-50 people",
        price: 3500.0,
        is_active: true,
        sort_order: 2,
      },
      {
        name_th: "ห้องบอลรูม",
        name_en: "Ballroom",
        description_th: "ห้องบอลรูมขนาดใหญ่สำหรับงานเลี้ยงที่มีผู้เข้าร่วมจำนวนมาก",
        description_en: "Large ballroom for big events and parties",
        price: 8000.0,
        is_active: true,
        sort_order: 3,
      },
    ];

    const roomsResult = await supabase.from("rooms").insert(rooms).select("id");

    if (roomsResult.error) throw roomsResult.error;
    console.log("✅ Rooms inserted\n");

    // 7. Insert Room Images
    console.log("📝 Inserting room images...");
    const roomImages = roomsResult.data.map((room, idx) => ({
      room_id: room.id,
      image_url: [
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1519167758993-c1e1e5475d11?w=600&h=400&fit=crop",
      ][idx],
      sort_order: 1,
    }));

    const roomImagesResult = await supabase
      .from("room_images")
      .insert(roomImages);

    if (roomImagesResult.error) throw roomImagesResult.error;
    console.log("✅ Room images inserted\n");

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
