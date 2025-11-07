import { ref } from 'vue';

interface QueuedSubmission {
  id: string;
  timestamp: number;
  formData: {
    employee_number: string;
    contact_email: string;
    trip_number: string;
    number_of_revisions: number;
    was_extended: boolean;
    extension_information: string | null;
    submitted_at: string;
  };
  screenshot?: {
    name: string;
    type: string;
    data: ArrayBuffer;
  };
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  lastError?: string;
}

const DB_NAME = 'ExtensionFormOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'submissions';

export const useOfflineQueue = () => {
  const pendingCount = ref(0);
  const isSyncing = ref(false);

  // Initialize IndexedDB
  const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  };

  // Add submission to queue
  const queueSubmission = async (
    formData: QueuedSubmission['formData'],
    screenshot?: File,
  ): Promise<string> => {
    const db = await initDB();
    const id = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let screenshotData: QueuedSubmission['screenshot'] | undefined;

    if (screenshot) {
      const arrayBuffer = await screenshot.arrayBuffer();
      screenshotData = {
        name: screenshot.name,
        type: screenshot.type,
        data: arrayBuffer,
      };
    }

    const submission: QueuedSubmission = {
      id,
      timestamp: Date.now(),
      formData,
      screenshot: screenshotData,
      status: 'pending',
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(submission);

      request.onsuccess = () => {
        updatePendingCount();
        resolve(id);
      };
      request.onerror = () => reject(request.error);
    });
  };

  // Get all pending submissions
  const getPendingSubmissions = async (): Promise<QueuedSubmission[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  // Update submission status
  const updateSubmissionStatus = async (
    id: string,
    status: QueuedSubmission['status'],
    error?: string,
  ): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const submission = getRequest.result as QueuedSubmission;
        if (submission) {
          submission.status = status;
          if (error) {
            submission.lastError = error;
            submission.retryCount += 1;
          }
          const updateRequest = store.put(submission);
          updateRequest.onsuccess = () => {
            updatePendingCount();
            resolve();
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Submission not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  };

  // Delete submission from queue
  const deleteSubmission = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        updatePendingCount();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  };

  // Update pending count
  const updatePendingCount = async (): Promise<void> => {
    try {
      const pending = await getPendingSubmissions();
      pendingCount.value = pending.length;
    } catch (error) {
      console.error('Error updating pending count:', error);
    }
  };

  // Sync a single submission
  const syncSubmission = async (submission: QueuedSubmission): Promise<void> => {
    const { supabase } = useSupabase();

    try {
      await updateSubmissionStatus(submission.id, 'syncing');

      let screenshotUrl = null;

      // Upload screenshot if exists
      if (submission.screenshot) {
        const timestamp = Date.now();
        const sanitizedFileName = submission.screenshot.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}-${sanitizedFileName}`;

        // Convert ArrayBuffer back to Blob
        const blob = new Blob([submission.screenshot.data], { type: submission.screenshot.type });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('extension-screenshot')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Screenshot upload failed: ${uploadError.message}`);
        }

        screenshotUrl = uploadData.path;
      }

      // Insert into database
      const { error: dbError } = await supabase
        .from('extension_submissions')
        .insert([{
          ...submission.formData,
          screenshot_url: screenshotUrl,
        }]);

      if (dbError) {
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      // Successfully synced, remove from queue
      await deleteSubmission(submission.id);
    } catch (error: any) {
      console.error('Sync error:', error);
      // Mark as failed but keep in queue for retry
      await updateSubmissionStatus(submission.id, 'failed', error.message);
      throw error;
    }
  };

  // Sync all pending submissions
  const syncAllPending = async (): Promise<{ success: number; failed: number }> => {
    if (isSyncing.value) {
      return { success: 0, failed: 0 };
    }

    isSyncing.value = true;
    let success = 0;
    let failed = 0;

    try {
      const pending = await getPendingSubmissions();

      for (const submission of pending) {
        // Skip if already tried too many times
        if (submission.retryCount >= 3) {
          continue;
        }

        try {
          await syncSubmission(submission);
          success += 1;
        } catch (error) {
          failed += 1;
        }
      }
    } finally {
      isSyncing.value = false;
      await updatePendingCount();
    }

    return { success, failed };
  };

  // Clear all failed submissions
  const clearFailedSubmissions = async (): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.openCursor('failed');

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          updatePendingCount();
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  };

  // Initialize pending count on load
  if (process.client) {
    updatePendingCount();
  }

  return {
    pendingCount,
    isSyncing,
    queueSubmission,
    getPendingSubmissions,
    syncAllPending,
    syncSubmission,
    deleteSubmission,
    clearFailedSubmissions,
    updatePendingCount,
  };
};
