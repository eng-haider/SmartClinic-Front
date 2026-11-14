<template>
  <PublicSiteLayout>
    <section class="page-hero">
      <span>حذف الحساب</span>
      <h1>حذف حساب Smart Clinic</h1>
      <p>
        يمكنك حذف حسابك من داخل التطبيق: <strong>المزيد ← الحساب ← حذف الحساب</strong>،
        أو من هذه الصفحة دون الحاجة إلى التطبيق.
      </p>
    </section>

    <section class="delete-grid">
      <article class="card">
        <h2>طلب الحذف</h2>
        <form v-if="!done" @submit.prevent="submit">
          <label>
            رقم الهاتف المسجل
            <input v-model.trim="phone" type="tel" autocomplete="username" required dir="ltr" />
          </label>
          <label>
            كلمة المرور
            <input v-model="password" type="password" autocomplete="current-password" required dir="ltr" />
          </label>
          <label class="check">
            <input v-model="confirmed" type="checkbox" required />
            أفهم أن حسابي سيُوقف فوراً ويُحذف نهائياً بعد 30 يوماً.
          </label>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <button type="submit" :disabled="busy">
            {{ busy ? 'جارٍ الحذف…' : 'حذف حسابي' }}
          </button>
        </form>
        <div v-else class="success" role="status">
          <strong>تم استلام الطلب.</strong>
          <p>
            أُوقف حسابك ولن يمكن الدخول به. سيُحذف نهائياً في {{ purgeDate }}.
            للتراجع قبل ذلك راسل الدعم من رقمك المسجل.
          </p>
        </div>
      </article>

      <article class="card">
        <h2>ما الذي يُحذف؟</h2>
        <ul>
          <li>بيانات حسابك: الاسم، رقم الهاتف، البريد الإلكتروني، كلمة المرور وصورة الملف الشخصي.</li>
          <li>
            إذا كنت <strong>المالك الوحيد</strong> للعيادة: تُحذف العيادة وجميع سجلاتها
            (المراجعون، المواعيد، الحالات، الفواتير والصور) وتُغلق حسابات موظفيها.
          </li>
        </ul>
        <h2>ما الذي يبقى؟</h2>
        <ul>
          <li>
            إذا كنت موظفاً في عيادة: السجلات التي أدخلتها تعود للعيادة وتبقى لديها،
            ويظهر اسمك فيها «مستخدم محذوف».
          </li>
          <li>ما يفرض القانون الاحتفاظ به فقط، وللمدة التي يحددها.</li>
        </ul>
        <h2>المدة</h2>
        <p>يُوقف الحساب فوراً ويُحذف نهائياً بعد 30 يوماً من الطلب.</p>
        <p>
          إذا كنت مراجعاً وتريد حذف سجلك لدى عيادة، فتواصل مع تلك العيادة، أو راسلنا على
          <a href="mailto:en.haider1@gmail.com">en.haider1@gmail.com</a>.
        </p>
      </article>
    </section>

    <section class="english" dir="ltr" lang="en">
      <span>Delete account</span>
      <h2>Delete your Smart Clinic account</h2>
      <p>
        In the app, open <strong>More → Account → Delete account</strong>, or use the
        form above with your registered phone number and password.
      </p>
      <p>
        <strong>Deleted:</strong> your name, phone number, email, password and profile
        photo. If you are the clinic's <strong>only owner</strong>, the clinic and all of
        its records (patients, appointments, cases, bills and images) are deleted and its
        staff accounts are closed.
      </p>
      <p>
        <strong>Kept:</strong> for staff accounts, records you entered belong to the clinic
        and stay with it, shown as "Deleted user". Data the law requires us to keep is
        retained only for the required period.
      </p>
      <p>
        <strong>Timing:</strong> the account is deactivated immediately and permanently
        deleted 30 days after the request. Questions:
        <a href="mailto:en.haider1@gmail.com">en.haider1@gmail.com</a>.
      </p>
    </section>
  </PublicSiteLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import axios from 'axios'
import PublicSiteLayout from '@/layouts/PublicSiteLayout.vue'

const BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'https://api.smartclinic.software/api'

const phone = ref('')
const password = ref('')
const confirmed = ref(false)
const busy = ref(false)
const error = ref('')
const done = ref(false)
const purgeAfter = ref(null)

const purgeDate = computed(() =>
  purgeAfter.value
    ? new Date(purgeAfter.value).toLocaleDateString('ar-IQ', { dateStyle: 'long' })
    : 'خلال 30 يوماً'
)

// Plain axios on purpose: the shared client would attach whatever clinic
// session is already open in this browser.
async function submit () {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const login = await axios.post(`${BASE_URL}/auth/smart-login`, {
      phone: phone.value,
      password: password.value
    })
    const { token, tenant_id: tenantId } = login.data?.data || {}
    const res = await axios.post(
      `${BASE_URL}/tenant/auth/delete-account`,
      { password: password.value },
      { headers: { Authorization: `Bearer ${token}`, 'X-Tenant-ID': tenantId } }
    )
    purgeAfter.value = res.data?.data?.purge_after || null
    password.value = ''
    done.value = true
  } catch (e) {
    const status = e.response?.status
    error.value = status === 401 || status === 422
      ? 'رقم الهاتف أو كلمة المرور غير صحيحة.'
      : 'تعذر إكمال الطلب الآن. حاول لاحقاً أو راسل الدعم.'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.page-hero,
.delete-grid,
.english {
  width: min(1000px, calc(100% - 40px));
  margin-inline: auto;
}
.page-hero { padding: 80px 0 42px; text-align: center; }
.page-hero > span,
.english > span { color: #1976d2; font-weight: 900; }
h1 { margin: 8px 0 14px; font-size: clamp(2.4rem, 6vw, 4.7rem); line-height: 1.2; }
.page-hero p { max-width: 720px; margin: 0 auto; color: #60748c; font-size: 1.08rem; }
.delete-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
.card,
.english {
  border: 1px solid #dbe8f4;
  border-radius: 22px;
  background: #fff;
  padding: 30px;
}
.card h2 { margin: 0 0 12px; font-size: 1.3rem; }
.card h2:not(:first-child) { margin-top: 22px; }
.card p,
.card li { color: #61748a; }
.card ul { margin: 0; padding-inline-start: 20px; }
.card a,
.english a { color: #1976d2; font-weight: 800; }
form { display: grid; gap: 14px; }
label { display: grid; gap: 6px; font-weight: 800; }
input[type='tel'],
input[type='password'] {
  padding: 12px 14px;
  border: 1px solid #c9d9ea;
  border-radius: 12px;
  font: inherit;
}
.check { display: flex; gap: 10px; align-items: flex-start; font-weight: 600; color: #4b5d72; }
.check input { margin-top: 5px; }
button {
  padding: 13px;
  border: 0;
  border-radius: 12px;
  background: #c62828;
  color: #fff;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}
button:disabled { opacity: 0.6; cursor: progress; }
.error { margin: 0; color: #c62828; font-weight: 700; }
.success { padding: 18px; border-radius: 14px; background: #eaf7ee; color: #1f6b35; }
.success p { color: #2f5d3c; margin-bottom: 0; }
.english { margin-top: 32px; }
.english h2 { margin: 6px 0; }
.english p { color: #5f7288; }
@media (max-width: 700px) {
  .delete-grid { grid-template-columns: 1fr; }
  .page-hero, .delete-grid, .english { width: calc(100% - 24px); }
  .card, .english { padding: 24px; }
}
</style>
