# BookingDialog Component Usage

The `BookingDialog` component is a reusable dialog for creating patient reservations/bookings.

## Location

`/src/components/BookingDialog.vue`

## Props

| Prop              | Type    | Default | Description                                  |
| ----------------- | ------- | ------- | -------------------------------------------- |
| `modelValue`      | Boolean | `false` | Controls dialog visibility (v-model)         |
| `selectedDate`    | String  | `null`  | Pre-selected date in ISO format (YYYY-MM-DD) |
| `doctors`         | Array   | `[]`    | List of available doctors                    |
| `defaultDoctorId` | Number  | `null`  | Default doctor ID to select                  |
| `patientId`       | Number  | `null`  | Pre-select a specific patient by ID          |

## Events

| Event               | Payload | Description                                                         |
| ------------------- | ------- | ------------------------------------------------------------------- |
| `update:modelValue` | Boolean | Emitted when dialog is closed                                       |
| `saved`             | Object  | Emitted when booking is successfully saved (includes response data) |
| `error`             | Error   | Emitted when booking save fails                                     |

## Basic Usage

```vue
<template>
  <div>
    <!-- Trigger Button -->
    <v-btn @click="showBookingDialog = true"> New Booking </v-btn>

    <!-- BookingDialog Component -->
    <BookingDialog
      v-model="showBookingDialog"
      :doctors="doctors"
      @saved="handleBookingSaved"
      @error="handleBookingError"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import BookingDialog from "@/components/BookingDialog.vue";

const showBookingDialog = ref(false);
const doctors = ref([
  { id: 1, name: "Dr. John" },
  { id: 2, name: "Dr. Sarah" },
]);

const handleBookingSaved = (response) => {
  console.log("Booking saved:", response);
  // Refresh your data, show success message, etc.
};

const handleBookingError = (error) => {
  console.error("Booking failed:", error);
  // Show error message
};
</script>
```

## Advanced Usage Examples

### 1. With Pre-selected Date

```vue
<BookingDialog
  v-model="showBookingDialog"
  :selected-date="selectedDate"
  :doctors="doctors"
  @saved="handleBookingSaved"
/>
```

### 2. With Pre-selected Patient (from Patient Detail Page)

```vue
<template>
  <div>
    <!-- On Patient Detail Page -->
    <v-btn @click="bookAppointment"> Book Appointment </v-btn>

    <BookingDialog
      v-model="showBookingDialog"
      :patient-id="patientId"
      :doctors="doctors"
      :default-doctor-id="doctorId"
      @saved="handleBookingSaved"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import BookingDialog from "@/components/BookingDialog.vue";

const route = useRoute();
const showBookingDialog = ref(false);
const patientId = ref(Number(route.params.id));
const doctors = ref([]);
const doctorId = ref(null);

const bookAppointment = () => {
  showBookingDialog.value = true;
};

const handleBookingSaved = () => {
  // Refresh patient appointments list
  loadPatientAppointments();
};
</script>
```

### 3. With Default Doctor Based on User Role

```vue
<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const defaultDoctorId = computed(() => {
  // If user is a doctor, use their ID
  if (authStore.user?.role === "doctor") {
    return authStore.user.doctor_id;
  }
  // Otherwise, use first available doctor
  return doctors.value.length > 0 ? doctors.value[0].id : null;
});
</script>

<template>
  <BookingDialog
    v-model="showBookingDialog"
    :doctors="doctors"
    :default-doctor-id="defaultDoctorId"
    @saved="handleBookingSaved"
  />
</template>
```

## Features Included

- **Patient Search**: Autocomplete search with debouncing (300ms)
- **Doctor Selection**: Dropdown with all available doctors
- **Time Picker**: Standard time input
- **Appointment Type**: Radio buttons (Examination/Other)
- **Notes**: Textarea for additional information
- **WhatsApp Integration**: Optional WhatsApp reminder with message preview
- **Form Validation**: Required field validation
- **Loading States**: Loading indicators during save
- **RTL Support**: Works with Arabic/Kurdish languages

## Complete Example (Reservations Page)

See `/src/views/pages/Reservations.vue` for a complete implementation example.

```vue
<template>
  <BookingDialog
    v-model="bookingDialog"
    :selected-date="selectedDate"
    :doctors="doctors"
    :default-doctor-id="defaultDoctorId"
    @saved="handleBookingSaved"
    @error="handleBookingError"
  />
</template>

<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import BookingDialog from "@/components/BookingDialog.vue";

const authStore = useAuthStore();
const bookingDialog = ref(false);
const selectedDate = ref(null);
const doctors = ref([]);

const defaultDoctorId = computed(() => {
  const role = authStore.user?.role;
  const canFilterByDoctor = [
    "secretary",
    "adminDoctor",
    "accounter",
    "admin",
  ].includes(role);

  return canFilterByDoctor
    ? doctors.value.length > 0
      ? doctors.value[0].id
      : null
    : authStore.user?.doctor_id;
});

const handleBookingSaved = (response) => {
  console.log("Booking created:", response);
  // Refresh calendar, show success message, etc.
};

const handleBookingError = (error) => {
  console.error("Error:", error);
  // Show error notification
};
</script>
```

## Notes

- The component automatically handles patient search with debouncing
- WhatsApp messages are automatically formatted with clinic name, date, and time
- The dialog is persistent (won't close when clicking outside)
- Form validation ensures all required fields are filled before saving
- The component automatically loads initial patient list when opened
