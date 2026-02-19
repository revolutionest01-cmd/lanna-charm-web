# Google Analytics Quick Reference

## Quick Start

Google Analytics 4 is now integrated into your website with automatic page tracking and custom event support.

### 1. Set Your Measurement ID

Add to your `.env` file:
```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Get your ID from: Google Analytics > Admin > Data Streams > Web Stream

### 2. Tracking is Automatic

- All page navigation is automatically tracked
- No additional code needed for basic tracking

## Tracking Custom Events

### Event Examples in Your Components

#### Track Booking Button Click
```typescript
import { trackGAEvent } from '@/lib/googleAnalytics';

const BookingButton = () => {
  const handleClick = () => {
    trackGAEvent('booking_initiated', {
      source: 'homepage',
      timestamp: new Date().toISOString()
    });
    // ... open booking dialog
  };
  
  return <button onClick={handleClick}>Book Now</button>;
};
```

#### Track Contact Form Submission
```typescript
import { trackGAEvent } from '@/lib/googleAnalytics';

const ContactForm = () => {
  const handleSubmit = async (formData) => {
    trackGAEvent('contact_form_submitted', {
      subject_length: formData.subject.length,
      has_phone: !!formData.phone
    });
    // ... submit form
  };
  
  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
};
```

#### Track Menu Item Views
```typescript
import { trackGAEvent } from '@/lib/googleAnalytics';

const MenuItem = ({ item }) => {
  const handleClick = () => {
    trackGAEvent('menu_item_viewed', {
      item_id: item.id,
      category: item.category,
      in_stock: item.in_stock
    });
  };
  
  return <div onClick={handleClick}>{item.name}</div>;
};
```

## API Reference

### `initializeGA()`
Initializes Google Analytics. Called automatically in `src/main.tsx`.

```typescript
import { initializeGA } from '@/lib/googleAnalytics';
initializeGA();
```

### `useGAPageTracking()`
Hook to track page views. Used automatically in App component.

```typescript
import { useGAPageTracking } from '@/lib/googleAnalytics';

function MyComponent() {
  useGAPageTracking(); // Tracks page views on navigation
  return <div>Content</div>;
}
```

### `trackGAEvent(eventName, eventParams)`
Track custom events.

```typescript
import { trackGAEvent } from '@/lib/googleAnalytics';

// Simple event
trackGAEvent('button_click');

// Event with parameters
trackGAEvent('room_booked', {
  room_type: 'deluxe',
  price: 1500,
  nights: 2
});
```

### `setGAUserProperty(propertyName, value)`
Set user properties for segmentation.

```typescript
import { setGAUserProperty } from '@/lib/googleAnalytics';

// Mark user as premium member
setGAUserProperty('user_type', 'premium');

// Track user location
setGAUserProperty('location', 'Bangkok');
```

## Event Parameter Tips

### Recommended Event Parameters

**For E-commerce Events:**
```typescript
trackGAEvent('purchase', {
  transaction_id: '12345',
  value: 1500,
  currency: 'THB',
  items: 2
});
```

**For User Engagement:**
```typescript
trackGAEvent('engagement', {
  engagement_type: 'scroll',
  percentage: 50
});
```

**For Form Submissions:**
```typescript
trackGAEvent('form_submit', {
  form_name: 'contact_form',
  form_type: 'contact',
  form_complete: true
});
```

## Viewing Analytics Data

### Real-Time Dashboard
- Google Analytics > Reports > Real-time
- See live visitor activity

### Page Performance
- Google Analytics > Reports > Pages and screens
- See most visited pages

### User Behavior
- Google Analytics > Reports > Events
- See custom events you're tracking

### Traffic Sources
- Google Analytics > Reports > Traffic sources
- See where visitors come from

## Common Scenarios

### Login Tracking
```typescript
const handleLogin = async (credentials) => {
  try {
    await loginUser(credentials);
    setGAUserProperty('logged_in', 'true');
    trackGAEvent('login', { success: true });
  } catch (error) {
    trackGAEvent('login_failed', { error_type: error.message });
  }
};
```

### Photo Gallery Interaction
```typescript
const handlePhotoClick = (photoIndex) => {
  trackGAEvent('gallery_photo_view', {
    photo_index: photoIndex,
    gallery_type: 'room_photos'
  });
};
```

### Search Functionality
```typescript
const handleSearch = (query) => {
  trackGAEvent('search', {
    search_term: query,
    search_type: 'menu'
  });
};
```

## Debugging

### Check Console Messages
When GA initializes, you should see:
```
Google Analytics initialized with ID: G-XXXXXXXXXX
```

### Missing Measurement ID
If you see this warning:
```
Google Analytics Measurement ID not configured. Please set VITE_GA_MEASUREMENT_ID in your .env file.
```

Make sure:
1. You added `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` to `.env`
2. You restarted the dev server (`npm run dev`)
3. The ID format is correct (starts with `G-`)

### Real-Time Not Showing
- Real-time data updates every 30 seconds
- Make sure you're viewing the correct property in Google Analytics
- Check that ad blockers aren't blocking GA

## Learning Resources

- [Google Analytics Help](https://support.google.com/analytics)
- [GA4 Event Tracking Guide](https://support.google.com/analytics/answer/11091186)
- [react-ga4 GitHub](https://github.com/react-ga/react-ga4)
- [GA4 Best Practices](https://support.google.com/analytics/answer/9964640)
