<template>
  <div class="bg-white dark:bg-gray-900 min-h-screen py-8">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Extension Submissions</h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Review and manage extension reports
          </p>
        </div>
        <div class="flex gap-3">
          <UButton
            color="green"
            variant="soft"
            icon="i-heroicons-arrow-down-tray"
            @click="exportToExcel"
            :disabled="submissions.length === 0"
          >
            Export to Excel
          </UButton>
          <UButton
            color="red"
            variant="soft"
            icon="i-heroicons-arrow-right-on-rectangle"
            @click="handleLogout"
          >
            Sign Out
          </UButton>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <Icon name="heroicons:arrow-path" class="h-8 w-8 animate-spin mx-auto text-gray-400" />
        <p class="mt-4 text-gray-600 dark:text-gray-400">Loading submissions...</p>
      </div>

      <!-- Error State -->
      <UAlert
        v-else-if="errorMessage"
        color="red"
        variant="soft"
        title="Error Loading Submissions"
        :description="errorMessage"
        class="mb-6"
      />

      <!-- Submissions List -->
      <div v-else-if="submissions.length > 0" class="space-y-6">
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ submissions.length }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Total Submissions</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ extendedCount }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Extended Trips</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ screenshotCount }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">With Screenshots</p>
            </div>
          </UCard>
        </div>

        <!-- Submissions Table -->
        <UCard>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trip #
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Employee
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Extended
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Revisions
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="submission in submissions" :key="submission.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {{ submission.trip_number }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {{ submission.employee_number }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <UBadge :color="submission.was_extended ? 'red' : 'gray'" variant="soft">
                      {{ submission.was_extended ? 'Yes' : 'No' }}
                    </UBadge>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {{ submission.number_of_revisions }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {{ formatDate(submission.submitted_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <UButton
                      size="xs"
                      color="blue"
                      variant="soft"
                      @click="viewSubmission(submission)"
                    >
                      View Details
                    </UButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <Icon name="heroicons:document-text" class="h-16 w-16 mx-auto text-gray-400" />
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No submissions yet</h3>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Extension submissions will appear here once pilots submit the form.
        </p>
      </div>
    </div>

    <!-- Detail Modal -->
    <UModal v-model="isModalOpen" :ui="{ width: 'max-w-3xl' }">
      <UCard v-if="selectedSubmission">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Trip #{{ selectedSubmission.trip_number }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="isModalOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Employee Info -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Contact Information</h4>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-medium">Employee #:</span> {{ selectedSubmission.employee_number }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-medium">Email:</span> {{ selectedSubmission.contact_email }}
              </p>
            </div>
          </div>

          <!-- Trip Info -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Trip Details</h4>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-medium">Number of Revisions:</span> {{ selectedSubmission.number_of_revisions }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-medium">Was Extended:</span>
                <UBadge :color="selectedSubmission.was_extended ? 'red' : 'gray'" variant="soft" class="ml-2">
                  {{ selectedSubmission.was_extended ? 'Yes' : 'No' }}
                </UBadge>
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-medium">Submitted:</span> {{ formatDate(selectedSubmission.submitted_at) }}
              </p>
            </div>
          </div>

          <!-- Extension Information -->
          <div v-if="selectedSubmission.was_extended && selectedSubmission.extension_information">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Extension Information</h4>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {{ selectedSubmission.extension_information }}
              </p>
            </div>
          </div>

          <!-- Screenshot -->
          <div v-if="selectedSubmission.screenshot_url">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Screenshot</h4>
            <div v-if="loadingScreenshot" class="text-center py-8">
              <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin mx-auto text-gray-400" />
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading screenshot...</p>
            </div>
            <div v-else-if="screenshotError" class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <p class="text-sm text-red-600 dark:text-red-400">{{ screenshotError }}</p>
            </div>
            <div v-else-if="screenshotUrl" class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <img :src="screenshotUrl" alt="Screenshot" class="w-full h-auto" />
            </div>
          </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns';

definePageMeta({
  title: 'Admin Dashboard',
  middleware: 'auth', // We'll create this middleware
});

interface Submission {
  id: string;
  employee_number: string;
  contact_email: string;
  trip_number: string;
  number_of_revisions: number;
  was_extended: boolean;
  extension_information: string | null;
  screenshot_url: string | null;
  submitted_at: string;
}

const submissions = ref<Submission[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');
const isModalOpen = ref(false);
const selectedSubmission = ref<Submission | null>(null);
const screenshotUrl = ref('');
const loadingScreenshot = ref(false);
const screenshotError = ref('');

// Computed stats
const extendedCount = computed(() => submissions.value.filter(s => s.was_extended).length);
const screenshotCount = computed(() => submissions.value.filter(s => s.screenshot_url).length);

// Load submissions on mount
onMounted(async () => {
  await checkAuth();
  await loadSubmissions();
});

// Check if user is authenticated
async function checkAuth() {
  try {
    const { supabase } = useSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigateTo('/admin/login');
    }
  } catch (error) {
    navigateTo('/admin/login');
  }
}

// Load all submissions
async function loadSubmissions() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const { supabase } = useSupabase();

    const { data, error } = await supabase
      .from('extension_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      throw error;
    }

    submissions.value = data || [];
  } catch (error: any) {
    console.error('Error loading submissions:', error);
    errorMessage.value = error.message || 'Failed to load submissions. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

// View submission details
async function viewSubmission(submission: Submission) {
  selectedSubmission.value = submission;
  screenshotUrl.value = '';
  screenshotError.value = '';
  isModalOpen.value = true;

  // Load screenshot if exists
  if (submission.screenshot_url) {
    await loadScreenshot(submission.screenshot_url);
  }
}

// Load screenshot with signed URL
async function loadScreenshot(path: string) {
  loadingScreenshot.value = true;
  screenshotError.value = '';

  try {
    const { supabase } = useSupabase();

    const { data, error } = await supabase.storage
      .from('extension-screenshot')
      .createSignedUrl(path, 3600); // 1 hour expiration

    if (error) {
      throw error;
    }

    if (data?.signedUrl) {
      screenshotUrl.value = data.signedUrl;
    }
  } catch (error: any) {
    console.error('Error loading screenshot:', error);
    screenshotError.value = 'Failed to load screenshot. Please try again.';
  } finally {
    loadingScreenshot.value = false;
  }
}

// Format date
function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  } catch {
    return dateString;
  }
}

// Logout
async function handleLogout() {
  try {
    const { supabase } = useSupabase();
    await supabase.auth.signOut();
    navigateTo('/admin/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Export to Excel
async function exportToExcel() {
  try {
    // Dynamically import xlsx library
    const XLSX = await import('xlsx');

    // Prepare data for export
    const exportData = submissions.value.map(submission => ({
      'Trip Number': submission.trip_number,
      'Employee Number': submission.employee_number,
      'Contact Email': submission.contact_email,
      'Number of Revisions': submission.number_of_revisions,
      'Was Extended': submission.was_extended ? 'Yes' : 'No',
      'Extension Information': submission.extension_information || 'N/A',
      'Has Screenshot': submission.screenshot_url ? 'Yes' : 'No',
      'Submitted At': formatDate(submission.submitted_at),
      'Submission ID': submission.id,
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extension Submissions');

    // Set column widths for better readability
    const columnWidths = [
      { wch: 12 }, // Trip Number
      { wch: 15 }, // Employee Number
      { wch: 25 }, // Contact Email
      { wch: 18 }, // Number of Revisions
      { wch: 12 }, // Was Extended
      { wch: 50 }, // Extension Information
      { wch: 15 }, // Has Screenshot
      { wch: 20 }, // Submitted At
      { wch: 38 }, // Submission ID
    ];
    worksheet['!cols'] = columnWidths;

    // Generate filename with timestamp
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = `extension_submissions_${timestamp}.xlsx`;

    // Write and download file
    XLSX.writeFile(workbook, filename);

    // Show success message (optional - you can add a toast notification here)
    console.log(`Exported ${submissions.value.length} submissions to ${filename}`);
  } catch (error: any) {
    console.error('Export error:', error);
    errorMessage.value = 'Failed to export data. Please try again.';
  }
}
</script>
