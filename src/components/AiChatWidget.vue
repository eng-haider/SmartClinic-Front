<template>
  <div class="ai-chat-widget">
    <!-- Floating Action Button -->
    <transition name="fab-bounce">
      <button
        v-show="!isOpen"
        class="chat-fab"
        @click="openChat"
        id="ai-chat-fab"
        aria-label="Open AI Assistant"
      >
        <div class="fab-pulse"></div>
        <svg class="fab-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 13.85 2.5 15.55 3.35 17L2 22L7 20.65C8.45 21.5 10.15 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="rgba(255,255,255,0.15)" stroke="white" stroke-width="1.5"/>
          <circle cx="8" cy="12" r="1.5" fill="white"/>
          <circle cx="12" cy="12" r="1.5" fill="white"/>
          <circle cx="16" cy="12" r="1.5" fill="white"/>
          <path d="M9 7C9 7 10 5 12 5C14 5 15 7 15 7" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <span class="fab-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
      </button>
    </transition>

    <!-- Chat Window -->
    <transition name="chat-slide">
      <div v-show="isOpen" class="chat-window" :class="{ 'chat-mobile': isMobile }">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-left">
            <div class="header-avatar">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7v1h1a1 1 0 110 2h-1v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1H2a1 1 0 110-2h1v-1a7 7 0 017-7h1V5.73A2 2 0 0112 2z" fill="white"/>
                <circle cx="9" cy="14" r="1.5" fill="#1a73e8"/>
                <circle cx="15" cy="14" r="1.5" fill="#1a73e8"/>
              </svg>
            </div>
            <div class="header-info">
              <h3 class="header-title">المساعد الذكي</h3>
              <span class="header-status">
                <span class="status-dot"></span>
                متصل الآن
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button class="header-btn" @click="clearChat" title="محادثة جديدة" :disabled="messages.length === 0">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                <path d="M17.65 6.35A7.96 7.96 0 0012 4C7.58 4 4.01 7.58 4.01 12S7.58 20 12 20c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
              </svg>
            </button>
            <button class="header-btn" @click="closeChat" title="إغلاق">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="chat-body" ref="chatBody">
          <!-- Empty State -->
          <div v-if="messages.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 80 80" fill="none" width="80" height="80">
                <circle cx="40" cy="40" r="38" fill="url(#emptyGrad)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                <path d="M40 18a4 4 0 014 4c0 1.48-.8 2.78-2 3.46V28h2a14 14 0 0114 14v2h2a2 2 0 110 4h-2v2a6 6 0 01-6 6H28a6 6 0 01-6-6v-2h-2a2 2 0 110-4h2v-2a14 14 0 0114-14h2v-2.54A4 4 0 0140 18z" fill="rgba(255,255,255,0.9)"/>
                <circle cx="33" cy="42" r="3" fill="#1a73e8"/>
                <circle cx="47" cy="42" r="3" fill="#1a73e8"/>
                <path d="M33 52c0 0 3 4 7 4s7-4 7-4" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="emptyGrad" x1="0" y1="0" x2="80" y2="80">
                    <stop offset="0%" stop-color="#0ea5e9"/>
                    <stop offset="100%" stop-color="#6366f1"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h4 class="empty-title">مرحباً! أنا مساعدك الذكي 🤖</h4>
            <p class="empty-subtitle">اسألني أي سؤال عن بيانات العيادة</p>
            <div class="suggested-prompts">
              <button
                v-for="(prompt, idx) in suggestedPrompts"
                :key="idx"
                class="prompt-chip"
                @click="sendSuggested(prompt.text)"
              >
                <span class="prompt-icon">{{ prompt.icon }}</span>
                <span class="prompt-text">{{ prompt.text }}</span>
              </button>
            </div>
          </div>

          <!-- Messages List -->
          <template v-for="(msg, index) in messages" :key="index">
            <!-- User Message -->
            <div v-if="msg.role === 'user'" class="message-row user-row">
              <div class="message-bubble user-bubble">
                <div v-if="msg.image" class="msg-image-wrap">
                  <img :src="msg.image" alt="Uploaded X-ray" class="msg-image-thumb" />
                </div>
                <p v-if="msg.content" class="message-text">{{ msg.content }}</p>
                <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
            </div>

            <!-- AI Message -->
            <div v-else class="message-row ai-row">
              <div class="ai-avatar-sm">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                  <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7v1h1a1 1 0 110 2h-1v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1H2a1 1 0 110-2h1v-1a7 7 0 017-7h1V5.73A2 2 0 0112 2z" fill="#0ea5e9"/>
                  <circle cx="9" cy="14" r="1.5" fill="white"/>
                  <circle cx="15" cy="14" r="1.5" fill="white"/>
                </svg>
              </div>
              <div class="message-bubble ai-bubble" :class="{ 'error-bubble': msg.isError }">
                <div class="message-text" v-html="parseMarkdown(msg.content)"></div>
                <div class="message-meta">
                  <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
                  <span v-if="msg.sources && msg.sources.length" class="source-badge">
                    {{ msg.sources.length }} مصدر
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- Typing Indicator -->
          <div v-if="isTyping" class="message-row ai-row">
            <div class="ai-avatar-sm">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7v1h1a1 1 0 110 2h-1v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1H2a1 1 0 110-2h1v-1a7 7 0 017-7h1V5.73A2 2 0 0112 2z" fill="#0ea5e9"/>
                <circle cx="9" cy="14" r="1.5" fill="white"/>
                <circle cx="15" cy="14" r="1.5" fill="white"/>
              </svg>
            </div>
            <div class="message-bubble ai-bubble typing-bubble">
              <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </div>
              <span class="typing-label">يفكر...</span>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="chat-footer">
          <!-- Image Preview Strip -->
          <div v-if="imagePreview" class="image-preview-bar">
            <img :src="imagePreview" alt="Preview" class="preview-thumb" />
            <span class="preview-name">{{ selectedImage?.name }}</span>
            <button class="preview-remove" @click="clearImage" title="إزالة">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
              </svg>
            </button>
          </div>

          <form class="input-form" @submit.prevent="sendMessage">
            <!-- Hidden File Input -->
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style="display:none"
              @change="onFileSelected"
            />

            <!-- Upload Button -->
            <button
              type="button"
              class="upload-btn"
              @click="$refs.fileInput.click()"
              :disabled="isTyping"
              title="رفع صورة أشعة"
              id="ai-chat-upload"
            >
              📎
            </button>

            <input
              ref="chatInput"
              v-model="inputText"
              type="text"
              class="chat-input"
              :placeholder="selectedImage ? 'أرسل الصورة أو أضف ملاحظة...' : 'اكتب سؤالك هنا...'"
              :disabled="isTyping"
              autocomplete="off"
              id="ai-chat-input"
            />
            <button
              type="submit"
              class="send-btn"
              :disabled="(!inputText.trim() && !selectedImage) || isTyping"
              id="ai-chat-send"
            >
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </transition>

    <!-- Upsell Dialog -->
    <v-dialog v-model="showUpsellDialog" max-width="400" persistent>
      <v-card rounded="xl" class="text-center pa-4">
        <v-card-text class="pt-4">
          <v-icon color="warning" size="64" class="mb-4">mdi-crown</v-icon>
          <h3 class="text-h6 font-weight-bold mb-2">ميزة إضافية</h3>
          <p class="text-body-1 text-medium-emphasis mb-4">
            خدمة المساعد الذكي هي ميزة مدفوعة. يرجى التواصل مع الدعم الفني لترقية باقة العيادة الخاصة بك تفعيلها.
          </p>
        </v-card-text>
        <v-card-actions class="justify-center pb-4">
          <v-btn
            color="primary"
            variant="elevated"
            class="px-6"
            rounded="xl"
            @click="showUpsellDialog = false"
          >
            حسناً
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Error Snackbar -->
    <v-snackbar
      v-model="snackbar"
      color="error"
      timeout="4000"
      location="top"
    >
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar = false">
          إغلاق
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authNew'
import aiService from '@/services/ai.service'

// Store state
const authStore = useAuthStore()

// State
const showUpsellDialog = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const isOpen = ref(false)
const isTyping = ref(false)
const inputText = ref('')
const messages = ref([])
const unreadCount = ref(0)
const isMobile = ref(false)
const chatBody = ref(null)
const chatInput = ref(null)
const fileInput = ref(null)

// Image upload state
const selectedImage = ref(null)
const imagePreview = ref(null)

// Suggested prompts
const suggestedPrompts = [
  { icon: '📅', text: 'ما هي مواعيد اليوم؟' },
  { icon: '💰', text: 'أظهر المرضى الذين لديهم مدفوعات مفقودة' },
  { icon: '📋', text: 'كم عدد الحالات الجارية؟' },
  { icon: '📊', text: 'أعطني ملخص إيرادات اليوم' }
]

// Computed
const isAiEnabled = computed(() => {
  return authStore.clinic?.has_ai_bot === true || authStore.clinic?.has_ai_bot === 1
})

// Methods
const openChat = () => {
  if (!isAiEnabled.value) {
    showUpsellDialog.value = true
    return
  }

  isOpen.value = true
  unreadCount.value = 0
  nextTick(() => {
    chatInput.value?.focus()
    scrollToBottom()
  })
}

const closeChat = () => {
  isOpen.value = false
}

const clearChat = () => {
  messages.value = []
}

const sendSuggested = (text) => {
  inputText.value = text
  sendMessage()
}

// Image handling
const onFileSelected = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    snackbarText.value = 'يرجى اختيار صورة بصيغة JPEG أو PNG أو WebP'
    snackbar.value = true
    return
  }

  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    snackbarText.value = 'حجم الصورة يجب أن لا يتجاوز 10 ميغابايت'
    snackbar.value = true
    return
  }

  selectedImage.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)

  // Reset file input so the same file can be re-selected
  event.target.value = ''
}

const clearImage = () => {
  selectedImage.value = null
  imagePreview.value = null
}

/**
 * Format the structured X-ray analysis into a readable markdown string.
 */
const formatXrayAnalysis = (analysis) => {
  if (!analysis) return 'لم يتم الحصول على نتائج التحليل.'

  let parts = []
  parts.push('## 🦷 تحليل صورة الأشعة\n')

  if (analysis.image_quality) {
    const qualityMap = { clear: '✅ واضحة', moderate: '⚠️ متوسطة', poor: '❌ ضعيفة' }
    parts.push(`**جودة الصورة:** ${qualityMap[analysis.image_quality] || analysis.image_quality}`)
  }

  if (analysis.risk_level) {
    const riskMap = { Low: '🟢 منخفض', Medium: '🟡 متوسط', High: '🔴 مرتفع' }
    parts.push(`**مستوى الخطورة:** ${riskMap[analysis.risk_level] || analysis.risk_level}`)
  }

  if (analysis.observations) {
    parts.push('\n**الملاحظات:**')
    if (Array.isArray(analysis.observations)) {
      analysis.observations.forEach(obs => {
        parts.push(`- ${obs}`)
      })
    } else {
      // If the backend returns a single markdown string
      parts.push(analysis.observations)
    }
  }

  if (analysis.advice) {
    parts.push(`\n**النصيحة:** ${analysis.advice}`)
  }

  if (analysis.summary) {
    parts.push(`\n**ملخص للمريض:** ${analysis.summary}`)
  }

  return parts.join('\n')
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  const hasImage = !!selectedImage.value

  if ((!text && !hasImage) || isTyping.value) return

  // Capture image data for the user message bubble
  const msgImage = imagePreview.value || null
  const imageFile = selectedImage.value

  // Add user message
  messages.value.push({
    role: 'user',
    content: hasImage ? (text || '📷 صورة أشعة') : text,
    image: msgImage,
    timestamp: new Date()
  })
  inputText.value = ''
  clearImage()

  await nextTick()
  scrollToBottom()

  // Show typing indicator
  isTyping.value = true

  try {
    let response

    if (hasImage) {
      // X-ray analysis path
      response = await aiService.analyzeXray(msgImage)
      const payload = response.data || response

      if (response.success !== false) {
        const analysis = payload.analysis || payload.data?.analysis
        const rawResponse = payload.raw_response || payload.data?.raw_response

        const content = analysis
          ? formatXrayAnalysis(analysis)
          : (rawResponse || 'تم تحليل الصورة بنجاح.')

        messages.value.push({
          role: 'ai',
          content,
          timestamp: new Date()
        })
      } else {
        messages.value.push({
          role: 'ai',
          content: response.message || 'حدث خطأ في تحليل الصورة.',
          isError: true,
          timestamp: new Date()
        })
      }
    } else {
      // Regular text chat path
      response = await aiService.chat(text)
      const payload = response.data || response

      if (response.success) {
        messages.value.push({
          role: 'ai',
          content: payload.answer || 'لم أتمكن من العثور على إجابة.',
          sources: payload.sources || [],
          timestamp: new Date()
        })
      } else {
        messages.value.push({
          role: 'ai',
          content: response.message || 'حدث خطأ في معالجة طلبك.',
          isError: true,
          timestamp: new Date()
        })
      }
    }
  } catch (error) {
    console.error('AI Chat Error:', error)
    
    if (error.response?.status === 403) {
      snackbarText.value = error.response?.data?.message || 'خدمة الذكاء الاصطناعي غير مفعلة لهذه العيادة. يرجى التواصل مع الدعم الفني.'
      snackbar.value = true
      messages.value.push({
        role: 'ai',
        content: snackbarText.value,
        isError: true,
        timestamp: new Date()
      })
    } else {
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout')
      messages.value.push({
        role: 'ai',
        content: isTimeout
          ? 'عذراً، استغرق التحليل وقتاً طويلاً. يرجى المحاولة مرة أخرى بصورة أوضح.'
          : 'عذراً، حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
        isError: true,
        timestamp: new Date()
      })
    }
  } finally {
    isTyping.value = false
    await nextTick()
    scrollToBottom()

    if (!isOpen.value) {
      unreadCount.value++
    }
  }
}

const scrollToBottom = () => {
  if (chatBody.value) {
    chatBody.value.scrollTop = chatBody.value.scrollHeight
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

/**
 * Lightweight Markdown parser for AI responses.
 * Supports: **bold**, *italic*, - lists, numbered lists, `code`, ### headings, \n line breaks
 */
const parseMarkdown = (text) => {
  if (!text) return ''

  let html = text
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headings (### h3, ## h2, # h1)
  html = html.replace(/^### (.+)$/gm, '<strong style="font-size:1.05em;display:block;margin:8px 0 4px;">$1</strong>')
  html = html.replace(/^## (.+)$/gm, '<strong style="font-size:1.1em;display:block;margin:8px 0 4px;">$1</strong>')
  html = html.replace(/^# (.+)$/gm, '<strong style="font-size:1.15em;display:block;margin:10px 0 4px;">$1</strong>')

  // Bold **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Italic *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:3px;font-size:0.9em;">$1</code>')

  // Unordered lists (- item)
  html = html.replace(/^- (.+)$/gm, '<li style="margin:2px 0;margin-inline-start:16px;list-style:disc;">$1</li>')

  // Ordered lists (1. item)
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin:2px 0;margin-inline-start:16px;list-style:decimal;">$1</li>')

  // Wrap consecutive <li> items
  html = html.replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, '<ul style="padding:0;margin:4px 0;">$1</ul>')

  // Line breaks
  html = html.replace(/\n/g, '<br>')

  // Clean up double <br> after </ul>
  html = html.replace(/<\/ul><br>/g, '</ul>')

  return html
}

// Responsive check
const checkMobile = () => {
  isMobile.value = window.innerWidth < 640
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

defineExpose({ openChat })
</script>

<style scoped>
/* ====================== FAB Button ====================== */
@media (max-width: 959px) {
  .chat-fab {
    display: none !important;
  }
}

.chat-fab {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 14px rgba(14, 165, 233, 0.4),
    0 8px 32px rgba(99, 102, 241, 0.25);
  z-index: 9999;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.chat-fab:hover {
  transform: scale(1.08);
  box-shadow:
    0 6px 20px rgba(14, 165, 233, 0.5),
    0 12px 40px rgba(99, 102, 241, 0.35);
}

.chat-fab:active {
  transform: scale(0.95);
}

.fab-icon {
  width: 28px;
  height: 28px;
  position: relative;
  z-index: 2;
}

.fab-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
  animation: fabPulse 2s ease-in-out infinite;
  z-index: 1;
}

@keyframes fabPulse {
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.35); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
}

.fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  border: 2px solid white;
}

/* ====================== Chat Window ====================== */
.chat-window {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 400px;
  height: 580px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
  /* Glassmorphism */
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.chat-window.chat-mobile {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  border-radius: 0;
}

/* ====================== Header ====================== */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%);
  color: white;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  font-family: 'Cairo', sans-serif;
}

.header-status {
  font-size: 11px;
  opacity: 0.85;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  display: inline-block;
  animation: statusPulse 2s infinite;
}

@keyframes statusPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.header-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

/* ====================== Body ====================== */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}

.chat-body::-webkit-scrollbar {
  width: 4px;
}

.chat-body::-webkit-scrollbar-track {
  background: transparent;
}

.chat-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

/* ====================== Empty State ====================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  padding: 20px 16px;
}

.empty-icon {
  margin-bottom: 16px;
  animation: floatBounce 3s ease-in-out infinite;
}

@keyframes floatBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.empty-title {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px;
  font-family: 'Cairo', sans-serif;
}

.empty-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 20px;
  font-family: 'Cairo', sans-serif;
}

.suggested-prompts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 320px;
}

.prompt-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid rgba(14, 165, 233, 0.15);
  border-radius: 12px;
  background: rgba(14, 165, 233, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: start;
  font-family: 'Cairo', sans-serif;
}

.prompt-chip:hover {
  background: rgba(14, 165, 233, 0.1);
  border-color: rgba(14, 165, 233, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.12);
}

.prompt-chip:active {
  transform: scale(0.98);
}

.prompt-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.prompt-text {
  font-size: 13px;
  color: #334155;
  line-height: 1.4;
}

/* ====================== Messages ====================== */
.message-row {
  display: flex;
  gap: 8px;
  animation: msgAppear 0.3s ease-out;
}

@keyframes msgAppear {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-row {
  justify-content: flex-end;
}

.ai-row {
  justify-content: flex-start;
  align-items: flex-end;
}

.ai-avatar-sm {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: linear-gradient(135deg, #e0f2fe, #ede9fe);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 16px;
  position: relative;
}

.user-bubble {
  background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

[dir="rtl"] .user-bubble {
  border-bottom-right-radius: 16px;
  border-bottom-left-radius: 4px;
}

.ai-bubble {
  background: rgba(241, 245, 249, 0.9);
  color: #1e293b;
  border: 1px solid rgba(226, 232, 240, 0.6);
  border-bottom-left-radius: 4px;
}

[dir="rtl"] .ai-bubble {
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 4px;
}

.error-bubble {
  background: rgba(254, 242, 242, 0.95);
  border-color: rgba(252, 165, 165, 0.4);
  color: #991b1b;
}

.message-text {
  font-size: 13.5px;
  line-height: 1.6;
  word-wrap: break-word;
  font-family: 'Cairo', sans-serif;
}

.message-text :deep(ul) {
  padding: 0;
  margin: 4px 0;
}

.message-text :deep(li) {
  margin-inline-start: 16px;
}

.message-text :deep(strong) {
  font-weight: 700;
}

.message-text :deep(code) {
  font-family: monospace;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.message-time {
  font-size: 10px;
  opacity: 0.55;
  margin-top: 3px;
  display: block;
}

.source-badge {
  font-size: 10px;
  background: rgba(14, 165, 233, 0.1);
  color: #0ea5e9;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
}

/* ====================== Typing Indicator ====================== */
.typing-bubble {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
  animation: typingBounce 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

.typing-label {
  font-size: 12px;
  color: #94a3b8;
  font-family: 'Cairo', sans-serif;
}

/* ====================== Footer / Input ====================== */
.chat-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(226, 232, 240, 0.5);
  background: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
}

/* Image Preview Bar */
.image-preview-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 8px;
  background: rgba(14, 165, 233, 0.06);
  border: 1px solid rgba(14, 165, 233, 0.15);
  border-radius: 10px;
  animation: msgAppear 0.25s ease-out;
}

.preview-thumb {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid rgba(14, 165, 233, 0.2);
}

.preview-name {
  flex: 1;
  font-size: 12px;
  color: #475569;
  font-family: 'Cairo', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}

.preview-remove:hover {
  background: rgba(239, 68, 68, 0.2);
}

.input-form {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Upload Button */
.upload-btn {
  width: 42px;
  height: 42px;
  border: 1.5px solid rgba(203, 213, 225, 0.6);
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
}

.upload-btn:hover:not(:disabled) {
  border-color: #0ea5e9;
  background: rgba(14, 165, 233, 0.06);
  transform: scale(1.05);
}

.upload-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.upload-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.chat-input {
  flex: 1;
  height: 42px;
  border: 1.5px solid rgba(203, 213, 225, 0.6);
  border-radius: 12px;
  padding: 0 14px;
  font-size: 13.5px;
  font-family: 'Cairo', sans-serif;
  background: rgba(248, 250, 252, 0.8);
  color: #1e293b;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.chat-input::placeholder {
  color: #94a3b8;
}

.chat-input:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.chat-input:disabled {
  opacity: 0.6;
}

.send-btn {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.15s, opacity 0.2s;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

/* ====================== Image in Messages ====================== */
.msg-image-wrap {
  margin-bottom: 6px;
}

.msg-image-thumb {
  max-width: 180px;
  max-height: 140px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
}

/* ====================== Transitions ====================== */
.fab-bounce-enter-active {
  animation: fabEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-bounce-leave-active {
  animation: fabLeave 0.2s ease-in;
}

@keyframes fabEnter {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fabLeave {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0); opacity: 0; }
}

.chat-slide-enter-active {
  animation: chatEnter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chat-slide-leave-active {
  animation: chatLeave 0.2s ease-in;
}

@keyframes chatEnter {
  0% { transform: translateY(20px) scale(0.95); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes chatLeave {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(20px) scale(0.95); opacity: 0; }
}

/* ====================== Mobile Adjustments ====================== */
@media (max-width: 639px) {
  .chat-fab {
    bottom: 76px;
    right: 16px;
    width: 54px;
    height: 54px;
  }

  .fab-icon {
    width: 24px;
    height: 24px;
  }

  .chat-window.chat-mobile {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .chat-window.chat-mobile .chat-footer {
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }
}

/* RTL adjustments */
[dir="rtl"] .send-btn svg {
  transform: scaleX(-1);
}

[dir="rtl"] .chat-fab {
  right: auto;
  left: 20px;
}

[dir="rtl"] .chat-window {
  right: auto;
  left: 20px;
}

@media (max-width: 639px) {
  [dir="rtl"] .chat-fab {
    left: 16px;
  }

  [dir="rtl"] .chat-window.chat-mobile {
    left: 0;
  }
}
</style>
