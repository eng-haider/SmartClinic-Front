<template>
  <v-container fluid class="py-6">
    <v-card class="conversation-shell">
      <div class="conversation-layout" :class="{ mobile: isMobile }">
        <v-navigation-drawer
          :model-value="true"
          :permanent="true"
          :temporary="false"
          :scrim="false"
          :width="320"
          class="conversation-list-drawer"
        >
          <v-toolbar density="comfortable" title="المحادثات" />
          <v-divider />

          <v-skeleton-loader v-if="store.loadingConversations" type="list-item-two-line@6" />

          <v-list v-else lines="two" nav>
            <v-list-item
              v-for="conversation in store.conversations"
              :key="conversation.id"
              :active="conversation.id === store.activeConversation?.id"
              @click="selectConversation(conversation.id)"
            >
              <template #prepend>
                <v-icon color="success">mdi-whatsapp</v-icon>
              </template>
              <v-list-item-title>{{ conversation.patient_phone || '-' }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ relativeTime(conversation.last_message_at) }}
              </v-list-item-subtitle>

              <template #append>
                <v-chip size="x-small" :color="conversation.status === 'open' ? 'success' : 'grey'">
                  {{ conversation.status || 'open' }}
                </v-chip>
              </template>
            </v-list-item>

            <div v-if="!store.conversations.length" class="text-center text-medium-emphasis py-8">
              لا توجد محادثات حالياً.
            </div>
          </v-list>
        </v-navigation-drawer>

        <div class="chat-panel d-flex flex-column">
          <div class="chat-header px-4 py-3 d-flex justify-space-between align-center">
            <div>
              <div class="text-subtitle-1 font-weight-medium">
                {{ store.activeConversation?.patient_phone || 'اختر محادثة' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ store.activeConversation?.channel || 'whatsapp' }}
              </div>
            </div>
          </div>

          <v-divider />

          <div ref="messagesContainer" class="messages-area pa-4">
            <v-skeleton-loader v-if="store.loadingMessages" type="list-item-two-line@5" />

            <div v-else-if="!store.messages.length" class="text-center text-medium-emphasis py-10">
              لا توجد رسائل في هذه المحادثة.
            </div>

            <div v-else>
              <div
                v-for="message in store.messages"
                :key="message.id"
                class="message-row"
                :class="message.direction === 'inbound' ? 'inbound' : 'outbound'"
              >
                <div class="message-bubble" :class="message.direction === 'inbound' ? 'bubble-inbound' : 'bubble-outbound'">
                  <div class="text-body-2">{{ message.body }}</div>
                  <div class="message-meta">
                    <span>{{ formatTime(message.created_at) }}</span>
                    <v-tooltip v-if="message.status === 'failed' && message.error" location="top">
                      <template #activator="{ props }">
                        <v-icon v-bind="props" :color="statusIcon(message.status).color" size="14">
                          {{ statusIcon(message.status).icon }}
                        </v-icon>
                      </template>
                      <span>{{ message.error }}</span>
                    </v-tooltip>
                    <v-icon v-else :color="statusIcon(message.status).color" size="14">
                      {{ statusIcon(message.status).icon }}
                    </v-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <v-divider />

          <div class="pa-3 d-flex ga-2 align-end">
            <v-textarea
              v-model="newMessage"
              label="اكتب رسالة"
              rows="1"
              auto-grow
              hide-details
              variant="outlined"
              class="flex-grow-1"
              @keydown.enter.exact.prevent="send"
            />
            <v-btn
              color="primary"
              :loading="store.sending"
              :disabled="!store.activeConversation || !newMessage.trim()"
              @click="send"
            >
              Send
            </v-btn>
          </div>
        </div>
      </div>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom end" timeout="4000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useMessagingConversationsStore } from '@/stores/messaging/conversationsStore'

const store = useMessagingConversationsStore()
const { smAndDown } = useDisplay()

const isMobile = smAndDown
const newMessage = ref('')
const messagesContainer = ref(null)

const snackbar = ref({ show: false, message: '', color: 'error' })

function notify(message, color = 'error') {
  snackbar.value = { show: true, message, color }
}

function statusIcon(status) {
  if (status === 'queued') return { icon: 'mdi-clock-outline', color: 'grey' }
  if (status === 'sent') return { icon: 'mdi-check', color: 'grey' }
  if (status === 'delivered') return { icon: 'mdi-check-all', color: 'grey' }
  if (status === 'read') return { icon: 'mdi-check-all', color: 'info' }
  if (status === 'failed') return { icon: 'mdi-close-circle', color: 'error' }
  return { icon: 'mdi-check', color: 'grey' }
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
}

function relativeTime(value) {
  if (!value) return '-'

  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'الآن'
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `منذ ${diffHours} ساعة`

  const diffDays = Math.floor(diffHours / 24)
  return `منذ ${diffDays} يوم`
}

async function selectConversation(id) {
  try {
    await store.fetchConversation(id)
    await scrollToBottom()
  } catch (error) {
    notify(error.message)
  }
}

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

async function send() {
  if (!newMessage.value.trim()) return

  try {
    await store.sendMessage(newMessage.value.trim())
    newMessage.value = ''
    await scrollToBottom()
  } catch (error) {
    notify(error.message)
  }
}

watch(
  () => store.messages.length,
  async () => {
    await scrollToBottom()
  }
)

onMounted(async () => {
  try {
    await store.fetchConversations()
    if (store.conversations.length) {
      await selectConversation(store.conversations[0].id)
    }
  } catch (error) {
    notify(error.message)
  }
})
</script>

<style scoped>
.conversation-shell {
  min-height: 70vh;
}

.conversation-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  min-height: 70vh;
}

.conversation-layout.mobile {
  grid-template-columns: 1fr;
}

.conversation-list-drawer {
  position: relative !important;
  height: 100%;
}

.conversation-layout.mobile .conversation-list-drawer {
  width: 100% !important;
  max-width: 100% !important;
}

.chat-panel {
  min-height: 70vh;
}

.chat-header {
  min-height: 64px;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  background: linear-gradient(180deg, rgba(23, 99, 141, 0.04), rgba(23, 99, 141, 0));
}

.message-row {
  display: flex;
  margin-bottom: 12px;
}

.message-row.inbound {
  justify-content: flex-start;
}

.message-row.outbound {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 75%;
  border-radius: 12px;
  padding: 10px 12px;
}

.bubble-inbound {
  background: #f1f3f5;
}

.bubble-outbound {
  background: #d9f5df;
}

.message-meta {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
}
</style>
