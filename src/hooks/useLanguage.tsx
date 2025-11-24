import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'th' | 'en';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'th',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'language-storage',
    }
  )
);

export const translations = {
  th: {
    // Header
    home: "หน้าแรก",
    about: "เกี่ยวกับเรา",
    rooms: "ห้องพัก",
    menu: "เมนู",
    gallery: "แกลเลอรี",
    reviews: "รีวิว",
    contact: "ติดต่อเรา",
    forum: "เว็บบอร์ด",
    bookNow: "จองเลย",
    
    // Hero
    location: "เชียงใหม่, ประเทศไทย",
    heroTitle: "Plern Ping Cafe",
    heroSubtitle: "สัมผัสการผสมผสานที่ลงตัวระหว่างเสน่ห์ล้านนาแท้และความสะดวกสบายสมัยใหม่",
    heroDescription: "ท่ามกลางธรรมชาติที่สงบ ที่ซึ่งอาหารรสเลิศผสานกับกาแฟชั้นเยี่ยมในสวนอันเงียบสงบ",
    exploreMenu: "สำรวจเมนู",
    viewRooms: "ดูห้องพัก",
    
    // Features
    featuresTitle: "ทำไมต้องเลือก Plern Ping",
    featuresSubtitle: "ประสบการณ์ที่ไม่เหมือนใคร",
    traditionalArchitecture: "สถาปัตยกรรมล้านนาแท้",
    traditionalArchitectureDesc: "บ้านไม้สไตล์ล้านนาที่สวยงามในบรรยากาศธรรมชาติ",
    artisanCoffee: "กาแฟชั้นเยี่ยม",
    artisanCoffeeDesc: "เมือกาแฟคั่วพิเศษและเครื่องดื่มสไตล์ไทย",
    authenticCuisine: "อาหารไทยแท้",
    authenticCuisineDesc: "อาหารล้านนาและไทยต้นตำรับจากเชฟท้องถิ่น",
    gardenSetting: "ในสวนธรรมชาติ",
    gardenSettingDesc: "ที่นั่งในร่มและกลางแจ้งท่ามกลางสวนเขียวขจี",
    
    // Rooms
    roomsTitle: "ห้องพักของเรา",
    roomsSubtitle: "พักผ่อนในความสะดวกสบายและสไตล์ล้านนา",
    perNight: "/ คืน",
    deluxeRoom: "ห้องดีลักซ์",
    deluxeRoomDesc: "ห้องพักกว้างขวางพร้อมการตกแต่งสไตล์ล้านนาสมัยใหม่",
    familySuite: "ห้องสวีทครอบครัว",
    familySuiteDesc: "ห้องพักขนาดใหญ่สำหรับครอบครัว มีห้องนอน 2 ห้อง",
    gardenView: "ห้องวิวสวน",
    gardenViewDesc: "ห้องพักสบายๆ พร้อมวิวสวนเขียวขจี",
    bookRoom: "จองห้องพัก",
    
    // Menu
    menuTitle: "เมนูของเรา",
    menuSubtitle: "อาหารไทยแท้และกาแฟพรีเมียมที่รังสรรค์ด้วยใจ",
    coffeeAndDrinks: "กาแฟและเครื่องดื่ม",
    food: "อาหาร",
    espresso: "เอสเพรสโซ",
    espressoDesc: "ช็อตเดี่ยวเข้มข้น กลิ่นหอมเต็มที่",
    cappuccino: "คาปูชิโน",
    cappuccinoDesc: "เอสเพรสโซกับฟองนมนุ่ม",
    latte: "ลาเต้",
    latteDesc: "เอสเพรสโซนุ่มนวลกับนมครีมมี่",
    thaiIcedCoffee: "กาแฟเย็นสไตล์ไทย",
    thaiIcedCoffeeDesc: "สไตล์ดั้งเดิมกับนมข้นหวาน",
    padThai: "ผัดไทย",
    padThaiDesc: "เส้นผัดสไตล์ไทยคลาสสิก",
    greenCurry: "แกงเขียวหวาน",
    greenCurryDesc: "แกงเขียวหวานหอมกรุ่นกับไก่",
    somTam: "ส้มตำ",
    somTamDesc: "ส้มตำสไตล์ล้านนาเผ็ดร้อน",
    khaoSoi: "ข้าวซอย",
    khaoSoiDesc: "ก๋วยเตี๋ยวแกงกะหรี่เหนือ",
    viewFullMenu: "ดูเมนูทั้งหมด",
    recommended: "เมนูแนะนำ",
    recommendedSubtitle: "เมนูสุดพิเศษที่คุณไม่ควรพลาด",
    
    // Gallery
    galleryTitle: "แกลเลอรี",
    gallerySubtitle: "เหลือบมองสถานที่อันเงียบสงบของเรา",
    
    // Reviews
    reviewsTitle: "รีวิวจากลูกค้า",
    reviewsSubtitle: "ความประทับใจจากผู้ที่มาเยือน",
    
    // Contact
    contactTitle: "ติดต่อเรา",
    contactSubtitle: "เราพร้อมให้บริการคุณ",
    phone: "โทรศัพท์",
    email: "อีเมล",
    socialMedia: "โซเชียลมีเดีย",
    address: "ที่อยู่",
    openingHours: "เวลาทำการ",
    
    // Forum
    forumTitle: "เว็บบอร์ด",
    forumSubtitle: "พูดคุยและแบ่งปันประสบการณ์",
    latestTopics: "กระทู้ล่าสุด",
    popularTopics: "กระทู้ยอดนิยม",
    replies: "ตอบกลับ",
    views: "ครั้ง",
    lastPost: "โพสต์ล่าสุด",
    startedBy: "เริ่มโดย",
    
    // Footer
    footerDescription: "สัมผัสการผสมผสานที่ลงตัวระหว่างอาหารไทยแท้และกาแฟชั้นเยี่ยมในบรรยากาศสวนธรรมชาติ",
    contactUs: "ติดต่อเรา",
    quickLinks: "ลิงก์ด่วน",
    followUs: "ติดตามเรา",
    allRightsReserved: "สงวนลิขสิทธิ์",
  },
  en: {
    // Header
    home: "Home",
    about: "About",
    rooms: "Rooms",
    menu: "Menu",
    gallery: "Gallery",
    reviews: "Reviews",
    contact: "Contact",
    forum: "Forum",
    bookNow: "Book Now",
    
    // Hero
    location: "Chiang Mai, Thailand",
    heroTitle: "Plern Ping Cafe",
    heroSubtitle: "Experience the perfect blend of traditional Lanna charm and modern comfort",
    heroDescription: "Nestled in nature's embrace, where exceptional food meets artisan coffee in a tranquil garden setting",
    exploreMenu: "Explore Menu",
    viewRooms: "View Rooms",
    
    // Features
    featuresTitle: "Why Choose Plern Ping",
    featuresSubtitle: "A unique experience awaits",
    traditionalArchitecture: "Traditional Architecture",
    traditionalArchitectureDesc: "Beautiful Lanna-style wooden houses in natural surroundings",
    artisanCoffee: "Artisan Coffee",
    artisanCoffeeDesc: "Specialty roasted coffee and Thai-style beverages",
    authenticCuisine: "Authentic Cuisine",
    authenticCuisineDesc: "Authentic Lanna and Thai dishes from local chefs",
    gardenSetting: "Garden Setting",
    gardenSettingDesc: "Indoor and outdoor seating amid lush greenery",
    
    // Rooms
    roomsTitle: "Our Rooms",
    roomsSubtitle: "Relax in comfort and Lanna style",
    perNight: "/ night",
    deluxeRoom: "Deluxe Room",
    deluxeRoomDesc: "Spacious room with modern Lanna-style decoration",
    familySuite: "Family Suite",
    familySuiteDesc: "Large room for families with 2 bedrooms",
    gardenView: "Garden View Room",
    gardenViewDesc: "Cozy room with lush garden views",
    bookRoom: "Book Room",
    
    // Menu
    menuTitle: "Our Menu",
    menuSubtitle: "Authentic Thai cuisine and premium coffee crafted with passion",
    coffeeAndDrinks: "Coffee & Drinks",
    food: "Food",
    espresso: "Espresso",
    espressoDesc: "Rich, bold single shot",
    cappuccino: "Cappuccino",
    cappuccinoDesc: "Espresso with steamed milk foam",
    latte: "Latte",
    latteDesc: "Smooth espresso with creamy milk",
    thaiIcedCoffee: "Thai Iced Coffee",
    thaiIcedCoffeeDesc: "Traditional style with condensed milk",
    padThai: "Pad Thai",
    padThaiDesc: "Classic Thai stir-fried noodles",
    greenCurry: "Green Curry",
    greenCurryDesc: "Aromatic Thai green curry with chicken",
    somTam: "Som Tam",
    somTamDesc: "Spicy papaya salad, Lanna style",
    khaoSoi: "Khao Soi",
    khaoSoiDesc: "Northern Thai curry noodle soup",
    viewFullMenu: "View Full Menu",
    recommended: "Recommended Menu",
    recommendedSubtitle: "Special dishes you shouldn't miss",
    
    // Gallery
    galleryTitle: "Gallery",
    gallerySubtitle: "A glimpse into our serene sanctuary",
    
    // Reviews
    reviewsTitle: "Customer Reviews",
    reviewsSubtitle: "Experiences from our visitors",
    
    // Contact
    contactTitle: "Contact Us",
    contactSubtitle: "We're here to serve you",
    phone: "Phone",
    email: "Email",
    socialMedia: "Social Media",
    address: "Address",
    openingHours: "Opening Hours",
    
    // Forum
    forumTitle: "Forum",
    forumSubtitle: "Share your experiences",
    latestTopics: "Latest Topics",
    popularTopics: "Popular Topics",
    replies: "Replies",
    views: "Views",
    lastPost: "Last Post",
    startedBy: "Started by",
    
    // Footer
    footerDescription: "Experience the perfect blend of authentic Thai cuisine and artisan coffee in a natural garden setting",
    contactUs: "Contact Us",
    quickLinks: "Quick Links",
    followUs: "Follow Us",
    allRightsReserved: "All rights reserved",
  },
};
