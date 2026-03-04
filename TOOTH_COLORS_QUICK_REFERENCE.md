# Tooth Colors Quick Reference

## API Endpoint

```
GET  /api/tenant/clinic-settings
PUT  /api/tenant/clinic-settings/tooth_colors
POST /api/tenant/clinic-settings/bulk-update
```

## Data Structure

### Request (Update)

```javascript
{
  key: 'tooth_colors',
  value: {
    healthy: '#FFFFFF',
    cavity: '#E74C3C',
    filling: '#4ECDC4',
    crown: '#FFD93D',
    missing: '#95A5A6',
    implant: '#3498DB',
    root_canal: '#9B59B6'
  },
  type: 'json'
}
```

### Response (Get)

```javascript
{
  "success": true,
  "message": "Clinic settings retrieved successfully",
  "data": {
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
          "setting_type": "json"
        }
      ]
    }
  }
}
```

## Code Usage

### Get Tooth Colors (in Components)

```javascript
import { useClinicSettings } from "@/composables/useClinicSettings";

const { getSetting } = useClinicSettings();

// Get tooth colors
const toothColors = getSetting("display", "tooth_colors");

// Access specific color
const healthyColor = toothColors.healthy; // '#FFFFFF'
const cavityColor = toothColors.cavity; // '#FF6B6B'
```

### Update Tooth Colors (in Settings Page)

```javascript
import {
  updateClinicSetting,
  bulkUpdateClinicSettings,
} from "@/services/clinicSettings.service";

// Single update
await updateClinicSetting("tooth_colors", {
  setting_value: {
    healthy: "#22C55E",
    cavity: "#DC2626",
    filling: "#3B82F6",
    crown: "#F59E0B",
    missing: "#374151",
  },
  setting_type: "json",
});

// Bulk update (recommended)
await bulkUpdateClinicSettings([
  {
    key: "tooth_colors",
    value: {
      /* colors object */
    },
    type: "json",
  },
  // ... other settings
]);
```

## Translations

### English

```javascript
"clinicSettings": {
  "toothColors": "Tooth Colors for Dental Chart",
  "colorCode": "Color Code"
}
```

### Arabic

```javascript
"clinicSettings": {
  "toothColors": "ألوان الأسنان للمخطط السني",
  "colorCode": "كود اللون"
}
```

### Kurdish

```javascript
"clinicSettings": {
  "toothColors": "ڕەنگەکانی ددان بۆ نەخشەی ددانسازی",
  "colorCode": "کۆدی ڕەنگ"
}
```

## Component Structure

### Template

```vue
<v-col
  v-for="(colorItem, key) in toothColors"
  :key="key"
  cols="12"
  sm="6"
  md="4"
>
  <v-card variant="outlined" class="pa-3">
    <div class="d-flex align-center justify-space-between mb-2">
      <span class="text-subtitle-1 font-weight-medium text-capitalize">
        {{ key }}
      </span>
      <v-chip :color="colorItem" size="small" class="tooth-color-chip">
        {{ colorItem }}
      </v-chip>
    </div>
    <v-text-field
      v-model="toothColors[key]"
      :label="$t('clinicSettings.colorCode')"
      variant="outlined"
      density="compact"
      :disabled="!canEdit"
    >
      <template v-slot:append-inner>
        <v-menu :close-on-content-click="false">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              :color="toothColors[key]"
              icon="mdi-eyedropper"
              size="small"
              variant="flat"
              :disabled="!canEdit"
            />
          </template>
          <v-color-picker
            v-model="toothColors[key]"
            mode="hexa"
            :disabled="!canEdit"
          />
        </v-menu>
      </template>
    </v-text-field>
  </v-card>
</v-col>
```

### Script

```javascript
const toothColors = ref({
  healthy: "#FFFFFF",
  cavity: "#FF6B6B",
  filling: "#4ECDC4",
  crown: "#FFD93D",
  missing: "#95A5A6",
});

// Load from API
if (settings.tooth_colors) {
  const colors =
    typeof settings.tooth_colors === "string"
      ? JSON.parse(settings.tooth_colors)
      : settings.tooth_colors;

  if (typeof colors === "object" && colors !== null) {
    toothColors.value = { ...toothColors.value, ...colors };
  }
}

// Save to API
const settings = [
  {
    key: "tooth_colors",
    value: toothColors.value,
    type: "json",
  },
];
await bulkUpdateClinicSettings(settings);
```

### CSS

```css
.tooth-color-chip {
  min-width: 80px;
  font-family: monospace;
  font-size: 11px;
}
```

## Permission Check

```javascript
import { PERMISSIONS } from "@/constants/permissions";
import { useAuthStore } from "@/stores/authNew";

const authStore = useAuthStore();
const canEdit = computed(() =>
  authStore.hasPermission(PERMISSIONS.EDIT_CLINIC_SETTINGS),
);
```

## Default Values

```javascript
const DEFAULT_TOOTH_COLORS = {
  healthy: "#FFFFFF", // White
  cavity: "#E74C3C", // Darker Red (updated)
  filling: "#4ECDC4", // Turquoise
  crown: "#FFD93D", // Yellow
  missing: "#95A5A6", // Gray
  implant: "#3498DB", // Blue (NEW)
  root_canal: "#9B59B6", // Purple (NEW)
};
```

## Validation

```javascript
// Validate hex color
const isValidHex = (color) => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

// Sanitize color value
const sanitizeColor = (color) => {
  return color.toUpperCase().trim();
};
```

## Testing

### Unit Test Example

```javascript
import { mount } from '@vue/test-utils'
import Settings from '@/views/pages/Settings.vue'

describe('Tooth Colors', () => {
  it('displays tooth colors correctly', () => {
    const wrapper = mount(Settings)
    expect(wrapper.find('.tooth-color-chip').exists()).toBe(true)
  })

  it('updates color on picker change', async () => {
    const wrapper = mount(Settings)
    await wrapper.vm.toothColors.healthy = '#FF0000'
    expect(wrapper.vm.toothColors.healthy).toBe('#FF0000')
  })
})
```

## Troubleshooting

### Colors not loading

```javascript
// Check if API response is valid
console.log("Settings:", settings);
console.log("Tooth Colors:", settings.tooth_colors);

// Verify JSON parsing
try {
  const parsed = JSON.parse(settings.tooth_colors);
  console.log("Parsed:", parsed);
} catch (e) {
  console.error("Parse error:", e);
}
```

### Colors not saving

```javascript
// Check bulk update payload
console.log("Saving settings:", settings);

// Verify permission
console.log("Can edit:", canEdit.value);

// Check API response
const response = await bulkUpdateClinicSettings(settings);
console.log("Response:", response);
```

### Color picker not opening

```javascript
// Verify Vuetify version
// Ensure v-menu and v-color-picker are properly installed

// Check disabled state
console.log("Can edit:", canEdit.value);
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## Performance Notes

- Colors are cached for 5 minutes
- Changes trigger cache refresh
- Minimal re-renders on color change
- Lazy loading of color picker component
