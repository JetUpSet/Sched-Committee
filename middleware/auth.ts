export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip auth check on client-side navigation (Supabase client will handle)
  if (process.client) {
    try {
      const { supabase } = useSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return navigateTo('/admin/login');
      }
    } catch (error) {
      return navigateTo('/admin/login');
    }
  }
});
