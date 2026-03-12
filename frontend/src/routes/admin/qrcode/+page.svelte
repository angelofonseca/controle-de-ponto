<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { toast } from 'svelte-sonner';
  import type { QrCodeSession, TimeRecordType } from '$lib/types';

  let currentSession: QrCodeSession | null = null;
  let history: QrCodeSession[] = [];
  let loading = true;
  let generating = false;
  let selectedType: TimeRecordType = 'CLOCK_IN';
  let expirationMinutes = 10;

  const recordTypes: { value: TimeRecordType; label: string }[] = [
    { value: 'CLOCK_IN', label: '🟢 Entrada' },
    { value: 'BREAK_START', label: '🟡 Início Intervalo' },
    { value: 'BREAK_END', label: '🔵 Fim Intervalo' },
    { value: 'CLOCK_OUT', label: '🔴 Saída' },
  ];

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    try {
      [currentSession, history] = await Promise.all([
        api.getCurrentQrCodeSession().catch(() => null),
        api.getQrCodeHistory().catch(() => []),
      ]);
    } catch {
      // ignore
    } finally {
      loading = false;
    }
  }

  async function generateQrCode() {
    generating = true;
    try {
      const session = await api.createQrCodeSession({
        allowedType: selectedType,
        expirationMinutes,
      });
      currentSession = session;
      toast.success('QR Code gerado!');
      await loadData();
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      toast.error(msg || 'Erro ao gerar QR code');
    } finally {
      generating = false;
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString('pt-BR');
  }

  function isExpired(expiresAt: string) {
    return new Date(expiresAt) < new Date();
  }
</script>

<svelte:head>
  <title>QR Code Admin - Controle de Ponto</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-gray-900">Gerenciar QR Code</h1>

  <div class="grid md:grid-cols-2 gap-6">
    <!-- Generator -->
    <div class="card p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Gerar QR Code</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de registro</label>
          <div class="grid grid-cols-2 gap-2">
            {#each recordTypes as type}
              <button
                on:click={() => (selectedType = type.value)}
                class="py-2 px-3 rounded-lg border text-sm font-medium transition-colors
                  {selectedType === type.value
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'}"
              >
                {type.label}
              </button>
            {/each}
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Expiração: {expirationMinutes} minutos
          </label>
          <input
            type="range"
            bind:value={expirationMinutes}
            min="1"
            max="60"
            class="w-full"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>1 min</span>
            <span>60 min</span>
          </div>
        </div>

        <button
          on:click={generateQrCode}
          disabled={generating}
          class="btn-primary w-full py-3"
        >
          {generating ? 'Gerando...' : '🔲 Gerar QR Code'}
        </button>
      </div>
    </div>

    <!-- Current QR Code -->
    <div class="card p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">QR Code Ativo</h2>
      {#if loading}
        <div class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      {:else if currentSession?.active && currentSession.qrCodeImage}
        <div class="text-center">
          <img src={currentSession.qrCodeImage} alt="QR Code" class="mx-auto rounded-lg border border-gray-100 mb-3" />
          <span class="badge badge-success mb-2">
            {recordTypes.find(t => t.value === currentSession?.allowedType)?.label || currentSession.allowedType}
          </span>
          <p class="text-xs text-gray-500">
            Expira em: {formatDate(currentSession.expiresAt)}
          </p>
          <p class="text-xs text-gray-400 mt-1 font-mono break-all">{currentSession.token}</p>
        </div>
      {:else}
        <div class="text-center py-8 text-gray-400">
          <p class="text-4xl mb-2">🔲</p>
          <p class="text-sm">Nenhum QR code ativo</p>
          <p class="text-xs mt-1">Gere um novo QR code ao lado</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- History -->
  {#if history.length > 0}
    <div class="card overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100">
        <h2 class="font-semibold text-gray-900">Histórico de QR Codes</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Criado em</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Expira em</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {#each history as session}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-3 text-gray-600">
                  {recordTypes.find(t => t.value === session.allowedType)?.label || session.allowedType}
                </td>
                <td class="px-6 py-3 text-gray-600">{formatDate(session.createdAt || '')}</td>
                <td class="px-6 py-3 text-gray-600">{formatDate(session.expiresAt)}</td>
                <td class="px-6 py-3">
                  {#if session.used}
                    <span class="badge badge-success">Utilizado</span>
                  {:else if isExpired(session.expiresAt)}
                    <span class="badge badge-danger">Expirado</span>
                  {:else}
                    <span class="badge badge-info">Ativo</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
