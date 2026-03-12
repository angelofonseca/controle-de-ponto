<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { authStore } from '$lib/stores/auth';
  import { toast } from 'svelte-sonner';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let loading = false;
  let error = '';

  onMount(() => {
    authStore.loadFromStorage();
    const unsubscribe = authStore.subscribe((state) => {
      if (state.user) {
        if (state.user.role === 'COMPANY_ADMIN') {
          goto('/admin/dashboard');
        } else {
          goto('/dashboard');
        }
      }
    });
    return unsubscribe;
  });

  async function handleSubmit() {
    error = '';
    loading = true;

    try {
      const response = await api.login(email, password);
      authStore.setAuth(response.user, response.accessToken, response.refreshToken);
      toast.success(`Bem-vindo, ${response.user.name}!`);

      if (response.user.role === 'COMPANY_ADMIN') {
        goto('/admin/dashboard');
      } else {
        goto('/dashboard');
      }
    } catch (err: any) {
      error = Array.isArray(err.message) ? err.message.join(', ') : err.message || 'Erro ao realizar login';
      toast.error(error);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Login - Controle de Ponto</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
  <div class="w-full max-w-md">
    <!-- Logo / Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
        <span class="text-3xl">⏰</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Controle de Ponto</h1>
      <p class="text-gray-500 mt-1">Acesse sua conta</p>
    </div>

    <!-- Card -->
    <div class="card p-8">
      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        {#if error}
          <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        {/if}

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="seu@email.com"
            required
            class="input"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="••••••••"
            required
            class="input"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="btn-primary w-full py-2.5"
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Entrando...
          {:else}
            Entrar
          {/if}
        </button>
      </form>
    </div>

    <p class="text-center mt-6 text-sm text-gray-500">
      Não tem uma conta?
      <a href="/register" class="text-primary-600 hover:text-primary-700 font-medium">
        Cadastre sua empresa
      </a>
    </p>
  </div>
</div>
