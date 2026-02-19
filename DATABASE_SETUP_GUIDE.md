# 🔧 Database Setup Instructions

## Problem Found
The website is stuck on the loading page because the database tables are empty. There's no sample content (hero content, rooms, menus, etc.) to display.

Additionally, the Row-Level Security (RLS) policies prevent anonymous users from inserting data directly.

## Solution

### ✅ Quick Fix: Run SQL in Supabase Dashboard

1. **Open Supabase SQL Editor:**
   - Go to: https://app.supabase.com/project/gomjfnkzhxqfmbwmaphz/sql
   - Make sure you're logged in with your Supabase admin account

2. **Copy and Paste the Setup SQL:**
   - Open the file: `SETUP_DATABASE.sql` in this project
   - Copy all the SQL code
   - Paste it into the Supabase SQL Editor
   - Click "Run" button

3. **Wait for Completion:**
   - The script will:
     - ✅ Temporarily enable anonymous user inserts
     - ✅ Insert hero content
     - ✅ Insert event spaces
     - ✅ Insert menu categories (4 items)
     - ✅ Insert menus (6 items)
     - ✅ Insert rooms (3 rooms)
     - ✅ Insert room images

4. **Verify Success:**
   - You should see the data counts at the end
   - Or run the verification queries at the bottom of the SQL file

5. **Back to App:**
   - Refresh your browser: http://localhost:8080/
   - The homepage should now display all content!

---

## Alternative: Use Node.js Script (Advanced)

If you want to seed via code, you'll need to:

1. Get your **Service Role Key** from Supabase:
   - Go to: Settings > API > Service Role Key
   - Copy the key

2. Update `scripts/seed-database.js`:
   - Replace `VITE_SUPABASE_PUBLISHABLE_KEY` with your **Service Role Key**
   - Keep `VITE_SUPABASE_URL` the same

3. Run the seeding script:
   ```bash
   npm run seed
   ```

---

## Security Notes

⚠️ **Important:**
- The `SETUP_DATABASE.sql` file contains temporary RLS policies that allow anonymous inserts
- After seeding is complete, these policies should be removed:
  ```sql
  DROP POLICY IF EXISTS "Anyone can insert hero content for seeding" ON public.hero_content;
  DROP POLICY IF EXISTS "Anyone can insert event spaces for seeding" ON public.event_spaces;
  -- ... (remove all seeding policies)
  ```
- Then ensure only **Authenticated Admin** users can insert/update data

---

## Troubleshooting

### Still seeing "Loading" screen?
- Check browser console (F12) for errors
- Verify data was inserted by running:
  ```sql
  SELECT COUNT(*) FROM public.hero_content;
  SELECT COUNT(*) FROM public.menus;
  SELECT COUNT(*) FROM public.rooms;
  ```

### Getting "RLS policy violation" errors?
- Make sure the RLS policies in `SETUP_DATABASE.sql` were applied first
- Don't skip the policy creation step

### Data not appearing?
- Hard refresh the browser: `Ctrl+Shift+R` or `Cmd+Shift+R`
- Check that `is_active = true` for all inserted data
- Verify no errors in React component console logs (F12 > Console tab)

---

## File Structure

```
project/
├── SETUP_DATABASE.sql          ← Run this SQL in Supabase Dashboard
├── scripts/
│   └── seed-database.js        ← Alternative: Node.js seeding script
├── supabase/
│   └── migrations/             ← Database schema and triggers
└── src/
    ├── hooks/
    │   └── useContentData.tsx  ← React hooks fetching data from Supabase
    └── components/
        ├── HeroSection.tsx
        ├── EventsSection.tsx
        ├── RoomsSection.tsx
        ├── MenuSection.tsx
        └── ...
```

---

## Next Steps

1. ✅ Seed the database with sample data
2. 🔄 Refresh the website
3. 📝 Verify all sections load with data
4. 🔐 Remove temporary RLS seeding policies
5. 🚀 Customize the data with your actual content

