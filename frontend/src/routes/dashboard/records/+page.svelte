<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { authStore } from '$lib/stores/auth';
  import { getTimeRecordLabel } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import type { TimeRecordType } from '$lib/types';
  import { onMount } from 'svelte';

  const timeRecordTypes: { type: TimeRecordType; label: string; icon: string; color: string }[] = [
    { type: 'CLOCK_IN', label: 'Entrada', icon: '🟢', color: 'border-green-400 bg-green-50 hover:bg-green-100 text-green-800' },
    { type: 'BREAK_START', label: 'Início do Intervalo', icon: '🟡', color: 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100 text-yellow-800' },
    { type: 'BREAK_END', label: 'Fim do Intervalo', icon: '🔵', color: 'border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-800' },
    { type: 'CLOCK_OUT', label: 'Saída', icon: '🔴', color: 'border-red-400 bg-red-50 hover:bg-red-100 text-red-800' },
  ];

  let loading: Record<string, boolean> = {};
  let notes = '';
  let success = '';

  async function register(type: TimeRecordType) {
    loading[type] = true;
    success = '';
    try {
      await api.createManualRecord({ type, notes: notes || undefined });
      success = `${getTimeRecordLabel(type)} registrado com sucesso!`;
      notes = '';
      toast.success(success);
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      toast.error(msg || `Erro ao registrar ${getTimeRecordLabel(type)}`);
    } finally {
      loading[type] = false;
    }
  }
</script>

<svelte:head>
  <title>Registrar Ponto - Controle de Ponto</title>
</svelte:head>

<div class="space-y-6 max-w-lg mx-auto">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Registrar Ponto</h1>
    <p class="text-gray-500 text-sm">Selecione o tipo de registro</p>
  </div>

  {#if success}
    <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm flex items-center space-x-2">
      <span>✅</span>
      <span>{success}</span>
    </div>
  {/if}

  <div class="grid grid-cols-2 gap-4">
    {#each timeRecordTypes as { type, label, icon, color }}
      <button
        on:click={() => register(type)}
        disabled={loading[type]}
        class="card p-5 text-center border-2 transition-all {color} disabled:opacity-50"
      >
        <span class="text-3xl block mb-2">{icon}</span>
        <span class="font-medium text-sm">{label}</span>
        {#if loading[type]}
          <div class="mt-2 text-xs">Registrando...</div>
        {/if}
      </button>
    {/each}
  </div>

  <div class="card p-4">
    <label class="block text-sm font-medium text-gray-700 mb-2">Observação (opcional)</label>
    <textarea
      bind:value={notes}
      rows="3"
      placeholder="Adicione uma observação ao registro..."
      class="input resize-none"
    ></textarea>
  </div>

  <div class="text-center">
    <a href="/dashboard/qrcode" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
      📷 Usar QR Code em vez disso
    </a>
  </div>
</div>
