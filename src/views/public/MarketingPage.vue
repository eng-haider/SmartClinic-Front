<template>
  <PublicSiteLayout>
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">منصة واحدة لإدارة العيادة</span>
        <h1>إدارة يومك الطبي<br /><em>بوضوح وسهولة</em></h1>
        <p>
          يساعد Smart Clinic الأطباء وفرق العيادات على تنظيم المواعيد، ملفات
          المراجعين، المتابعات، الفواتير، والعمل اليومي من مكان واحد.
        </p>
        <div class="actions">
          <router-link to="/register" class="primary">إنشاء حساب عيادة</router-link>
          <router-link to="/login" class="secondary">تسجيل الدخول</router-link>
        </div>
        <p class="trust-line">مصمم للاستخدام المهني داخل العيادات ومراكز الرعاية.</p>
      </div>

      <div class="hero-panel" aria-label="نظرة عامة على Smart Clinic">
        <div class="panel-top">
          <span class="status-dot"></span>
          <strong>Smart Clinic</strong>
          <span>لوحة العمل</span>
        </div>
        <div class="metric-grid">
          <article><b>المواعيد</b><span>جدولة ومتابعة منظمة</span></article>
          <article><b>ملفات المراجعين</b><span>سجل موحد وسهل الوصول</span></article>
          <article><b>الفواتير</b><span>متابعة الدفعات والأرصدة</span></article>
          <article><b>فريق العيادة</b><span>صلاحيات مناسبة لكل مستخدم</span></article>
        </div>
      </div>
    </section>

    <section class="section intro">
      <div>
        <span class="eyebrow">عمل أقل تشتتاً</span>
        <h2>كل ما تحتاجه العيادة في سير عمل واضح</h2>
      </div>
      <p>
        من استقبال المراجع وحجز الموعد إلى تسجيل الحالة والمدفوعات، صُممت
        الواجهة لتكون سريعة على الهاتف والكمبيوتر وتدعم العربية والإنجليزية.
      </p>
    </section>

    <section class="features section" aria-label="مميزات Smart Clinic">
      <article>
        <span>01</span>
        <h3>تنظيم المواعيد</h3>
        <p>عرض يومي وشهري، حالات المواعيد، وقائمة انتظار تساعد الفريق على متابعة اليوم.</p>
      </article>
      <article>
        <span>02</span>
        <h3>إدارة ملفات المراجعين</h3>
        <p>معلومات المراجع، الملاحظات، الحالات، الوصفات، والمرفقات ضمن صلاحيات المستخدم.</p>
      </article>
      <article>
        <span>03</span>
        <h3>الفواتير والتقارير</h3>
        <p>تسجيل الدفعات، متابعة المبالغ المتبقية، وعرض مؤشرات تشغيلية للعيادة.</p>
      </article>
      <article>
        <span>04</span>
        <h3>وصول آمن ومنظم</h3>
        <p>حسابات منفصلة وصلاحيات حسب الدور للمساعدة في حماية بيانات العمل.</p>
      </article>
    </section>

    <section class="privacy-callout section">
      <div>
        <span class="eyebrow">الخصوصية جزء من الخدمة</span>
        <h2>بيانات العيادة والمراجعين تحتاج عناية خاصة</h2>
        <p>
          نوضح بشفافية أنواع البيانات التي تعالجها المنصة وكيف تُستخدم، ويمكن
          لمسؤولي العيادات والمستخدمين التواصل معنا لطلبات الخصوصية والدعم.
        </p>
      </div>
      <div class="callout-links">
        <router-link to="/privacy">قراءة سياسة الخصوصية</router-link>
        <router-link to="/support">التواصل مع الدعم</router-link>
      </div>
    </section>

    <section class="english-summary" dir="ltr" lang="en">
      <span class="eyebrow">Clinic operations, in one place</span>
      <h2>Smart Clinic helps healthcare professionals organize daily clinic work.</h2>
      <p>
        Manage appointments, patient records, follow-ups, billing, and team access
        through a responsive Arabic and English experience.
      </p>
    </section>

    <section class="disclaimer section">
      <strong>تنبيه:</strong>
      Smart Clinic أداة لإدارة أعمال العيادات، وليست خدمة طوارئ ولا تقدم تشخيصاً
      أو نصيحة طبية للمريض بدلاً عن مقدم الرعاية المؤهل.
    </section>
  </PublicSiteLayout>
</template>

<script setup>
import PublicSiteLayout from '@/layouts/PublicSiteLayout.vue'
</script>

<style scoped>
.hero,
.section,
.english-summary {
  width: min(1120px, calc(100% - 40px));
  margin-inline: auto;
}

.hero {
  min-height: 680px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 64px;
  align-items: center;
  padding: 70px 0;
}

.eyebrow {
  display: inline-flex;
  color: #1976d2;
  background: #e9f4ff;
  border-radius: 999px;
  padding: 6px 13px;
  font-weight: 800;
  font-size: 0.88rem;
}

h1 {
  margin: 18px 0;
  color: #10233c;
  font-size: clamp(2.6rem, 6vw, 5.6rem);
  line-height: 1.12;
  letter-spacing: -0.05em;
}

h1 em { color: #1976d2; font-style: normal; }
.hero-copy > p { max-width: 650px; color: #5e7189; font-size: 1.16rem; }
.actions { display: flex; gap: 12px; margin: 30px 0 18px; }
.actions a,
.callout-links a {
  padding: 12px 20px;
  border-radius: 13px;
  text-decoration: none;
  font-weight: 800;
}
.primary { color: #fff; background: #1976d2; }
.secondary { color: #1976d2; background: #e9f4ff; }
.trust-line { font-size: 0.92rem !important; }

.hero-panel {
  position: relative;
  border: 1px solid #d7e5f4;
  border-radius: 28px;
  padding: 24px;
  background: linear-gradient(150deg, #fff, #eef6ff);
  box-shadow: 0 30px 80px rgba(20, 77, 130, 0.16);
}
.panel-top { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
.panel-top span:last-child { margin-inline-start: auto; color: #72839a; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; background: #20b26b; }
.metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.metric-grid article {
  min-height: 142px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  border: 1px solid #dfebf7;
  border-radius: 20px;
  padding: 20px;
  background: #fff;
}
.metric-grid b { font-size: 1.06rem; }
.metric-grid span { color: #708197; font-size: 0.9rem; }

.section { margin-top: 72px; }
.intro { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: end; }
h2 { margin: 14px 0; font-size: clamp(2rem, 4vw, 3.2rem); line-height: 1.25; }
.intro p,
.privacy-callout p,
.english-summary p { color: #5e7189; font-size: 1.05rem; }

.features { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.features article {
  border: 1px solid #dce8f4;
  border-radius: 20px;
  padding: 24px;
  background: #fff;
}
.features article > span { color: #1976d2; font-weight: 900; }
.features h3 { margin: 20px 0 8px; font-size: 1.18rem; }
.features p { margin: 0; color: #687b92; }

.privacy-callout {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 50px;
  align-items: center;
  padding: 40px;
  border-radius: 28px;
  background: #102c4b;
  color: #fff;
}
.privacy-callout h2 { font-size: 2rem; }
.privacy-callout p { color: #c5d6e8; }
.callout-links { display: grid; gap: 10px; }
.callout-links a { color: #10233c; background: #fff; text-align: center; }
.callout-links a:last-child { color: #fff; background: #1976d2; }

.english-summary {
  margin-top: 72px;
  padding: 40px;
  border: 1px solid #dce8f4;
  border-radius: 24px;
  background: #fff;
}
.english-summary h2 { max-width: 850px; }
.disclaimer { padding: 18px 22px; border-radius: 14px; background: #fff5df; color: #714f0c; }

@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; min-height: auto; gap: 30px; }
  .features { grid-template-columns: 1fr 1fr; }
  .privacy-callout { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .hero, .section, .english-summary { width: calc(100% - 24px); }
  .hero { padding: 48px 0; }
  .metric-grid, .features, .intro { grid-template-columns: 1fr; }
  .actions { flex-direction: column; }
  .actions a { text-align: center; }
  .privacy-callout, .english-summary { padding: 25px; }
}
</style>
