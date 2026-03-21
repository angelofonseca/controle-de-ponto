<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore, isAuthenticated, currentUser } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  onMount(() => {
    authStore.loadFromStorage();
    const unsubscribe = isAuthenticated.subscribe((authenticated) => {
      if (!authenticated) {
        goto('/login');
      }
    });
    return unsubscribe;
  });

  async function handleLogout() {
    try {
      const auth = $authStore;
      if (auth.refreshToken) {
        const { api } = await import('$lib/api');
        await api.logout(auth.refreshToken);
      }
    } catch {
      // ignore
    }
    authStore.clearAuth();
    goto('/login');
  }
</script>

{#if $isAuthenticated}
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <nav class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="text-xl">⏰</span>
            <span class="font-bold text-gray-900">Controle de Ponto</span>
          </div>

          <div class="flex items-center space-x-4">
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">{$currentUser?.name}</p>
              <p class="text-xs text-gray-500">Colaborador</p>
            </div>
            <button
              on:click={handleLogout}
              class="btn-secondary text-sm"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <slot />
    </main>
  </div>
{/if}
