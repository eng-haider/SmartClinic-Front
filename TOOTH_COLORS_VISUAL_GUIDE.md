# Tooth Colors Feature - Visual Guide

## UI Layout

### Display Settings Section

```
┌─────────────────────────────────────────────────────────────┐
│ 🎨 Display Settings                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Theme Color     [#1976D2] [🎨]    Language    [Arabic ▼]   │
│  Date Format     [DD/MM/YYYY ▼]    Time Format [12h ▼]      │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🦷 Tooth Colors for Dental Chart                           │
│                                                              │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  │
│  │ Healthy        │ │ Cavity         │ │ Filling        │  │
│  │ #FFFFFF        │ │ #FF6B6B        │ │ #4ECDC4        │  │
│  │ [#FFFFFF] [🎨] │ │ [#FF6B6B] [🎨] │ │ [#4ECDC4] [🎨] │  │
│  └────────────────┘ └────────────────┘ └────────────────┘  │
│                                                              │
│  ┌────────────────┐ ┌────────────────┐                      │
│  │ Crown          │ │ Missing        │                      │
│  │ #FFD93D        │ │ #95A5A6        │                      │
│  │ [#FFD93D] [🎨] │ │ [#95A5A6] [🎨] │                      │
│  └────────────────┘ └────────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Color Picker Interface

When clicking the 🎨 (eyedropper) button:

```
┌──────────────────────────┐
│   Color Picker           │
├──────────────────────────┤
│                          │
│   ┌────────────────┐     │
│   │  ████████████  │     │
│   │  ████████████  │     │
│   │  ████████████  │     │
│   │  ████████████  │     │
│   │  ████████████  │     │
│   └────────────────┘     │
│                          │
│   Hue Slider             │
│   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬       │
│                          │
│   Opacity Slider         │
│   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬       │
│                          │
│   HEX: #FF6B6B           │
│                          │
└──────────────────────────┘
```

## Responsive Behavior

### Desktop (3 columns)

```
┌────────┐ ┌────────┐ ┌────────┐
│Healthy │ │ Cavity │ │Filling │
└────────┘ └────────┘ └────────┘
┌────────┐ ┌────────┐
│ Crown  │ │Missing │
└────────┘ └────────┘
```

### Tablet (2 columns)

```
┌────────┐ ┌────────┐
│Healthy │ │ Cavity │
└────────┘ └────────┘
┌────────┐ ┌────────┐
│Filling │ │ Crown  │
└────────┘ └────────┘
┌────────┐
│Missing │
└────────┘
```

### Mobile (1 column)

```
┌────────┐
│Healthy │
└────────┘
┌────────┐
│ Cavity │
└────────┘
┌────────┐
│Filling │
└────────┘
┌────────┐
│ Crown  │
└────────┘
┌────────┐
│Missing │
└────────┘
```

## Color States

### Default Colors

- **Healthy**: #FFFFFF (White) - Represents normal, healthy teeth
- **Cavity**: #FF6B6B (Light Red) - Indicates tooth decay
- **Filling**: #4ECDC4 (Turquoise) - Shows filled cavities
- **Crown**: #FFD93D (Yellow/Gold) - Represents dental crowns
- **Missing**: #95A5A6 (Gray) - Indicates missing teeth

### Color Chip Display

```
Each status shows:
┌──────────────────┐
│ Status Name      │
│ ┌─────┐ #HEX     │ ← Color chip with hex code
│ └─────┘          │
│ [Input] [Picker] │ ← Edit controls
└──────────────────┘
```

## Interaction Flow

1. **View Colors**

   ```
   User opens Settings > Clinic tab
   → Scrolls to Display Settings
   → Sees Tooth Colors section
   ```

2. **Edit Color (Manual)**

   ```
   User clicks on hex code input field
   → Types new hex code (e.g., #FF0000)
   → Color chip updates in real-time
   ```

3. **Edit Color (Picker)**

   ```
   User clicks eyedropper icon
   → Color picker popup opens
   → User selects color visually
   → Hex code updates automatically
   → Color chip reflects change
   ```

4. **Save Changes**
   ```
   User clicks "Save" button
   → All settings sent to API
   → Success notification appears
   → Cache refreshed
   → Changes visible throughout app
   ```

## Permission States

### With Edit Permission

- All fields are editable
- Color pickers are enabled
- Save button is visible

### Without Edit Permission

- All fields are read-only (grayed out)
- Color pickers are disabled
- Info alert shows: "You have read-only access..."

## Example Screenshots Description

### Before Customization

```
Healthy:  ⬜ #FFFFFF (White)
Cavity:   🟥 #FF6B6B (Light Red)
Filling:  🟦 #4ECDC4 (Turquoise)
Crown:    🟨 #FFD93D (Yellow)
Missing:  ⬛ #95A5A6 (Gray)
```

### After Customization (Example)

```
Healthy:  🟩 #22C55E (Green)
Cavity:   🟥 #DC2626 (Dark Red)
Filling:  🟦 #3B82F6 (Blue)
Crown:    🟨 #F59E0B (Orange)
Missing:  ⬛ #374151 (Dark Gray)
```

## Integration with Dental Chart

The colors configured here will be used in:

- Teeth chart visualizations
- Patient case records
- Dental treatment displays
- Reports and exports
- Mobile views

## Accessibility Notes

- Color chips provide visual feedback
- Hex codes are displayed for precise control
- Text labels identify each status
- High contrast between chip and background
- Keyboard navigation supported
- Screen reader friendly
