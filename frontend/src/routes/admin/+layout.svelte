<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore, isAuthenticated, isAdmin, currentUser } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  onMount(() => {
    authStore.loadFromStorage();
    const unsubAuth = isAuthenticated.subscribe((authenticated) => {
      if (!authenticated) goto('/login');
    });
    const unsubAdmin = isAdmin.subscribe((admin) => {
      if ($isAuthenticated && !admin) goto('/dashboard');
    });
    return () => {
      unsubAuth();
      unsubAdmin();
    };
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
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/employees', label: 'Colaboradores', icon: '👥' },
    { href: '/admin/reports', label: 'Relatórios', icon: '📈' },
    { href: '/admin/qrcode', label: 'QR Code', icon: '🔲' },
  ];
</script>

{#if $isAuthenticated && $isAdmin}
  <div class="min-h-screen flex">
    <!-- Sidebar (desktop) -->
    <aside class="hidden md:flex w-64 flex-col fixed h-full bg-gray-900 text-white">
      <div class="px-6 py-5 border-b border-gray-700">
        <div class="flex items-center space-x-3">
          <span class="text-2xl">⏰</span>
          <div>
            <h1 class="font-bold text-sm">Controle de Ponto</h1>
            <p class="text-gray-400 text-xs">Administrador</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1">
        {#each navLinks as link}
          <a
            href={link.href}
            class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              {currentPath.startsWith(link.href)
                ? 'bg-primary-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'}"
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </a>
        {/each}
      </nav>

      <div class="px-3 py-4 border-t border-gray-700">
        <div class="px-3 mb-3">
          <p class="text-xs font-medium text-white truncate">{$currentUser?.name}</p>
          <p class="text-xs text-gray-400">Admin</p>
        </div>
        <button on:click={handleLogout} class="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <span>🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 md:ml-64 flex flex-col min-h-screen">
      <!-- Top bar (mobile) -->
      <div class="md:hidden bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-xl">⏰</span>
          <span class="font-bold text-sm">Controle de Ponto</span>
        </div>
        <button on:click={handleLogout} class="text-gray-400 text-sm">Sair</button>
      </div>

      <!-- Mobile nav -->
      <div class="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-white z-10">
        <div class="flex">
          {#each navLinks as link}
            <a
              href={link.href}
              class="flex-1 flex flex-col items-center py-3 text-xs
                {currentPath.startsWith(link.href) ? 'text-primary-400' : 'text-gray-400'}"
            >
              <span class="text-lg">{link.icon}</span>
              <span>{link.label}</span>
            </a>
          {/each}
        </div>
      </div>

      <main class="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        <slot />
      </main>
    </div>
  </div>
{/if}
