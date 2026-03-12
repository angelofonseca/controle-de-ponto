<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { currentUser } from '$lib/stores/auth';
  import { formatTime, getTimeRecordLabel, formatDate } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import type { TimeRecord, AttendanceDay, TimeRecordType } from '$lib/types';

  let todayRecords: TimeRecord[] = [];
  let todayAttendance: AttendanceDay | null = null;
  let loading = true;
  let clockingIn = false;

  const today = new Date().toISOString().split('T')[0];

  const timeRecordSequence: TimeRecordType[] = ['CLOCK_IN', 'BREAK_START', 'BREAK_END', 'CLOCK_OUT'];

  $: lastRecord = todayRecords[0] ?? null;
  $: lastType = lastRecord?.type as TimeRecordType | null;
  $: lastTypeIndex = lastType ? timeRecordSequence.indexOf(lastType) : -1;
  $: nextType = lastTypeIndex < timeRecordSequence.length - 1
    ? timeRecordSequence[lastTypeIndex + 1]
    : null;
  $: dayCompleted = lastType === 'CLOCK_OUT';

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    try {
      const [records, attendance] = await Promise.all([
        api.getMyRecords({ startDate: today, endDate: today }),
        api.getMyAttendance({ startDate: today, endDate: today }),
      ]);
      todayRecords = records.sort((a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      );
      todayAttendance = attendance[0] ?? null;
    } catch (err: any) {
      toast.error('Erro ao carregar dados');
    } finally {
      loading = false;
    }
  }

  async function registerPoint() {
    if (!nextType) return;
    clockingIn = true;
    try {
      await api.createManualRecord({ type: nextType });
      toast.success(`${getTimeRecordLabel(nextType)} registrado!`);
      await loadData();
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      toast.error(msg || 'Erro ao registrar ponto');
    } finally {
      clockingIn = false;
    }
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      ON_TIME: 'text-green-600',
      LATE: 'text-yellow-600',
      ABSENT: 'text-red-600',
      IN_PROGRESS: 'text-blue-600',
      COMPLETED: 'text-green-600',
    };
    return map[status] || 'text-gray-600';
  }
</script>

<svelte:head>
  <title>Dashboard - Controle de Ponto</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Olá, {$currentUser?.name?.split(' ')[0]} 👋</h1>
    <p class="text-gray-500">{formatDate(new Date())}</p>
  </div>

  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else}
    <!-- Status Card -->
    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Status de Hoje</h2>
        {#if todayAttendance}
          <span class="badge {todayAttendance.status === 'COMPLETED' ? 'badge-success' :
            todayAttendance.status === 'LATE' ? 'badge-warning' :
            todayAttendance.status === 'IN_PROGRESS' ? 'badge-info' : 'badge-gray'}">
            {todayAttendance.status === 'COMPLETED' ? 'Concluído' :
             todayAttendance.status === 'LATE' ? 'Atrasado' :
             todayAttendance.status === 'IN_PROGRESS' ? 'Em andamento' : todayAttendance.status}
          </span>
        {:else}
          <span class="badge badge-gray">Sem registro</span>
        {/if}
      </div>

      {#if !dayCompleted}
        <!-- Clock-in button -->
        <div class="text-center py-4">
          {#if nextType}
            <p class="text-gray-500 mb-4 text-sm">
              {lastType ? `Último registro: ${getTimeRecordLabel(lastType)}` : 'Nenhum registro hoje'}
            </p>
            <button
              on:click={registerPoint}
              disabled={clockingIn}
              class="btn-primary px-8 py-4 text-lg font-semibold rounded-2xl"
            >
              {#if clockingIn}
                Registrando...
              {:else}
                {getTimeRecordLabel(nextType)}
              {/if}
            </button>
          {:else if !lastType}
            <p class="text-gray-400 text-sm">Dia ainda não iniciado</p>
          {/if}
        </div>
      {:else}
        <div class="text-center py-4">
          <div class="text-green-500 text-4xl mb-2">✅</div>
          <p class="text-green-700 font-medium">Expediente encerrado</p>
          <p class="text-gray-500 text-sm mt-1">Bom descanso!</p>
        </div>
      {/if}
    </div>

    <!-- Today's records -->
    {#if todayRecords.length > 0}
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Registros de Hoje</h2>
        <div class="space-y-3">
          {#each todayRecords as record}
            <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                  <span class="text-sm">
                    {record.type === 'CLOCK_IN' ? '🟢' :
                     record.type === 'BREAK_START' ? '🟡' :
                     record.type === 'BREAK_END' ? '🔵' : '🔴'}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{getTimeRecordLabel(record.type)}</p>
                  <p class="text-xs text-gray-400">{record.method === 'QR_CODE' ? 'QR Code' : 'Manual'}</p>
                </div>
              </div>
              <span class="text-sm font-medium text-gray-700">{formatTime(record.recordedAt)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Quick actions -->
    <div class="grid grid-cols-2 gap-4">
      <a href="/dashboard/history" class="card p-4 flex items-center space-x-3 hover:border-primary-200 transition-colors">
        <span class="text-2xl">📋</span>
        <div>
          <p class="font-medium text-gray-900 text-sm">Histórico</p>
          <p class="text-xs text-gray-500">Ver todos os registros</p>
        </div>
      </a>
      <a href="/dashboard/qrcode" class="card p-4 flex items-center space-x-3 hover:border-primary-200 transition-colors">
        <span class="text-2xl">📷</span>
        <div>
          <p class="font-medium text-gray-900 text-sm">QR Code</p>
          <p class="text-xs text-gray-500">Ler QR code</p>
        </div>
      </a>
    </div>
  {/if}
</div>
