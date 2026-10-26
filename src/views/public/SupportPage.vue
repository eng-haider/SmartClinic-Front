<template>
  <PublicSiteLayout>
    <section class="page-hero">
      <span>الدعم والتواصل</span>
      <h1>كيف يمكننا مساعدتك؟</h1>
      <p>
        إذا واجهت مشكلة في تسجيل الدخول، إنشاء الحساب، المزامنة، أو استخدام إحدى
        ميزات Smart Clinic، تواصل معنا مع وصف واضح للمشكلة.
      </p>
    </section>

    <section class="support-grid">
      <article class="contact-card">
        <div class="icon">@</div>
        <h2>البريد الإلكتروني</h2>
        <p>للمشكلات التقنية، الملاحظات، طلبات الخصوصية، واقتراحات الميزات.</p>
        <a :href="supportMail">en.haider1@gmail.com</a>
        <small>يرجى عدم إرسال كلمات المرور أو السجلات الطبية عبر البريد.</small>
      </article>

      <article class="contact-card">
        <div class="icon">i</div>
        <h2>معلومات تساعدنا على الحل</h2>
        <ul>
          <li>نوع الجهاز وإصدار نظام التشغيل.</li>
          <li>رقم إصدار تطبيق Smart Clinic.</li>
          <li>الخطوات التي أدت إلى المشكلة.</li>
          <li>صورة للشاشة بعد إخفاء أي بيانات شخصية أو طبية.</li>
        </ul>
      </article>
    </section>

    <section class="faq">
      <div class="section-title">
        <span>أسئلة شائعة</span>
        <h2>حلول سريعة</h2>
      </div>

      <details open>
        <summary>لا أستطيع تسجيل الدخول</summary>
        <p>
          تأكد من رقم الهاتف وكلمة المرور واتصال الإنترنت. إذا استمرت المشكلة،
          أرسل رقم الهاتف المسجل فقط إلى الدعم، ولا ترسل كلمة المرور.
        </p>
      </details>
      <details>
        <summary>كيف أنشئ حساب عيادة؟</summary>
        <p>
          افتح صفحة <router-link to="/register">إنشاء الحساب</router-link>، ثم
          أدخل معلومات الطبيب والعيادة ورقم الهاتف وكلمة مرور آمنة.
        </p>
      </details>
      <details>
        <summary>كيف أطلب حذف الحساب أو البيانات؟</summary>
        <p>
          يرسل مالك حساب العيادة طلباً من بريده أو هاتفه المسجل إلى الدعم. قد
          نطلب التحقق من الملكية قبل تنفيذ الطلب، وقد نحتفظ بما يفرضه القانون.
        </p>
      </details>
      <details>
        <summary>أنا مراجع وأريد تصحيح أو حذف سجلي</summary>
        <p>
          تواصل أولاً مع العيادة التي أنشأت السجل لأنها تتحكم بالمعلومات الطبية
          التي أدخلتها. يمكنك أيضاً مراسلة دعم Smart Clinic لتوجيه الطلب.
        </p>
      </details>
    </section>

    <section class="english" dir="ltr" lang="en">
      <span>Support</span>
      <h2>Smart Clinic Support</h2>
      <p>
        For technical issues, account help, privacy requests, general feedback,
        or feature requests, email
        <a href="mailto:en.haider1@gmail.com">en.haider1@gmail.com</a>.
        Do not send passwords or medical records by email.
      </p>
      <p>
        Include your device model, operating-system version, app version, and
        steps to reproduce the issue. Remove personal and medical data from any screenshot.
      </p>
    </section>
  </PublicSiteLayout>
</template>

<script setup>
import PublicSiteLayout from '@/layouts/PublicSiteLayout.vue'

const supportMail = 'mailto:en.haider1@gmail.com?subject=Smart%20Clinic%20Support'
</script>

<style scoped>
.page-hero,
.support-grid,
.faq,
.english {
  width: min(1000px, calc(100% - 40px));
  margin-inline: auto;
}
.page-hero { padding: 80px 0 42px; text-align: center; }
.page-hero > span,
.section-title span,
.english > span { color: #1976d2; font-weight: 900; }
h1 { margin: 8px 0 14px; font-size: clamp(2.4rem, 6vw, 4.7rem); line-height: 1.2; }
.page-hero p { max-width: 720px; margin: 0 auto; color: #60748c; font-size: 1.08rem; }
.support-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.contact-card,
.faq,
.english {
  border: 1px solid #dbe8f4;
  border-radius: 22px;
  background: #fff;
}
.contact-card { padding: 30px; }
.contact-card .icon {
  width: 48px; height: 48px; display: grid; place-items: center;
  border-radius: 14px; color: #fff; background: #1976d2; font-weight: 900;
}
.contact-card h2 { margin: 18px 0 8px; }
.contact-card p,
.contact-card li { color: #61748a; }
.contact-card a { display: inline-block; color: #1976d2; font-weight: 900; font-size: 1.1rem; }
.contact-card small { display: block; margin-top: 16px; color: #8a5b00; }
.contact-card ul { margin: 0; padding-inline-start: 20px; }
.faq { margin-top: 32px; padding: 32px; }
.section-title { margin-bottom: 20px; }
.section-title h2 { margin: 4px 0; font-size: 2rem; }
details { border-top: 1px solid #e4edf6; padding: 18px 0; }
summary { cursor: pointer; font-weight: 900; font-size: 1.05rem; }
details p { color: #5f7288; margin-bottom: 0; }
details a { color: #1976d2; font-weight: 800; }
.english { margin-top: 32px; padding: 32px; }
.english h2 { margin: 6px 0; }
.english p { color: #5f7288; }
.english a { color: #1976d2; font-weight: 800; }
@media (max-width: 700px) {
  .support-grid { grid-template-columns: 1fr; }
  .page-hero, .support-grid, .faq, .english { width: calc(100% - 24px); }
  .faq, .english, .contact-card { padding: 24px; }
}
</style>
