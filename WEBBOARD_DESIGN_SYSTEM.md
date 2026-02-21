# Webboard - Visual Design Guide

## 🎨 Color Scheme

### Primary Palette
```
Blue (Primary):          #0066FF / #3B82F6
Purple (Accent):         #9333EA / #A855F7
Emerald (Success):       #10B981
Rose (Error/Like):       #EF4444 / #F87171
Amber (Warning):         #F59E0B
```

### Background Gradients
```
Light Mode:
from-blue-50 via-white to-purple-50

Dark Mode:
from-slate-950 via-slate-900 to-slate-950
```

### Component Colors by Category
```
General:        Blue     (bg-blue-50, text-blue-700)
Question:       Emerald  (bg-emerald-50, text-emerald-700)
Review:         Rose     (bg-rose-50, text-rose-700)
Shopping:       Amber    (bg-amber-50, text-amber-700)
```

---

## 📐 Typography

### Font Stack
- Headers: `font-serif` (elegant, premium)
- Body: `font-sans` (clean, readable)

### Sizes & Weights
```
H1 (Page Title):         3xl (30px) bold
H2 (Section Title):      2xl (24px) bold
H3 (Card Title):         lg (18px) semibold
Body (Default):          base (16px) normal
Caption (Meta):          sm/xs (14px/12px) medium
```

### Line Heights
- Headers: tight (1.2)
- Body: relaxed (1.6)
- Lists: default (1.5)

---

## 🎯 Layout System

### Spacing Scale
```
xs: 2px     16: 4rem
sm: 4px     20: 5rem
md: 8px     24: 6rem
lg: 16px    28: 7rem
xl: 24px    32: 8rem
2xl: 32px   36: 9rem
3xl: 48px   40: 10rem
4xl: 64px   44: 11rem
6xl: 96px   48: 12rem
```

### Breakpoints
```
Mobile:   < 640px (sm)
Tablet:   640px - 1024px (md-lg)
Desktop:  > 1024px (xl)
```

### Grid System
```
Main Layout:    max-w-7xl (80rem / 1280px)
Article Layout: max-w-4xl (56rem / 896px)
Container:      mx-auto with responsive px
```

---

## 🧩 Component Styles

### Cards
```
Border:      border border-blue-100/50 dark:border-blue-800/50
Radius:      rounded-xl (8px) or rounded-2xl (16px)
Shadow:      shadow-sm hover:shadow-md
Padding:     p-4 sm:p-6 (responsive)
```

### Buttons
```
Primary:     bg-gradient-to-r from-blue-600 to-purple-600
            hover:from-blue-700 hover:to-purple-700
Secondary:   bg-white border border-gray-200 hover:bg-gray-50
Outlined:    border-2 border-current hover:bg-[color]/5
Disabled:    opacity-50 cursor-not-allowed
```

### Input Fields
```
Border:      border border-blue-200 dark:border-blue-800
Radius:      rounded-lg
Focus:       focus:ring-2 focus:ring-blue-500
Padding:     px-3 py-2
Height:      h-10 (40px)
```

### Badges
```
Radius:      rounded-lg
Padding:     px-3 py-1.5
Font:        text-xs font-semibold
Colors:      category-specific gradients
```

### Avatars
```
Size:        w-6 h-6 (small), w-8 h-8 (medium), w-10 h-10 (large)
Radius:      rounded-full
Border:      border-2 border-blue-200 dark:border-blue-800
Background:  gradient-to-br from-[color1] to-[color2]
```

---

## ✨ Interactive Effects

### Transitions
```
Default:     transition-all duration-300
Shadow:      transition-shadow duration-300
Colors:      transition-colors duration-200
Scale:       transition-transform duration-300
```

### Hover States
```
Cards:       hover:shadow-md hover:bg-blue-50/50
Links:       hover:text-blue-600 hover:underline
Buttons:     hover:opacity-90 hover:scale-105
Icons:       hover:text-current (color change)
```

### Active States
```
Tab:         bg-gradient-to-r from-blue-500 to-purple-500
Category:    bg-gradient-to-r with text-white
Like:        fill-red-500 color-red-500 (filled heart)
```

### Loading States
```
Spinner:     border-4 border-blue-200 border-t-blue-600 animate-spin
Text:        opacity-50 cursor-not-allowed
Button:      flex items-center justify-center
```

---

## 🌙 Dark Mode Colors

### Dark Mode Adjustments
```
Background:      from-slate-950 dark:to-slate-900
Cards:           bg-slate-800/50
Text Primary:    text-gray-900 dark:text-white
Text Secondary:  text-gray-600 dark:text-gray-300
Text Tertiary:   text-gray-500 dark:text-gray-400
Borders:         border-gray-200 dark:border-gray-700
```

### Dark Mode Overlays
```
Hover:           hover:bg-slate-700/30
Focus:           focus:bg-slate-600/30
Disabled:        opacity-50
```

---

## 📱 Responsive Design

### Mobile First Approach
```
Default:         Mobile (< 640px)
sm:              Small (≥ 640px)
md:              Medium (≥ 768px)
lg:              Large (≥ 1024px)
xl:              Extra Large (≥ 1280px)
```

### Responsive Examples
```
Text Size:       text-base sm:text-lg md:text-xl
Padding:         p-4 sm:p-6 lg:p-8
Display:         hidden sm:block lg:grid
Grid:            grid-cols-1 lg:grid-cols-3
```

---

## 🎬 Animations

### Keyframes
```
Spin:      animate-spin (infinite rotate)
Pulse:     animate-pulse (fade in/out)
Bounce:    animate-bounce (up/down)
Shimmer:   opacity pulse effect
```

### Usage
```
Loading:       <Loader2 className="animate-spin" />
Attention:     animate-bounce for new content
Fade:          animate-pulse for placeholders
Transitions:   smooth property changes
```

---

## 📊 Component Breakdowns

### Forum Page
```
Header:        sticky top-0 z-50 backdrop-blur
Hero:          gradient bg p-8 sm:p-12
Search Bar:    w-full responsive
Create Btn:    whitespace-nowrap
Category Tabs: overflow-x-auto pb-2
Main Content:  grid-cols-1 lg:grid-cols-3 gap-8
Sidebar:       sticky top-24
```

### Topic Detail Page
```
Header:        minimal with back button
Topic Card:    p-6 sm:p-8 large padding
Meta Info:     flex flex-wrap responsive
Image:         max-h-96 w-full object-cover
Content:       prose prose-sm responsive
Replies:       space-y-4 divided
Form:          sticky or scrolling
```

### Topic Card (Component)
```
List:          flex gap-4 image left
Compact:       flex gap-3 minimal layout
Featured:      p-0 overflow image top
```

---

## 🚀 Performance Considerations

### Optimizations
1. **CSS Classes**: Use Tailwind for zero CSS
2. **Images**: Responsive with srcset where possible
3. **Lazy Loading**: Load topics on scroll
4. **Caching**: Browser caching enabled
5. **Dark Mode**: CSS variables for theme switching

### File Sizes (Target)
- CSS Bundle: < 50KB (gzipped)
- JS Bundle: < 200KB (gzipped)
- Images: Optimized WebP where possible

---

## 📝 Usage Examples

### Creating a New Component
```typescript
// 1. Use color system from forumConfig
const colors = getCategoryColor(category);

// 2. Follow spacing scale
className="p-4 sm:p-6 gap-4"

// 3. Use responsive design
className="grid-cols-1 md:grid-cols-2"

// 4. Add transitions
className="transition-all duration-300"

// 5. Support dark mode
className="dark:bg-slate-800" 
```

### Styling Patterns
```
Cards:         border rounded-xl shadow-sm hover:shadow-md
Buttons:       rounded-lg px-4 h-10 transition
Inputs:        rounded-lg border px-3 py-2
Text Colors:   gray-900 dark:text-white
Backgrounds:   gradient-to-br from-X to-Y
```

---

## ✅ Design Checklist

- [ ] Colors match palette
- [ ] Typography follows scale
- [ ] Spacing is consistent
- [ ] Responsive on mobile/tablet/desktop
- [ ] Dark mode works properly
- [ ] Hover/focus states visible
- [ ] Loading states clear
- [ ] Error states obvious
- [ ] Accessibility labels present
- [ ] Component reusable

---

## 🎨 Design Tools

### Tailwind CSS Config
- Colors: Preset palette
- Spacing: Consistent scale
- Typography: Optimized fonts
- Breakpoints: Mobile-first

### Components Used
- shadcn/ui: Button, Card, Badge, Avatar
- lucide-react: Icons (Heart, Eye, MessageCircle, etc.)
- Custom: TopicCard, forumConfig

---

**Design System v1.0 - Premium Webboard Experience** ✨
