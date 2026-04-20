<template>
  <div class="ai-assistant-page">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3">
        <h1 class="text-h5 text-md-h4 font-weight-bold text-primary ma-0">
          <v-icon class="me-2">mdi-robot</v-icon>
          {{ $t('ai.title') }}
        </h1>
        
        <div class="d-flex ga-2">
          <v-btn
            color="secondary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-chart-line"
            @click="showReportDialog = true"
          >
            {{ $t('ai.generateReport') }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12" md="3" v-for="quickAction in quickActions" :key="quickAction.key">
        <v-card 
          class="quick-action-card cursor-pointer"
          elevation="2"
          rounded="xl"
          @click="askQuestion(quickAction.question)"
        >
          <v-card-text class="pa-4 text-center">
            <v-icon :color="quickAction.color" size="40" class="mb-3">
              {{ quickAction.icon }}
            </v-icon>
            <h3 class="text-h6 font-weight-bold mb-2">{{ $t(quickAction.title) }}</h3>
            <p class="text-caption text-medium-emphasis mb-0">{{ $t(quickAction.description) }}</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Chat Interface -->
    <v-row>
      <!-- Messages Area -->
      <v-col cols="12" md="8">
        <v-card elevation="2" rounded="xl" class="chat-container">
          <v-card-title class="pa-4 bg-primary">
            <v-icon start>mdi-chat</v-icon>
            <span class="text-white">{{ $t('ai.chatTitle') }}</span>
            <v-spacer />
            <v-btn
              icon="mdi-refresh"
              variant="text"
              color="white"
              @click="clearChat"
              :disabled="messages.length === 0"
            >
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-card-title>
          
          <v-divider />
          
          <v-card-text class="pa-4 chat-messages" ref="chatContainer">
            <!-- Welcome Message -->
            <div v-if="messages.length === 0" class="text-center py-8">
              <v-icon size="64" color="primary" class="mb-4">mdi-robot-outline</v-icon>
              <h3 class="text-h6 font-weight-bold mb-2">{{ $t('ai.welcome') }}</h3>
              <p class="text-grey mb-4">{{ $t('ai.welcomeDescription') }}</p>
              
              <!-- Sample Questions -->
              <div class="sample-questions">
                <p class="text-caption text-medium-emphasis mb-3">{{ $t('ai.sampleQuestions') }}:</p>
                <div class="d-flex flex-wrap justify-center gap-2">
                  <v-chip
                    v-for="sample in sampleQuestions"
                    :key="sample"
                    size="small"
                    color="primary"
                    variant="tonal"
                    class="cursor-pointer"
                    @click="askQuestion(sample)"
                  >
                    {{ sample }}
                  </v-chip>
                </div>
              </div>
            </div>
            
            <!-- Messages -->
            <div v-for="(message, index) in messages" :key="index" class="mb-4">
              <!-- User Message -->
              <div v-if="message.type === 'user'" class="d-flex justify-end mb-2">
                <div class="message-bubble user-message">
                  <div class="message-content">{{ message.content }}</div>
                  <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                </div>
                <v-avatar size="32" class="ml-2">
                  <v-icon>mdi-account</v-icon>
                </v-avatar>
              </div>
              
              <!-- AI Message -->
              <div v-else class="d-flex justify-start mb-2">
                <v-avatar size="32" class="mr-2">
                  <v-icon color="primary">mdi-robot</v-icon>
                </v-avatar>
                <div class="message-bubble ai-message">
                  <div class="message-content" v-html="formatMessage(message.content)"></div>
                  <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                </div>
              </div>
            </div>
            
            <!-- Typing Indicator -->
            <div v-if="loading" class="d-flex justify-start mb-2">
              <v-avatar size="32" class="mr-2">
                <v-icon color="primary">mdi-robot</v-icon>
              </v-avatar>
              <div class="message-bubble ai-message typing-indicator">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </v-card-text>
          
          <v-divider />
          
          <!-- Input Area -->
          <v-card-text class="pa-4">
            <v-form @submit.prevent="sendMessage">
              <div class="d-flex ga-2">
                <v-text-field
                  v-model="currentMessage"
                  :label="$t('ai.typeQuestion')"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :disabled="loading"
                  @keyup.enter="sendMessage"
                  prepend-inner-icon="mdi-chat-question"
                />
                <v-btn
                  color="primary"
                  type="submit"
                  :loading="loading"
                  :disabled="!currentMessage.trim()"
                  elevation="2"
                >
                  <v-icon>mdi-send</v-icon>
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Reports Panel -->
      <v-col cols="12" md="4">
        <v-card elevation="2" rounded="xl">
          <v-card-title class="pa-4 bg-secondary">
            <v-icon start>mdi-chart-box</v-icon>
            <span class="text-white">{{ $t('ai.reports') }}</span>
          </v-card-title>
          
          <v-divider />
          
          <v-card-text class="pa-4">
            <!-- Report Types -->
            <div class="mb-4">
              <h3 class="text-subtitle-1 font-weight-bold mb-3">{{ $t('ai.reportTypes') }}</h3>
              <div class="d-flex flex-column gap-2">
                <v-btn
                  v-for="reportType in reportTypes"
                  :key="reportType.type"
                  :color="reportType.color"
                  variant="tonal"
                  size="small"
                  block
                  @click="generateReport(reportType.type)"
                  :loading="reportLoading === reportType.type"
                >
                  <v-icon start>{{ reportType.icon }}</v-icon>
                  {{ $t(reportType.title) }}
                </v-btn>
              </div>
            </div>
            
            <!-- Recent Reports -->
            <div v-if="recentReports.length > 0">
              <h3 class="text-subtitle-1 font-weight-bold mb-3">{{ $t('ai.recentReports') }}</h3>
              <div class="d-flex flex-column gap-2">
                <v-card
                  v-for="report in recentReports"
                  :key="report.id"
                  variant="outlined"
                  class="cursor-pointer"
                  @click="viewReport(report)"
                >
                  <v-card-text class="pa-3">
                    <div class="d-flex align-center justify-space-between">
                      <span class="font-weight-medium">{{ report.type }}</span>
                      <v-chip size="x-small" color="primary">
                        {{ formatDate(report.created_at) }}
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Report Generation Dialog -->
    <v-dialog v-model="showReportDialog" max-width="500">
      <v-card rounded="xl">
        <v-card-title class="pa-4 bg-primary">
          <span class="text-white">{{ $t('ai.generateReport') }}</span>
          <v-spacer />
          <v-btn icon variant="text" color="white" @click="showReportDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pa-6">
          <h3 class="text-h6 mb-4">{{ $t('ai.selectReportType') }}</h3>
          
          <div class="d-flex flex-column gap-3">
            <v-card
              v-for="reportType in reportTypes"
              :key="reportType.type"
              :class="{ 'selected': selectedReportType === reportType.type }"
              :color="selectedReportType === reportType.type ? 'primary' : undefined"
              :variant="selectedReportType === reportType.type ? 'tonal' : 'outlined'"
              class="cursor-pointer"
              rounded="lg"
              @click="selectedReportType = reportType.type"
            >
              <v-card-text class="pa-4">
                <div class="d-flex align-center ga-3">
                  <v-icon :color="selectedReportType === reportType.type ? 'primary' : reportType.color" size="24">
                    {{ reportType.icon }}
                  </v-icon>
                  <div>
                    <h4 class="text-subtitle-1 font-weight-bold">{{ $t(reportType.title) }}</h4>
                    <p class="text-caption text-medium-emphasis mb-0">{{ $t(reportType.description) }}</p>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showReportDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="reportLoading"
            :disabled="!selectedReportType"
            @click="confirmGenerateReport"
          >
            {{ $t('ai.generate') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Report View Dialog -->
    <v-dialog v-model="showReportViewDialog" max-width="800">
      <v-card rounded="xl">
        <v-card-title class="pa-4 bg-primary">
          <span class="text-white">{{ $t('ai.report') }}: {{ currentReport?.type }}</span>
          <v-spacer />
          <v-btn icon variant="text" color="white" @click="showReportViewDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pa-6">
          <div v-if="currentReport" class="report-content">
            <div class="mb-4">
              <v-chip color="primary" size="small">
                {{ formatDate(currentReport.created_at) }}
              </v-chip>
            </div>
            <div v-html="formatMessage(currentReport.content)"></div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import aiService from '@/services/ai.service'

const { t } = useI18n()

// State
const messages = ref([])
const currentMessage = ref('')
const loading = ref(false)
const reportLoading = ref('')
const showReportDialog = ref(false)
const showReportViewDialog = ref(false)
const selectedReportType = ref('')
const currentReport = ref(null)
const recentReports = ref([])
const chatContainer = ref(null)

// Quick Actions
const quickActions = ref([
  {
    key: 'patients',
    icon: 'mdi-account-group',
    color: 'primary',
    title: 'ai.patientCount',
    description: 'ai.patientCountDesc',
    question: 'How many patients do we have?'
  },
  {
    key: 'revenue',
    icon: 'mdi-cash-multiple',
    color: 'success',
    title: 'ai.totalRevenue',
    description: 'ai.totalRevenueDesc',
    question: 'What is our total revenue?'
  },

  {
    key: 'activity',
    icon: 'mdi-chart-line',
    color: 'info',
    title: 'ai.todayActivity',
    description: 'ai.todayActivityDesc',
    question: 'Show me today\'s activity'
  }
])

// Sample Questions
const sampleQuestions = ref([
  'How many patients do we have?',
  'What is our total revenue?',
  'Show me today\'s activity',
  'Financial summary?',
  'How many new patients this month?',
  'What\'s our collection rate?',
  'Doctor workload overview?'
])

// Report Types
const reportTypes = ref([
  {
    type: 'general',
    icon: 'mdi-chart-box',
    color: 'primary',
    title: 'ai.generalReport',
    description: 'ai.generalReportDesc'
  },
  {
    type: 'financial',
    icon: 'mdi-cash-multiple',
    color: 'success',
    title: 'ai.financialReport',
    description: 'ai.financialReportDesc'
  },
  {
    type: 'operational',
    icon: 'mdi-cogs',
    color: 'warning',
    title: 'ai.operationalReport',
    description: 'ai.operationalReportDesc'
  },
  {
    type: 'summary',
    icon: 'mdi-file-chart',
    color: 'info',
    title: 'ai.summaryReport',
    description: 'ai.summaryReportDesc'
  }
])

// Methods
const askQuestion = (question) => {
  currentMessage.value = question
  sendMessage()
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || loading.value) return
  
  const userMessage = currentMessage.value.trim()
  currentMessage.value = ''
  
  // Add user message
  messages.value.push({
    type: 'user',
    content: userMessage,
    timestamp: new Date()
  })
  
  // Scroll to bottom
  await nextTick()
  scrollToBottom()
  
  // Add AI response placeholder
  loading.value = true
  
  try {
    const response = await aiService.askQuestion(userMessage)
    
    messages.value.push({
      type: 'ai',
      content: response.data?.answer || response.data?.response || 'Sorry, I could not process your request.',
      timestamp: new Date()
    })
    
    // Scroll to bottom
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Error asking question:', error)
    messages.value.push({
      type: 'ai',
      content: 'Sorry, there was an error processing your request.',
      timestamp: new Date()
    })
  } finally {
    loading.value = false
  }
}

const generateReport = async (type) => {
  reportLoading.value = type
  
  try {
    const response = await aiService.generateReport(type)
    
    const report = {
      id: Date.now(),
      type: type,
      content: response.data?.report || response.data?.content || 'Report generation failed.',
      created_at: new Date()
    }
    
    recentReports.value.unshift(report)
    
    // Show report view dialog
    currentReport.value = report
    showReportViewDialog.value = true
  } catch (error) {
    console.error('Error generating report:', error)
    // Show error message
    currentReport.value = {
      id: Date.now(),
      type: type,
      content: 'Failed to generate report. Please try again.',
      created_at: new Date()
    }
    showReportViewDialog.value = true
  } finally {
    reportLoading.value = ''
  }
}

const confirmGenerateReport = async () => {
  if (!selectedReportType.value) return
  
  showReportDialog.value = false
  await generateReport(selectedReportType.value)
  selectedReportType.value = ''
}

const viewReport = (report) => {
  currentReport.value = report
  showReportViewDialog.value = true
}

const clearChat = () => {
  messages.value = []
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatMessage = (content) => {
  // Convert line breaks to <br>
  return content.replace(/\n/g, '<br>')
}

// Lifecycle
onMounted(() => {
  // Initialize with welcome message if needed
})
</script>

<style scoped>
.ai-assistant-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.quick-action-card {
  transition: all 0.3s ease;
  height: 100%;
}

.quick-action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.chat-container {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  position: relative;
}

.user-message {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-message {
  background: #f5f7fa;
  color: #333;
  border-bottom-left-radius: 4px;
}

.message-content {
  line-height: 1.4;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

.typing-indicator {
  padding: 16px 20px;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.sample-questions {
  max-width: 600px;
  margin: 0 auto;
}

.report-content {
  line-height: 1.6;
}

.selected {
  border: 2px solid currentColor;
}

/* RTL Support */
[dir="rtl"] .ai-assistant-page {
  text-align: right;
}

[dir="rtl"] .user-message {
  border-bottom-right-radius: 16px;
  border-bottom-left-radius: 4px;
}

[dir="rtl"] .ai-message {
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 16px;
}

/* Responsive */
@media (max-width: 960px) {
  .ai-assistant-page {
    padding: 16px;
  }
  
  .chat-container {
    height: 500px;
  }
  
  .message-bubble {
    max-width: 85%;
  }
}
</style>
