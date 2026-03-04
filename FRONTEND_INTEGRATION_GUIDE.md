# 📱 Frontend Integration Guide - Tooth Colors Update

## 🎨 What Changed

The tooth colors setting now has **7 statuses** (previously 5):

```javascript
{
  "healthy": "#FFFFFF",      // White (unchanged)
  "cavity": "#E74C3C",       // ← CHANGED: Darker red (was #FF6B6B)
  "filling": "#4ECDC4",      // Teal (unchanged)
  "crown": "#FFD93D",        // Yellow (unchanged)
  "missing": "#95A5A6",      // Gray (unchanged)
  "implant": "#3498DB",      // ← NEW: Blue
  "root_canal": "#9B59B6"    // ← NEW: Purple
}
```

---

## 🔧 What Frontend Needs to Do

### 1. Fetch Tooth Colors from API

```javascript
// Get tooth colors setting
const response = await fetch("/api/tenant/clinic-settings/tooth_colors", {
  headers: {
    Authorization: `Bearer ${token}`,
    "X-Tenant-ID": tenantId,
    "Content-Type": "application/json",
  },
});

const { data } = await response.json();
const toothColors = data.setting_value; // Object with 7 colors

console.log(toothColors);
// {
//   healthy: "#FFFFFF",
//   cavity: "#E74C3C",
//   filling: "#4ECDC4",
//   crown: "#FFD93D",
//   missing: "#95A5A6",
//   implant: "#3498DB",      ← NEW
//   root_canal: "#9B59B6"    ← NEW
// }
```

---

### 2. Update Dental Chart Component

**Option A: If using hardcoded colors** ❌ (Don't do this)

```javascript
// OLD - Don't do this anymore
const TOOTH_COLORS = {
  cavity: "#FF6B6B", // ❌ Old color
  // Missing new statuses
};
```

**Option B: Use API colors** ✅ (Do this)

```javascript
// NEW - Get colors from API
const [toothColors, setToothColors] = useState(null);

useEffect(() => {
  fetchToothColors();
}, []);

const fetchToothColors = async () => {
  const response = await fetch("/api/tenant/clinic-settings/tooth_colors", {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Tenant-ID": tenantId,
    },
  });
  const { data } = await response.json();
  setToothColors(data.setting_value);
};

// Use in component
<Tooth
  status="cavity"
  color={toothColors?.cavity || "#E74C3C"} // Fallback to new color
/>;
```

---

### 3. Add New Status Options in UI

If you have a dropdown/selector for tooth status:

```javascript
// OLD - 5 statuses
const toothStatuses = [
  { value: "healthy", label: "صحي", color: "#FFFFFF" },
  { value: "cavity", label: "تسوس", color: "#FF6B6B" },
  { value: "filling", label: "حشوة", color: "#4ECDC4" },
  { value: "crown", label: "تاج", color: "#FFD93D" },
  { value: "missing", label: "مفقود", color: "#95A5A6" },
];

// NEW - 7 statuses (add these two)
const toothStatuses = [
  { value: "healthy", label: "صحي", label_en: "Healthy", color: "#FFFFFF" },
  { value: "cavity", label: "تسوس", label_en: "Cavity", color: "#E74C3C" }, // ← Updated color
  { value: "filling", label: "حشوة", label_en: "Filling", color: "#4ECDC4" },
  { value: "crown", label: "تاج", label_en: "Crown", color: "#FFD93D" },
  { value: "missing", label: "مفقود", label_en: "Missing", color: "#95A5A6" },
  { value: "implant", label: "زراعة", label_en: "Implant", color: "#3498DB" }, // ← NEW
  {
    value: "root_canal",
    label: "علاج جذور",
    label_en: "Root Canal",
    color: "#9B59B6",
  }, // ← NEW
];
```

---

### 4. Example: Complete Dental Chart Component

```javascript
import { useEffect, useState } from "react";
import { fetchClinicSetting } from "@/api/settings";

const DentalChart = () => {
  const [toothColors, setToothColors] = useState({
    healthy: "#FFFFFF",
    cavity: "#E74C3C",
    filling: "#4ECDC4",
    crown: "#FFD93D",
    missing: "#95A5A6",
    implant: "#3498DB",
    root_canal: "#9B59B6",
  });

  const [teeth, setTeeth] = useState({
    // tooth_id: status
    1: "healthy",
    2: "cavity",
    3: "filling",
    // ... etc
  });

  useEffect(() => {
    loadToothColors();
  }, []);

  const loadToothColors = async () => {
    try {
      const data = await fetchClinicSetting("tooth_colors");
      setToothColors(data.setting_value);
    } catch (error) {
      console.error("Failed to load tooth colors:", error);
      // Keep default colors
    }
  };

  const getToothColor = (status) => {
    return toothColors[status] || "#FFFFFF";
  };

  return (
    <div className="dental-chart">
      {Object.entries(teeth).map(([toothId, status]) => (
        <Tooth
          key={toothId}
          id={toothId}
          status={status}
          color={getToothColor(status)}
          onChange={(newStatus) => handleToothChange(toothId, newStatus)}
        />
      ))}

      {/* Legend */}
      <div className="legend">
        {Object.entries(toothColors).map(([status, color]) => (
          <div key={status} className="legend-item">
            <span className="color-box" style={{ backgroundColor: color }} />
            <span>{getStatusLabel(status)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const getStatusLabel = (status) => {
  const labels = {
    healthy: "صحي",
    cavity: "تسوس",
    filling: "حشوة",
    crown: "تاج",
    missing: "مفقود",
    implant: "زراعة", // NEW
    root_canal: "علاج جذور", // NEW
  };
  return labels[status] || status;
};
```

---

### 5. Update Tooth Status Selector

```javascript
const ToothStatusSelector = ({ currentStatus, onChange, toothColors }) => {
  const statuses = [
    { key: "healthy", label: "صحي", icon: "🦷" },
    { key: "cavity", label: "تسوس", icon: "🔴" },
    { key: "filling", label: "حشوة", icon: "🔵" },
    { key: "crown", label: "تاج", icon: "👑" },
    { key: "missing", label: "مفقود", icon: "❌" },
    { key: "implant", label: "زراعة", icon: "🔩" }, // NEW
    { key: "root_canal", label: "علاج جذور", icon: "💜" }, // NEW
  ];

  return (
    <div className="status-selector">
      {statuses.map(({ key, label, icon }) => (
        <button
          key={key}
          className={currentStatus === key ? "active" : ""}
          style={{
            backgroundColor: toothColors[key],
            color: key === "healthy" ? "#000" : "#fff",
          }}
          onClick={() => onChange(key)}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
};
```

---

## 📋 Frontend Checklist

- [ ] ✅ **Fetch tooth colors from API** (don't hardcode)
- [ ] ✅ **Update cavity color** from `#FF6B6B` to `#E74C3C`
- [ ] ✅ **Add "implant" status** with blue color `#3498DB`
- [ ] ✅ **Add "root_canal" status** with purple color `#9B59B6`
- [ ] ✅ **Update any dropdowns/selectors** to include new statuses
- [ ] ✅ **Add Arabic labels**: زراعة (implant), علاج جذور (root_canal)
- [ ] ✅ **Test with existing patient cases**

---

## 🧪 Testing

```javascript
// Test API call
const testToothColors = async () => {
  const response = await fetch("/api/tenant/clinic-settings/tooth_colors", {
    headers: {
      Authorization: "Bearer YOUR_TOKEN",
      "X-Tenant-ID": "clinic_1",
    },
  });
  const { data } = await response.json();

  console.log("Tooth Colors:", data.setting_value);
  console.assert(
    data.setting_value.cavity === "#E74C3C",
    "Cavity color updated",
  );
  console.assert(
    data.setting_value.implant === "#3498DB",
    "Implant color exists",
  );
  console.assert(
    data.setting_value.root_canal === "#9B59B6",
    "Root canal color exists",
  );
  console.log("✅ All tests passed!");
};
```

---

## 📱 Mobile App (if applicable)

Same approach:

1. Fetch colors from API
2. Add two new status options
3. Update UI to show 7 colors instead of 5

```swift
// iOS Example
struct ToothColors: Codable {
    let healthy: String
    let cavity: String
    let filling: String
    let crown: String
    let missing: String
    let implant: String      // NEW
    let rootCanal: String    // NEW

    enum CodingKeys: String, CodingKey {
        case healthy, cavity, filling, crown, missing, implant
        case rootCanal = "root_canal"
    }
}
```

```kotlin
// Android Example
data class ToothColors(
    val healthy: String,
    val cavity: String,
    val filling: String,
    val crown: String,
    val missing: String,
    val implant: String,      // NEW
    @SerializedName("root_canal")
    val rootCanal: String     // NEW
)
```

---

## 🎨 Visual Reference for Frontend

```
Old (5 statuses):
🦷 صحي       ⚪ #FFFFFF
🦷 تسوس      🔴 #FF6B6B  ← Will change
🦷 حشوة      🔵 #4ECDC4
🦷 تاج       🟡 #FFD93D
🦷 مفقود     ⚫ #95A5A6

New (7 statuses):
🦷 صحي       ⚪ #FFFFFF
🦷 تسوس      🔴 #E74C3C  ← New darker red
🦷 حشوة      🔵 #4ECDC4
🦷 تاج       🟡 #FFD93D
🦷 مفقود     ⚫ #95A5A6
🦷 زراعة     🔵 #3498DB  ← NEW
🦷 علاج جذور 🟣 #9B59B6  ← NEW
```

---

## 🔄 Vue.js Integration (Current Admin Panel)

### Using Composable

```vue
<script setup>
import { ref, onMounted } from "vue";
import { useClinicSettings } from "@/composables/useClinicSettings";

const { getSetting } = useClinicSettings();

const toothColors = ref({
  healthy: "#FFFFFF",
  cavity: "#E74C3C",
  filling: "#4ECDC4",
  crown: "#FFD93D",
  missing: "#95A5A6",
  implant: "#3498DB",
  root_canal: "#9B59B6",
});

onMounted(async () => {
  const colors = await getSetting("display", "tooth_colors");
  if (colors) {
    toothColors.value = colors;
  }
});
</script>

<template>
  <div class="dental-chart">
    <div
      v-for="(color, status) in toothColors"
      :key="status"
      class="tooth-status"
      :style="{ backgroundColor: color }"
    >
      {{ status }}
    </div>
  </div>
</template>
```

---

## 🌐 Translation Keys to Add

### English (`en.json`)

```json
{
  "toothStatus": {
    "healthy": "Healthy",
    "cavity": "Cavity",
    "filling": "Filling",
    "crown": "Crown",
    "missing": "Missing",
    "implant": "Implant",
    "root_canal": "Root Canal"
  }
}
```

### Arabic (`ar.json`)

```json
{
  "toothStatus": {
    "healthy": "صحي",
    "cavity": "تسوس",
    "filling": "حشوة",
    "crown": "تاج",
    "missing": "مفقود",
    "implant": "زراعة",
    "root_canal": "علاج جذور"
  }
}
```

### Kurdish (`ku.json`)

```json
{
  "toothStatus": {
    "healthy": "تەندروست",
    "cavity": "کون",
    "filling": "پڕکردنەوە",
    "crown": "تاج",
    "missing": "ونبوو",
    "implant": "چاندن",
    "root_canal": "چارەسەری ڕەگ"
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Colors not loading

```javascript
// ❌ Wrong - Hardcoded values
const colors = { cavity: "#FF6B6B" };

// ✅ Correct - Fetch from API with fallback
const [colors, setColors] = useState(DEFAULT_COLORS);
useEffect(() => {
  fetchToothColors().then(setColors).catch(console.error);
}, []);
```

### Issue 2: Missing new statuses in selector

```javascript
// ❌ Wrong - Only 5 options
<select>
  <option value="healthy">Healthy</option>
  <option value="cavity">Cavity</option>
  {/* Missing implant and root_canal */}
</select>

// ✅ Correct - All 7 options
<select>
  <option value="healthy">Healthy</option>
  <option value="cavity">Cavity</option>
  <option value="filling">Filling</option>
  <option value="crown">Crown</option>
  <option value="missing">Missing</option>
  <option value="implant">Implant</option>
  <option value="root_canal">Root Canal</option>
</select>
```

### Issue 3: Old cavity color still showing

```javascript
// Clear cache/localStorage if colors are cached
localStorage.removeItem("tooth_colors_cache");
// Or force refresh from API
await fetchToothColors(true); // force=true
```

---

## 📊 API Response Example (Updated)

```json
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
          "setting_value_raw": "{\"healthy\":\"#FFFFFF\",\"cavity\":\"#E74C3C\",\"filling\":\"#4ECDC4\",\"crown\":\"#FFD93D\",\"missing\":\"#95A5A6\",\"implant\":\"#3498DB\",\"root_canal\":\"#9B59B6\"}",
          "setting_type": "json",
          "description": "Tooth status colors for dental chart",
          "is_required": false,
          "display_order": 25,
          "is_active": true,
          "updated_at": "2026-02-10 15:30:00"
        }
      ]
    }
  }
}
```

---

## Summary for Frontend Team

1. ✅ **Fetch colors from API** - Don't hardcode
2. ✅ **Add 2 new status options**: implant & root_canal
3. ✅ **Cavity color changed** from `#FF6B6B` to `#E74C3C`
4. ✅ **Update all dental chart components** to support 7 statuses
5. ✅ **Add translations** for new statuses in all languages
6. ✅ **Test with real patient data**

---

## Need Help?

Contact the backend team or check:

- API Documentation: `/docs/api/clinic-settings`
- Postman Collection: Import `clinic-settings.postman_collection.json`
- Slack Channel: `#smartclinic-dev`

That's it! 🚀
