# REDP Mobile Client (Phase 2 - T05)

A Progressive Web App (PWA) for sales team mobile access.

## Features

- **Today's Tasks**: View customers needing follow-up today
- **Property Listings**: Browse available properties with filtering
- **Customer Management**: View and manage customer information
- **Follow-up Logging**: Record follow-up interactions quickly
- **Offline Support**: Key data cached for offline access
- **Bilingual Support**: Chinese (CN) and Uyghur (UG)

## Tech Stack

- Frontend: HTML5, JavaScript (ES2021)
- Styling: Tailwind CSS CDN
- PWA: Service Worker + Cache API
- Backend: Supabase Edge Functions

## File Structure

```
mobile_client/
├── index.html          # Main application shell
├── sw.js               # Service Worker for offline support
├── manifest.json       # PWA manifest (to be created)
├── css/
│   └── main.css        # Additional styles
└── js/
    ├── app.js          # Application logic
    └── utils.js        # Helper functions
```

## Installation

### Deploy to Supabase Storage

```bash
# Upload to Supabase Storage (public bucket)
supabase storage cp mobile_client/ ss:///mobile/ --recursive

# Access URL
# https://<project>.supabase.co/storage/v1/object/public/mobile/index.html
```

## Usage

1. Open the PWA URL in a mobile browser
2. Log in with your sales team credentials
3. View today's tasks, browse properties, and manage customers
4. The app works offline - data syncs when connection is restored

## Configuration

Set these environment variables for production:

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
NVIDIA_NIM_API_KEY=<your-nvidia-api-key>  # For AI features
```

## Features in Detail

### Today's Tasks
- Shows customers with follow-ups scheduled for today
- Displays customer intent scores
- Quick access to add new follow-up records

### Property Listings
- Filter by status (Available, Reserved, Sold)
- View property details and pricing
- Search functionality

### Customer Management
- List all assigned customers
- View customer intent scores
- Quick access to add follow-ups

### Follow-up Logging
- Select from multiple follow-up types (Call, Visit, WeChat, Site Visit)
- Record customer feedback
- Schedule next follow-up date

## Offline Support

The Service Worker caches:
- `index.html`
- `js/app.js`
- `css/main.css`

Data is cached via IndexedDB for:
- Customer list
- Property list
- Follow-up history

## Bilingual Support

Switch between Chinese and Uyghur by clicking the "CN / UG" button in the top right.

For Uyghur display, the app uses:
- `Noto Naskh Arabic` font (Google Fonts)
- RTL layout support
- Translation function for UI strings

## Development

```bash
# Start a local server
npx http-server .

# Or use Python
python -m http.server 8080
```

## Testing

1. Open in Chrome/Safari on mobile or mobile simulation mode
2. Check Service Worker registration in DevTools
3. Test offline mode by disconnecting network
4. Verify bilingual display works correctly

## Deployment Checklist

- [ ] Upload all files to Supabase Storage
- [ ] Set proper CORS rules for Edge Functions
- [ ] Configure PWA manifest with correct icons
- [ ] Test on various mobile devices
- [ ] Verify offline functionality
- [ ] Test bilingual switching
