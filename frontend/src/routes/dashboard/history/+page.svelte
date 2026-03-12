<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { formatDate, formatTime, getTimeRecordLabel } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import type { TimeRecord } from '$lib/types';

  let records: TimeRecord[] = [];
  let loading = true;
  let startDate = '';
  let endDate = '';

  // Default to current month
  const now = new Date();
  startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  onMount(() => {
    loadRecords();
  });

  async function loadRecords() {
    loading = true;
    try {
      records = await api.getMyRecords({ startDate, endDate });
      records = records.sort((a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      );
    } catch {
      toast.error('Erro ao carregar histórico');
    } finally {
      loading = false;
    }
  }

  // Group by date
  $: grouped = records.reduce((acc: Record<string, TimeRecord[]>, record) => {
    const date = record.recordedAt.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {});

  $: groupedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
</script>

<svelte:head>
  <title>Histórico - Controle de Ponto</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-gray-900">Histórico de Ponto</h1>
    <span class="text-gray-500 text-sm">{records.length} registros</span>
  </div>

  <!-- Filters -->
  <div class="card p-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Data inicial</label>
        <input type="date" bind:value={startDate} class="input text-sm" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Data final</label>
        <input type="date" bind:value={endDate} class="input text-sm" />
      </div>
    </div>
    <button on:click={loadRecords} class="btn-primary mt-3 w-full">Filtrar</button>
  </div>

  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else if records.length === 0}
    <div class="text-center py-12 text-gray-500">
      <p class="text-4xl mb-3">📭</p>
      <p>Nenhum registro encontrado</p>
    </div>
  {:else}
    {#each groupedDates as date}
      <div class="card overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h3 class="font-medium text-gray-700 text-sm">{formatDate(date)}</h3>
        </div>
        <div class="divide-y divide-gray-50">
          {#each grouped[date].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()) as record}
            <div class="flex items-center justify-between px-4 py-3">
              <div class="flex items-center space-x-3">
                <span>
                  {record.type === 'CLOCK_IN' ? '🟢' :
                   record.type === 'BREAK_START' ? '🟡' :
                   record.type === 'BREAK_END' ? '🔵' : '🔴'}
                </span>
                <div>
                  <p class="text-sm font-medium text-gray-900">{getTimeRecordLabel(record.type)}</p>
                  <p class="text-xs text-gray-400">{record.method === 'QR_CODE' ? 'QR Code' : 'Manual'}</p>
                </div>
              </div>
              <span class="text-sm text-gray-700">{formatTime(record.recordedAt)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</div>
