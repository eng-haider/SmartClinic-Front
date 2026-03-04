# Tooth Colors Configuration Feature

## Overview

This feature allows clinic administrators to view and update tooth colors for the dental chart directly from the clinic settings page. The tooth colors are stored in the API under the `display` category with the setting key `tooth_colors`.

## API Integration

### Endpoint

```
GET/PUT https://api.smartclinic.software/api/tenant/clinic-settings
```

### Response Structure (Display Category)

```json
{
  "display": {
    "label": "Display Settings",
    "settings": [
      {
        "id": 25,
        "setting_key": "tooth_colors",
        "setting_value": {
          "healthy": "#FFFFFF",
          "cavity": "#E74C3C",
          "filling": "#4ECDC4",
          "crown": "#FFD93D",
          "missing": "#95A5A6",
          "implant": "#3498DB",
          "root_canal": "#9B59B6"
        },
        "setting_value_raw": "{\"healthy\":\"#FFFFFF\",\"cavity\":\"#E74C3C\",\"filling\":\"#4ECDC4\",\"crown\":\"#FFD93D\",\"missing\":\"#95A5A6\",\"implant\":\"#3498DB\",\"root_canal\":\"#9B59B6\"}",
        "setting_type": "json",
        "description": "Tooth status colors for dental chart",
        "is_required": false,
        "display_order": 25,
        "is_active": true,
        "updated_at": "2026-02-10 08:17:46"
      }
    ]
  }
}
```

## Implementation Details

### Files Modified

1. **`src/views/pages/Settings.vue`**
   - Added tooth colors section in the Display Settings card
   - Added reactive variable `toothColors` to store color values
   - Updated `loadClinicSettings()` to parse `tooth_colors` from API
   - Updated `saveAllSettings()` to include `tooth_colors` in bulk update
   - Added custom CSS for tooth color chips

2. **`src/locales/en.json`**
   - Added translations:
     - `clinicSettings.toothColors`: "Tooth Colors for Dental Chart"
     - `clinicSettings.colorCode`: "Color Code"

3. **`src/locales/ar.json`**
   - Added Arabic translations:
     - `clinicSettings.toothColors`: "ألوان الأسنان للمخطط السني"
     - `clinicSettings.colorCode`: "كود اللون"

4. **`src/locales/ku.json`**
   - Added Kurdish translations:
     - `clinicSettings.toothColors`: "ڕەنگەکانی ددان بۆ نەخشەی ددانسازی"
     - `clinicSettings.colorCode`: "کۆدی ڕەنگ"

### UI Components

The tooth colors section appears under the Display Settings tab and includes:

- **Divider** - Separates tooth colors from other display settings
- **Section Header** - With tooth icon and title
- **Color Cards** - Grid layout (3 columns on desktop, 2 on tablet, 1 on mobile)
  - Each card shows:
    - Status name (e.g., "healthy", "cavity")
    - Current color as a chip with hex code
    - Text field with color picker for editing
    - Color picker button with eyedropper icon

### Features

✅ **View Current Colors** - Display all tooth status colors from the API
✅ **Edit Colors** - Use color picker or manually enter hex codes
✅ **Visual Feedback** - Color chip shows current selection
✅ **Responsive Design** - Adapts to different screen sizes
✅ **Multilingual Support** - English, Arabic, and Kurdish
✅ **Permission-Based Access** - Respects edit permissions
✅ **Bulk Update** - Saves all settings together
✅ **Cache Management** - Refreshes cache after save

## Usage

1. Navigate to **Settings > Clinic**
2. Scroll to the **Display Settings** section
3. Find the **Tooth Colors for Dental Chart** subsection
4. Click the color picker button (eyedropper icon) to select a new color
5. Or manually type the hex code in the text field
6. Click **Save** button at the bottom to update all settings
7. Success notification will confirm the changes

## Tooth Status Types

The following tooth statuses can be customized:

- **healthy** - Default: #FFFFFF (White)
- **cavity** - Default: #E74C3C (Darker Red) - Updated from #FF6B6B
- **filling** - Default: #4ECDC4 (Turquoise)
- **crown** - Default: #FFD93D (Yellow)
- **missing** - Default: #95A5A6 (Gray)
- **implant** - Default: #3498DB (Blue) - NEW
- **root_canal** - Default: #9B59B6 (Purple) - NEW

## API Update Request

When saving, the tooth colors are sent to the API as part of a bulk update:

```javascript
{
  settings: [
    // ... other settings
    {
      key: "tooth_colors",
      value: {
        healthy: "#FFFFFF",
        cavity: "#E74C3C",
        filling: "#4ECDC4",
        crown: "#FFD93D",
        missing: "#95A5A6",
        implant: "#3498DB",
        root_canal: "#9B59B6",
      },
      type: "json",
    },
  ];
}
```

## Permissions

- **View**: All users with access to clinic settings
- **Edit**: Users with `EDIT_CLINIC_SETTINGS` permission only

## Technical Notes

- Colors are stored as JSON in the database
- The API automatically handles JSON parsing/stringification
- The composable `useClinicSettings` manages caching
- After save, the cache is refreshed to reflect changes across the app
- Color validation ensures only valid hex codes are accepted

## Future Enhancements

Potential improvements:

- Add preset color schemes
- Allow adding custom tooth statuses
- Preview tooth chart with selected colors
- Import/export color themes
- Color accessibility checker
