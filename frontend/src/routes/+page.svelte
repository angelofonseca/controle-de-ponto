<script lang="ts">
  import { goto } from '$app/navigation';
  import { isAuthenticated, isAdmin } from '$lib/stores/auth';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';

  onMount(() => {
    const unsubscribe = isAuthenticated.subscribe((authenticated) => {
      if (authenticated) {
        if (get(isAdmin)) {
          goto('/admin/dashboard');
        } else {
          goto('/dashboard');
        }
      }
    });
    return unsubscribe;
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
  <div class="text-center text-white">
    <div class="mb-8">
      <h1 class="text-4xl font-bold mb-2">⏰ Controle de Ponto</h1>
      <p class="text-primary-200 text-lg">Sistema de gestão de jornada de trabalho</p>
    </div>
    <div class="space-y-4">
      <a href="/login" class="block w-64 mx-auto btn bg-white text-primary-700 hover:bg-primary-50 font-semibold py-3 text-base">
        Entrar no Sistema
      </a>
      <a href="/register" class="block w-64 mx-auto btn border-2 border-white text-white hover:bg-primary-700 font-semibold py-3 text-base">
        Cadastrar Empresa
      </a>
    </div>
  </div>
</div>

