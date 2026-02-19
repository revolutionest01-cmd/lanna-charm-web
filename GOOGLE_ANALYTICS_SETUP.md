# Google Analytics Setup Guide

Google Analytics 4 has been successfully integrated into your website. Follow these steps to complete the setup and start tracking visitor data.

## Step 1: Create a Google Analytics Account (if you don't have one)

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Start measuring" or create a new account
4. Fill in your account details:
   - Account name: Your cafe/business name
   - Website URL: Your website domain
   - Industry category: Select "Food & Beverage"
   - Business size: Select appropriate size
   - Check all relevant objectives

## Step 2: Get Your Measurement ID

After creating your property:

1. Click on **Admin** (gear icon at bottom left)
2. In the left column under **Property**, click on **Data Streams**
3. Click on your **Web** stream
4. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

## Step 3: Configure Environment Variable

Add your Measurement ID to your `.env` file:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

## Step 4: Restart the Development Server

```bash
npm run dev
```

The console will show a confirmation message:
```
Google Analytics initialized with ID: G-XXXXXXXXXX
```

## What's Being Tracked

### Automatic Tracking
- **Page Views**: Every navigation to a new page is automatically tracked
- **Session Duration**: How long users stay on your site
- **User Demographics**: Browser, device type, location (if enabled)
- **Traffic Source**: Where visitors come from

### Example Events Already Configured
- Booking form submissions
- Contact form submissions
- Menu item clicks
- Page navigation

## Using Custom Event Tracking

To track custom events (button clicks, interactions, etc.), use the `trackGAEvent` function:

```typescript
import { trackGAEvent } from '@/lib/googleAnalytics';

// Track a custom event
trackGAEvent('book_room_click', {
  room_type: 'deluxe',
  price: 1500
});

// For file downloads
trackGAEvent('download_menu', {
  file_name: 'menu.pdf'
});

// For video plays
trackGAEvent('video_play', {
  video_title: 'Cafe Tour'
});
```

## Viewing Your Analytics Data

1. Go to [Google Analytics Dashboard](https://analytics.google.com/)
2. Select your property
3. Navigate to:
   - **Home**: Overview of traffic and users
   - **Reports** > **User**: See who's visiting
   - **Reports** > **Traffic sources**: Where traffic comes from
   - **Reports** > **Pages and screens**: Most visited pages
   - **Reports** > **Events**: Custom events you're tracking

## Real-Time Verification

To verify Google Analytics is working:

1. Open your website in a browser
2. In Google Analytics dashboard, go to **Reports** > **Real-time**
3. You should see yourself as an active user
4. Navigate through different pages and watch the pageviews update in real-time

## Common Use Cases

### Track Booking Submissions
```typescript
import { trackGAEvent } from '@/lib/googleAnalytics';

const handleBookingSubmit = async (bookingData) => {
  trackGAEvent('booking_submitted', {
    room_type: bookingData.roomType,
    check_in_date: bookingData.checkIn,
    nights: bookingData.nights
  });
  // ... rest of submission logic
};
```

### Track Contact Form
```typescript
const handleContactSubmit = async (formData) => {
  trackGAEvent('contact_form_submitted', {
    subject: formData.subject,
    message_length: formData.message.length
  });
  // ... rest of submission logic
};
```

### Track Menu Item Clicks
```typescript
const handleMenuItemClick = (item) => {
  trackGAEvent('menu_item_clicked', {
    item_name: item.name,
    category: item.category,
    price: item.price
  });
  // ... rest of click logic
};
```

## Troubleshooting

### Google Analytics not showing data
- **Issue**: Console shows "Google Analytics Measurement ID not configured"
  - **Solution**: Check that `VITE_GA_MEASUREMENT_ID` is set in your `.env` file and restart the dev server

- **Issue**: Measurement ID in console shows different from entered
  - **Solution**: Make sure you restarted the dev server after updating `.env`

- **Issue**: Real-time dashboard shows no activity
  - **Wait**: Real-time data can take 30 seconds to update
  - **Check**: Verify the Measurement ID is correct in the console

### No Real-Time Activity
- GA4 can take up to 24-48 hours to show historical data
- Real-time data should appear within 30 seconds
- Check that your ad blockers aren't blocking Google Analytics

## Production Deployment

The Google Analytics setup will automatically work in production as long as:
1. The `VITE_GA_MEASUREMENT_ID` environment variable is set
2. Your domain is allowed in Google Analytics property settings

### Steps for Production
1. In Google Analytics Admin > Property Settings
2. Under **Property URL**, enter your production domain
3. Save changes
4. Set the environment variable in your production environment (hosting provider's dashboard)

## Security & Privacy

- Google Analytics data is anonymous (unless you set user IDs)
- Complies with most privacy regulations
- Configure your Privacy Policy to mention Google Analytics usage
- Users can opt-out using browser extensions or privacy tools

## Need Help?

- [Google Analytics Help Center](https://support.google.com/analytics)
- [GA4 Property Setup Guide](https://support.google.com/analytics/answer/9304153)
- [React-GA4 Documentation](https://github.com/react-ga/react-ga4)
