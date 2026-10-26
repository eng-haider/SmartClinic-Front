<template>
  <div class="public-site" dir="rtl">
    <header class="site-header">
      <div class="header-inner">
        <router-link to="/about" class="brand" aria-label="Smart Clinic home">
          <img src="/logo.png" alt="Smart Clinic" />
          <span>
            <strong>Smart Clinic</strong>
            <small>سمارت كلينك</small>
          </span>
        </router-link>

        <nav aria-label="روابط الموقع">
          <router-link to="/about">عن المنصة</router-link>
          <router-link to="/support">الدعم</router-link>
          <router-link to="/privacy">الخصوصية</router-link>
        </nav>

        <router-link to="/login" class="login-link">تسجيل الدخول</router-link>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <img src="/logo.png" alt="" />
          <div>
            <strong>Smart Clinic</strong>
            <p>منصة رقمية لإدارة أعمال العيادات.</p>
          </div>
        </div>

        <div class="footer-links">
          <router-link to="/about">عن المنصة</router-link>
          <router-link to="/support">الدعم والتواصل</router-link>
          <router-link to="/privacy">سياسة الخصوصية</router-link>
          <a href="mailto:en.haider1@gmail.com">en.haider1@gmail.com</a>
        </div>

        <p class="copyright">© {{ year }} Smart Clinic. جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.public-site {
  --brand: #1976d2;
  --brand-dark: #0e4f91;
  --ink: #10233c;
  --muted: #5e7189;
  --surface: #ffffff;
  --soft: #eef6ff;
  min-height: 100vh;
  color: var(--ink);
  background: #f8fbff;
  line-height: 1.8;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid rgba(16, 35, 60, 0.08);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
}

.header-inner,
.footer-inner {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
}

.header-inner {
  min-height: 76px;
  display: flex;
  align-items: center;
  gap: 30px;
}

.brand,
.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand {
  color: var(--ink);
  text-decoration: none;
  margin-inline-end: auto;
}

.brand img,
.footer-brand img {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  object-fit: contain;
  background: var(--soft);
}

.brand span {
  display: grid;
  line-height: 1.25;
}

.brand strong { font-size: 1.02rem; }
.brand small { color: var(--muted); }

nav,
.footer-links {
  display: flex;
  align-items: center;
  gap: 22px;
}

nav a,
.footer-links a {
  color: var(--muted);
  text-decoration: none;
  font-weight: 700;
}

nav a:hover,
nav a.router-link-active,
.footer-links a:hover {
  color: var(--brand);
}

.login-link {
  color: #fff;
  background: var(--brand);
  border-radius: 12px;
  padding: 9px 18px;
  text-decoration: none;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(25, 118, 210, 0.22);
}

.site-footer {
  margin-top: 70px;
  padding: 42px 0 26px;
  color: #dceaff;
  background: #0e2036;
}

.footer-inner {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 28px;
  align-items: start;
}

.footer-brand img { background: #fff; }
.footer-brand p { margin: 2px 0 0; color: #9fb3cb; }
.footer-links { flex-wrap: wrap; justify-content: flex-end; }
.footer-links a { color: #dceaff; }
.copyright {
  grid-column: 1 / -1;
  margin: 0;
  padding-top: 22px;
  color: #9fb3cb;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 780px) {
  .header-inner { min-height: 68px; gap: 12px; }
  .brand { margin-inline-end: 0; }
  .brand span { display: none; }
  .brand img { width: 42px; height: 42px; }
  nav { margin-inline: auto; gap: 12px; font-size: 0.84rem; }
  .login-link { padding: 8px 11px; font-size: 0.82rem; }
  .footer-inner { grid-template-columns: 1fr; }
  .footer-links { justify-content: flex-start; }
}

@media (max-width: 520px) {
  .header-inner,
  .footer-inner { width: min(100% - 24px, 1180px); }
  nav a:first-child { display: none; }
}
</style>
