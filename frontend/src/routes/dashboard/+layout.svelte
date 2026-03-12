<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore, isAuthenticated, currentUser } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

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

  $: currentPath = $page.url.pathname;

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/dashboard/records', label: 'Meu Ponto', icon: '⏰' },
    { href: '/dashboard/history', label: 'Histórico', icon: '📋' },
    { href: '/dashboard/qrcode', label: 'QR Code', icon: '📷' },
  ];
</script>

{#if $isAuthenticated}
  <div class="min-h-screen flex flex-col">
    <!-- Navbar -->
    <nav class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center space-x-8">
            <a href="/dashboard" class="flex items-center space-x-2">
              <span class="text-xl">⏰</span>
              <span class="font-bold text-gray-900 hidden sm:block">Controle de Ponto</span>
            </a>
            <div class="hidden md:flex items-center space-x-1">
              {#each navLinks as link}
                <a
                  href={link.href}
                  class="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    {currentPath === link.href
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </a>
              {/each}
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <div class="hidden sm:block text-right">
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

    <!-- Mobile nav -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div class="flex">
        {#each navLinks as link}
          <a
            href={link.href}
            class="flex-1 flex flex-col items-center py-3 text-xs
              {currentPath === link.href ? 'text-primary-600' : 'text-gray-500'}"
          >
            <span class="text-lg">{link.icon}</span>
            <span>{link.label}</span>
          </a>
        {/each}
      </div>
    </div>

    <!-- Main content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <slot />
    </main>
  </div>
{/if}
