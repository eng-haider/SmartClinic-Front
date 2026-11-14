<template>
  <div class="ai-page app-page">
    <div class="ai-page__head">
      <h1 class="text-h5 text-md-h4 font-weight-bold text-primary ma-0 mobile-page-heading">{{ L(texts.title) }}</h1>
      <p class="ai-page__subtitle">{{ L(texts.subtitle) }}</p>
    </div>

    <!-- Clinic without the chatbot -->
    <v-card v-if="!enabled" rounded="xl" elevation="2" class="ai-page__locked">
      <v-icon color="warning" size="56" class="mb-3">mdi-crown</v-icon>
      <h2 class="text-h6 font-weight-bold mb-2">{{ L(texts.lockedTitle) }}</h2>
      <p class="text-body-1 text-medium-emphasis ma-0">{{ L(texts.lockedBody) }}</p>
    </v-card>

    <div v-else class="ai-page__body">
      <!-- Commands: tap one to send it, or to start it and finish the name/amount -->
      <aside class="ai-page__commands" :aria-label="L(texts.commands)">
        <h2 class="commands-title">
          <v-icon size="20" color="primary">mdi-lightning-bolt</v-icon>
          {{ L(texts.commands) }}
        </h2>
        <p class="commands-hint">{{ L(texts.hint) }}</p>
        <section v-for="group in commandGroups" :key="group.key" class="commands-group">
          <h3 class="group-title">{{ L(group.title) }}</h3>
          <button
            v-for="cmd in group.items"
            :key="cmd.key"
            type="button"
            class="command"
            :disabled="chat?.isTyping"
            @click="runCommand(cmd)"
          >
            <v-icon size="18" :color="group.color" class="command-icon">{{ cmd.icon }}</v-icon>
            <span class="command-text">
              <span class="command-label">{{ L(cmd.label) }}</span>
              <span class="command-example">{{ commandText(cmd) }}{{ cmd.send ? '' : '…' }}</span>
            </span>
            <v-icon size="16" class="command-go">{{ cmd.send ? 'mdi-send' : 'mdi-pencil' }}</v-icon>
          </button>
        </section>
      </aside>

      <div class="ai-page__chat">
        <AiChatWidget ref="chat" embedded />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authNew'
import AiChatWidget from '@/components/AiChatWidget.vue'

const { locale } = useI18n()
const authStore = useAuthStore()
const chat = ref(null)

const enabled = computed(() => authStore.clinic?.has_ai_bot === true || authStore.clinic?.has_ai_bot === 1)

// Page strings per UI language (same style as the navigation config)
const L = (obj) => obj[locale.value] || obj.en
const texts = {
  title: { ar: 'المساعد الذكي', en: 'AI Assistant', ku: 'یاریدەدەری زیرەک', pl: 'Asystent AI' },
  subtitle: {
    ar: 'اسأل عن بيانات العيادة أو اطلب منه يحجز موعد أو يسجل تسديد. ما يتنفذ شي إلا بعد ما تأكد.',
    en: 'Ask about clinic data, or ask it to book an appointment or record a payment. Nothing runs until you confirm.',
    ku: 'پرسیار لەسەر زانیاری کلینیک بکە، یان داوای گرتنی مەوعید یان تۆمارکردنی پارەدان بکە. هیچ شتێک جێبەجێ ناکرێت تا پشتڕاستی نەکەیتەوە.',
    pl: 'Pytaj o dane kliniki albo poproś o umówienie wizyty lub zapisanie płatności. Nic nie zostanie wykonane bez Twojego potwierdzenia.'
  },
  commands: { ar: 'الأوامر', en: 'Commands', ku: 'فەرمانەکان', pl: 'Polecenia' },
  hint: {
    ar: 'اضغط أمر حتى ينرسل، أو يبدأ لك وتكمل الاسم أو المبلغ.',
    en: 'Tap a command to send it, or to start it so you can add the name or amount.',
    ku: 'فەرمانێک دابگرە بۆ ناردنی، یان بۆ دەستپێکردنی و ناو یان بڕەکە تەواو بکە.',
    pl: 'Dotknij polecenia, aby je wysłać lub zacząć i dopisać imię albo kwotę.'
  },
  lockedTitle: { ar: 'ميزة إضافية', en: 'Add-on feature', ku: 'تایبەتمەندی زیادە', pl: 'Funkcja dodatkowa' },
  lockedBody: {
    ar: 'خدمة المساعد الذكي غير مفعلة لهذه العيادة. تواصل مع الدعم الفني لتفعيلها.',
    en: 'The AI assistant is not enabled for this clinic. Contact support to turn it on.',
    ku: 'یاریدەدەری زیرەک بۆ ئەم کلینیکە چالاک نییە. پەیوەندی بە پشتگیری بکە بۆ چالاککردنی.',
    pl: 'Asystent AI nie jest włączony dla tej kliniki. Skontaktuj się z pomocą techniczną.'
  }
}

/*
 * The chatbot understands Arabic and English, so a command is sent in English
 * for an English or Polish UI and in Arabic otherwise. `send: false` commands
 * need a name or amount: they go into the box for the user to finish.
 */
const commandGroups = [
  {
    key: 'appointments', color: 'primary',
    title: { ar: 'المواعيد', en: 'Appointments', ku: 'مەوعیدەکان', pl: 'Wizyty' },
    items: [
      { key: 'today', icon: 'mdi-calendar-today', send: true,
        label: { ar: 'مواعيد اليوم', en: "Today's appointments", ku: 'مەوعیدەکانی ئەمڕۆ', pl: 'Dzisiejsze wizyty' },
        text: { ar: 'شنو مواعيد اليوم؟', en: "What are today's appointments?" } },
      { key: 'free', icon: 'mdi-calendar-search', send: true,
        label: { ar: 'أوقات فارغة باچر', en: 'Free times tomorrow', ku: 'کاتە بەتاڵەکانی سبەی', pl: 'Wolne terminy jutro' },
        text: { ar: 'شوفلي أوقات فارغة باچر', en: 'Show free times tomorrow' } },
      { key: 'book', icon: 'mdi-calendar-plus', send: false,
        label: { ar: 'حجز موعد', en: 'Book an appointment', ku: 'گرتنی مەوعید', pl: 'Umów wizytę' },
        text: { ar: 'احجزلي موعد لـ ', en: 'Book an appointment for ' } },
      { key: 'reschedule', icon: 'mdi-calendar-edit', send: false,
        label: { ar: 'تأجيل موعد', en: 'Reschedule', ku: 'دواخستنی مەوعید', pl: 'Przełóż wizytę' },
        text: { ar: 'أجّل موعد ', en: 'Reschedule the appointment of ' } },
      { key: 'cancel', icon: 'mdi-calendar-remove', send: false,
        label: { ar: 'إلغاء موعد', en: 'Cancel an appointment', ku: 'هەڵوەشاندنەوەی مەوعید', pl: 'Odwołaj wizytę' },
        text: { ar: 'ألغي موعد ', en: 'Cancel the appointment of ' } }
    ]
  },
  {
    key: 'money', color: 'success',
    title: { ar: 'الحسابات', en: 'Payments', ku: 'حیسابەکان', pl: 'Płatności' },
    items: [
      { key: 'unpaid', icon: 'mdi-receipt-text-clock', send: true,
        label: { ar: 'الفواتير غير المدفوعة', en: 'Unpaid invoices', ku: 'پسوولە نەدراوەکان', pl: 'Nieopłacone faktury' },
        text: { ar: 'طلعلي الفواتير غير المدفوعة', en: 'Show unpaid invoices' } },
      { key: 'balance', icon: 'mdi-scale-balance', send: false,
        label: { ar: 'رصيد مراجع', en: "A patient's balance", ku: 'باڵانسی نەخۆش', pl: 'Saldo pacjenta' },
        text: { ar: 'شكد بذمة ', en: 'How much does this patient owe: ' } },
      { key: 'pay', icon: 'mdi-cash-plus', send: false,
        label: { ar: 'تسجيل تسديد', en: 'Record a payment', ku: 'تۆمارکردنی پارەدان', pl: 'Zapisz płatność' },
        text: { ar: 'سجل تسديد ', en: 'Record a payment of ' } },
      { key: 'payments', icon: 'mdi-cash-clock', send: true,
        label: { ar: 'آخر الدفعات', en: 'Recent payments', ku: 'دوایین پارەدانەکان', pl: 'Ostatnie płatności' },
        text: { ar: 'شنو آخر الدفعات؟', en: 'Show recent payments' } }
    ]
  },
  {
    key: 'patients', color: 'teal',
    title: { ar: 'المراجعين', en: 'Patients', ku: 'نەخۆشەکان', pl: 'Pacjenci' },
    items: [
      { key: 'add', icon: 'mdi-account-plus', send: false,
        label: { ar: 'إضافة مراجع', en: 'Add a patient', ku: 'زیادکردنی نەخۆش', pl: 'Dodaj pacjenta' },
        text: { ar: 'ضيف مراجع جديد اسمه ', en: 'Add a new patient named ' } },
      { key: 'find', icon: 'mdi-account-search', send: false,
        label: { ar: 'بحث عن مراجع', en: 'Find a patient', ku: 'گەڕان بۆ نەخۆش', pl: 'Znajdź pacjenta' },
        text: { ar: 'دورلي على المراجع ', en: 'Find patient ' } },
      { key: 'cases', icon: 'mdi-folder-account', send: false,
        label: { ar: 'حالات مراجع', en: "A patient's cases", ku: 'حاڵەتەکانی نەخۆش', pl: 'Przypadki pacjenta' },
        text: { ar: 'شنو حالات المراجع ', en: 'Show the cases of ' } }
    ]
  },
  {
    key: 'reports', color: 'deep-purple',
    title: { ar: 'التقارير', en: 'Reports', ku: 'ڕاپۆرتەکان', pl: 'Raporty' },
    items: [
      { key: 'summary', icon: 'mdi-chart-box', send: true,
        label: { ar: 'ملخص اليوم', en: "Today's summary", ku: 'پوختەی ئەمڕۆ', pl: 'Podsumowanie dnia' },
        text: { ar: 'ملخص اليوم', en: "Today's summary" } }
    ]
  }
]

const commandText = (cmd) => (['en', 'pl'].includes(locale.value) ? cmd.text.en : cmd.text.ar)

const runCommand = (cmd) => chat.value?.useCommand(commandText(cmd), { send: cmd.send })
</script>

<style scoped>
/* The page fills the screen under the app bar; the chat scrolls inside itself */
.ai-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* v-main (the scroller) has the 64px app bar on top and a 65px bottom
     padding (DashboardLayout); fill exactly what's left so it never scrolls */
  height: calc(100dvh - 64px - 65px - env(safe-area-inset-bottom, 0px));
}

.ai-page__head {
  flex-shrink: 0;
}

.ai-page__subtitle {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.ai-page__locked {
  max-width: 520px;
  margin: 24px auto;
  padding: 32px 24px;
  text-align: center;
}

.ai-page__body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
}

.ai-page__chat {
  min-height: 0;
  min-width: 0;
}

/* ---------- Commands ---------- */
.ai-page__commands {
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  border-radius: 20px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.commands-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.commands-hint {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 4px 0 12px;
}

.commands-group + .commands-group {
  margin-top: 14px;
}

.group-title {
  font-size: 12px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin: 0 0 6px;
}

.command {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  margin-bottom: 6px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: start;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
}

.command:hover:not(:disabled) {
  background: rgba(var(--v-theme-primary), 0.06);
  border-color: rgba(var(--v-theme-primary), 0.35);
}

.command:active:not(:disabled) {
  transform: scale(0.98);
}

.command:disabled {
  opacity: 0.5;
  cursor: default;
}

.command-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.command-label {
  font-size: 13px;
  font-weight: 600;
}

.command-example {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.command-go {
  opacity: 0.45;
  flex-shrink: 0;
}

/* Tablets and phones: commands become one scrolling row above the chat */
@media (max-width: 959px) {
  .ai-page {
    gap: 10px;
    /* 56px app bar on phones */
    height: calc(100dvh - 56px - 65px - env(safe-area-inset-bottom, 0px));
  }

  .ai-page__subtitle {
    display: none;
  }

  .ai-page__body {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    gap: 10px;
  }

  .ai-page__commands {
    overflow: visible;
    padding: 0;
    border: none;
    background: transparent;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .ai-page__commands::-webkit-scrollbar {
    display: none;
  }

  .commands-title,
  .commands-hint,
  .group-title {
    display: none;
  }

  .commands-group {
    display: contents;
  }

  .command {
    width: auto;
    flex-shrink: 0;
    margin: 0;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgb(var(--v-theme-surface));
  }

  .command-example,
  .command-go {
    display: none;
  }
}
</style>
