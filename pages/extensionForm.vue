<template>
  <div class="bg-white dark:bg-gray-900 py-0 sm:py-8">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <SectionHeader
        title="Revision/Extension Report"
        subtitle="Submit information about trip extensions and revisions for Scheduling Committee review"
      />

      <!-- Offline/Online Status & Pending Submissions -->
      <div class="mt-6 max-w-3xl mx-auto space-y-3">
        <!-- Offline Indicator -->
        <UAlert
          v-if="!isOnline"
          color="amber"
          variant="soft"
          title="Offline Mode"
          description="You're currently offline. Submissions will be queued and automatically synced when you're back online."
          icon="i-heroicons-wifi-slash"
        />

        <!-- Syncing Indicator -->
        <UAlert
          v-if="isSyncing"
          color="blue"
          variant="soft"
          title="Syncing Submissions"
          description="Uploading queued submissions to the server..."
          icon="i-heroicons-arrow-path"
        />

        <!-- Pending Submissions Count -->
        <UAlert
          v-if="pendingCount > 0 && !isSyncing"
          color="sky"
          variant="soft"
          :title="`${pendingCount} Pending Submission${pendingCount > 1 ? 's' : ''}`"
          :description="`You have ${pendingCount} submission${pendingCount > 1 ? 's' : ''} waiting to be synced. ${isOnline ? 'Syncing will happen automatically.' : 'Will sync when back online.'}`"
          icon="i-heroicons-clock"
        />
      </div>

      <div class="mt-8 max-w-3xl mx-auto">
        <UCard>
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Employee Number -->
            <div>
              <label for="employeeNumber" class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Employee Number <span class="text-red-600">*</span>
              </label>
              <UInput
                v-model="formData.employeeNumber"
                id="employeeNumber"
                type="text"
                placeholder="Your employee number"
                required
                class="w-full"
              />
            </div>

            <!-- Contact Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Contact Email <span class="text-red-600">*</span>
              </label>
              <UInput
                v-model="formData.contactEmail"
                id="email"
                type="email"
                placeholder="your.email@example.com"
                required
                class="w-full"
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                For follow-up questions about your submission
              </p>
            </div>

            <!-- Trip Number -->
            <div>
              <label for="tripNumber" class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Trip Number <span class="text-red-600">*</span>
              </label>
              <UInput
                v-model="formData.tripNumber"
                id="tripNumber"
                type="text"
                placeholder="e.g., 1234"
                required
                class="w-full"
              />
            </div>

            <!-- Number of Revisions -->
            <div>
              <label for="revisions" class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Number of Revisions <span class="text-red-600">*</span>
              </label>
              <USelect
                v-model="formData.numberOfRevisions"
                id="revisions"
                :options="revisionOptions"
                required
                class="w-full"
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                How many times was this trip revised?
              </p>
            </div>

            <!-- Was Trip Extended -->
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Was this trip extended? <span class="text-red-600">*</span>
              </label>
              <div class="flex gap-4">
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="formData.wasExtended"
                    type="radio"
                    :value="true"
                    class="h-4 w-4 text-red-600 focus:ring-red-600 border-gray-300"
                    required
                  />
                  <span class="ml-2 text-sm text-gray-900 dark:text-white">Yes</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="formData.wasExtended"
                    type="radio"
                    :value="false"
                    class="h-4 w-4 text-red-600 focus:ring-red-600 border-gray-300"
                    required
                  />
                  <span class="ml-2 text-sm text-gray-900 dark:text-white">No</span>
                </label>
              </div>
            </div>

            <!-- Extension Information (conditional) -->
            <div v-if="formData.wasExtended">
              <label for="extensionInfo" class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Extension Information <span class="text-red-600">*</span>
              </label>
              <UTextarea
                v-model="formData.extensionInformation"
                id="extensionInfo"
                placeholder="Please provide details about the extension, including dates, times, circumstances, and any relevant information..."
                :rows="6"
                :required="formData.wasExtended"
                class="w-full"
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Include specific details about the extension circumstances
              </p>
            </div>

            <!-- Screenshot Upload -->
            <div>
              <label for="screenshot" class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Upload Screenshot (Optional)
              </label>
              <input
                id="screenshot"
                type="file"
                accept="image/*"
                @change="handleFileUpload"
                class="block w-full text-sm text-gray-900 dark:text-white
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-red-50 file:text-red-700
                       hover:file:bg-red-100
                       dark:file:bg-gray-700 dark:file:text-gray-300
                       dark:hover:file:bg-gray-600
                       cursor-pointer"
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload a screenshot of the trip or extension details (PNG, JPG, or JPEG)
              </p>
              <div v-if="formData.screenshot" class="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Icon name="heroicons:check-circle" class="h-5 w-5" />
                <span>{{ formData.screenshot.name }}</span>
                <button
                  type="button"
                  @click="removeScreenshot"
                  class="text-red-600 dark:text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <UButton
                v-if="submissionSuccess"
                color="green"
                variant="soft"
                icon="i-heroicons-check-circle"
                disabled
              >
                Submitted Successfully
              </UButton>
              <UButton
                v-else
                type="submit"
                color="red"
                :loading="isSubmitting"
                :disabled="!isFormValid"
              >
                {{ isSubmitting ? 'Submitting...' : 'Submit Extension Report' }}
              </UButton>
            </div>

            <!-- Error Message -->
            <UAlert
              v-if="errorMessage"
              color="red"
              variant="soft"
              title="Submission Error"
              :description="errorMessage"
              :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'red', variant: 'link' }"
              @close="errorMessage = ''"
            />

            <!-- Success Message -->
            <UAlert
              v-if="submissionSuccess && !queuedOffline"
              color="green"
              variant="soft"
              title="Submission Successful"
              description="Thank you for your extension report. The Scheduling Committee will review your submission."
            />

            <!-- Queued Offline Success Message -->
            <UAlert
              v-if="submissionSuccess && queuedOffline"
              color="blue"
              variant="soft"
              title="Queued for Sync"
              description="Your submission has been saved locally and will be automatically uploaded when you're back online."
              icon="i-heroicons-check-circle"
            />
          </form>
        </UCard>

        <!-- Privacy Notice -->
        <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <strong>Privacy Notice:</strong> All information submitted through this form is handled in accordance with ALPA privacy policies.
            Your submission will be reviewed by the Scheduling Committee for the purpose of tracking and addressing extension-related issues.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

definePageMeta({
  title: 'Extension Form',
});

// Offline queue composable
const { queueSubmission, syncAllPending, pendingCount, isSyncing } = useOfflineQueue();

// Online/Offline state
const isOnline = ref(true);
const queuedOffline = ref(false);

// Form data
const formData = ref({
  employeeNumber: '',
  contactEmail: '',
  tripNumber: '',
  numberOfRevisions: 1,
  wasExtended: null as boolean | null,
  extensionInformation: '',
  screenshot: null as File | null,
});

// Revision options
const revisionOptions = [
  { value: 1, label: '1 revision' },
  { value: 2, label: '2 revisions' },
  { value: 3, label: '3 revisions' },
  { value: 4, label: '4 revisions' },
  { value: 5, label: '5 revisions' },
  { value: 6, label: '6+ revisions' },
];

// Form state
const isSubmitting = ref(false);
const submissionSuccess = ref(false);
const errorMessage = ref('');

// Form validation
const isFormValid = computed(() => {
  const basicFieldsValid =
    formData.value.employeeNumber.trim() !== '' &&
    formData.value.contactEmail.trim() !== '' &&
    formData.value.tripNumber.trim() !== '' &&
    formData.value.numberOfRevisions > 0 &&
    formData.value.wasExtended !== null;

  // If extension was selected, require extension information
  if (formData.value.wasExtended === true) {
    return basicFieldsValid && formData.value.extensionInformation.trim() !== '';
  }

  return basicFieldsValid;
});

// Handle file upload
function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      errorMessage.value = 'Please upload a valid image file (PNG, JPG, or JPEG).';
      target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      errorMessage.value = 'File size must be less than 5MB.';
      target.value = '';
      return;
    }

    formData.value.screenshot = file;
    errorMessage.value = '';
  }
}

// Remove screenshot
function removeScreenshot() {
  formData.value.screenshot = null;
  const fileInput = document.getElementById('screenshot') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
}

// Handle form submission
async function handleSubmit() {
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';
  queuedOffline.value = false;

  try {
    // Prepare submission data
    const submissionData = {
      employee_number: formData.value.employeeNumber,
      contact_email: formData.value.contactEmail,
      trip_number: formData.value.tripNumber,
      number_of_revisions: formData.value.numberOfRevisions,
      was_extended: formData.value.wasExtended,
      extension_information: formData.value.wasExtended ? formData.value.extensionInformation : null,
      submitted_at: new Date().toISOString(),
    };

    // Check if offline - queue submission
    if (!isOnline.value) {
      await queueSubmission(submissionData, formData.value.screenshot || undefined);
      queuedOffline.value = true;
      submissionSuccess.value = true;

      // Reset form after queuing
      setTimeout(() => {
        resetForm();
      }, 3000);

      return;
    }

    // Online - submit directly
    const { supabase } = useSupabase();
    let screenshotUrl = null;

    // If there's a screenshot, upload it to Supabase Storage first
    if (formData.value.screenshot) {
      const timestamp = Date.now();
      const sanitizedFileName = formData.value.screenshot.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}-${sanitizedFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('extension-screenshot')
        .upload(fileName, formData.value.screenshot, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Screenshot upload error:', uploadError);
        throw new Error('Failed to upload screenshot');
      }

      screenshotUrl = uploadData.path;
    }

    // Insert data into Supabase
    const { data, error } = await supabase
      .from('extension_submissions')
      .insert([{
        ...submissionData,
        screenshot_url: screenshotUrl,
      }]);

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    console.log('Extension submitted successfully:', data);

    submissionSuccess.value = true;

    // Reset form after successful submission
    setTimeout(() => {
      resetForm();
    }, 5000);

  } catch (error: any) {
    console.error('Submission error:', error);
    errorMessage.value = error.message || 'An error occurred while submitting the form. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}

// Reset form helper
function resetForm() {
  formData.value = {
    employeeNumber: '',
    contactEmail: '',
    tripNumber: '',
    numberOfRevisions: 1,
    wasExtended: null,
    extensionInformation: '',
    screenshot: null,
  };
  submissionSuccess.value = false;
  queuedOffline.value = false;

  // Reset file input
  const fileInput = document.getElementById('screenshot') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
}

// Handle online event
function handleOnline() {
  isOnline.value = true;
  console.log('Back online - syncing queued submissions...');
  // Sync queued submissions
  syncAllPending().then((result) => {
    if (result.success > 0) {
      console.log(`Successfully synced ${result.success} submission(s)`);
    }
    if (result.failed > 0) {
      console.warn(`Failed to sync ${result.failed} submission(s)`);
    }
  });
}

// Handle offline event
function handleOffline() {
  isOnline.value = false;
  console.log('Gone offline');
}

// Setup online/offline listeners
onMounted(() => {
  if (process.client) {
    isOnline.value = navigator.onLine;
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }
});
</script>

<style scoped>
/* Additional styles if needed */
</style>
