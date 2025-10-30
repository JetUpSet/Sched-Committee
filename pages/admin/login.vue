<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Admin Login</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Sign in to view extension submissions
        </p>
      </div>

      <UCard>
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Email
            </label>
            <UInput
              v-model="email"
              id="email"
              type="email"
              placeholder="admin@example.com"
              required
              class="w-full"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Password
            </label>
            <UInput
              v-model="password"
              id="password"
              type="password"
              placeholder="Enter your password"
              required
              class="w-full"
            />
          </div>

          <UAlert
            v-if="errorMessage"
            color="red"
            variant="soft"
            title="Login Failed"
            :description="errorMessage"
            :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'red', variant: 'link' }"
            @close="errorMessage = ''"
          />

          <UButton
            type="submit"
            color="red"
            block
            :loading="isLoading"
          >
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </UButton>
        </form>
      </UCard>

      <div class="mt-6 text-center">
        <NuxtLink to="/" class="text-sm text-red-600 dark:text-red-400 hover:underline">
          ← Back to Home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Admin Login',
  layout: false, // Use no layout for login page
});

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const { supabase } = useSupabase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      // Successful login, redirect to dashboard
      navigateTo('/admin/dashboard');
    }
  } catch (error: any) {
    console.error('Login error:', error);
    errorMessage.value = error.message || 'Invalid email or password. Please try again.';
  } finally {
    isLoading.value = false;
  }
}
</script>
