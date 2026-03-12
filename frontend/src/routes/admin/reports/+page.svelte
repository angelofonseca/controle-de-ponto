<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { toast } from 'svelte-sonner';
  import { formatDate, formatTime, getTimeRecordLabel, getAttendanceStatusLabel } from '$lib/utils';
  import type { TimeRecord, AttendanceDay, EmployeeProfile } from '$lib/types';

  let records: TimeRecord[] = [];
  let attendance: AttendanceDay[] = [];
  let employees: EmployeeProfile[] = [];
  let loading = false;
  let activeTab: 'records' | 'attendance' = 'attendance';

  const now = new Date();
  let startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  let selectedUserId = '';

  onMount(async () => {
    try {
      employees = await api.getEmployees();
    } catch {
      toast.error('Erro ao carregar colaboradores');
    }
    await loadData();
  });

  async function loadData() {
    loading = true;
    try {
      const params = {
        startDate,
        endDate,
        ...(selectedUserId ? { userId: selectedUserId } : {}),
      };
      [records, attendance] = await Promise.all([
        api.getCompanyRecords(params),
        api.getCompanyAttendance(params),
      ]);
    } catch {
      toast.error('Erro ao carregar relatórios');
    } finally {
      loading = false;
    }
  }

  $: totalHours = attendance.reduce((sum, d) => sum + (d.totalMinutes || 0), 0);
  $: absentDays = attendance.filter(d => d.status === 'ABSENT').length;
  $: lateDays = attendance.filter(d => d.status === 'LATE').length;
</script>

<svelte:head>
  <title>Relatórios - Controle de Ponto</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-gray-900">Relatórios</h1>

  <!-- Filters -->
  <div class="card p-4">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Data inicial</label>
        <input type="date" bind:value={startDate} class="input text-sm" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Data final</label>
        <input type="date" bind:value={endDate} class="input text-sm" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Colaborador</label>
        <select bind:value={selectedUserId} class="input text-sm">
          <option value="">Todos</option>
          {#each employees as emp}
            <option value={emp.userId}>{emp.user?.name}</option>
          {/each}
        </select>
      </div>
      <div class="flex items-end">
        <button on:click={loadData} class="btn-primary w-full">Filtrar</button>
      </div>
    </div>
  </div>

  <!-- Summary cards -->
  <div class="grid grid-cols-3 gap-4">
    <div class="card p-4 text-center">
      <p class="text-2xl font-bold text-gray-900">{Math.floor(totalHours / 60)}h{String(totalHours % 60).padStart(2, '0')}min</p>
      <p class="text-xs text-gray-500 mt-1">Total de horas</p>
    </div>
    <div class="card p-4 text-center">
      <p class="text-2xl font-bold text-yellow-600">{lateDays}</p>
      <p class="text-xs text-gray-500 mt-1">Dias com atraso</p>
    </div>
    <div class="card p-4 text-center">
      <p class="text-2xl font-bold text-red-600">{absentDays}</p>
      <p class="text-xs text-gray-500 mt-1">Faltas</p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200">
    <div class="flex space-x-8">
      <button
        on:click={() => (activeTab = 'attendance')}
        class="pb-3 text-sm font-medium border-b-2 transition-colors
          {activeTab === 'attendance' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
      >
        Frequência ({attendance.length})
      </button>
      <button
        on:click={() => (activeTab = 'records')}
        class="pb-3 text-sm font-medium border-b-2 transition-colors
          {activeTab === 'records' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
      >
        Registros ({records.length})
      </button>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else if activeTab === 'attendance'}
    {#if attendance.length === 0}
      <div class="text-center py-12 text-gray-500">Nenhum dado encontrado</div>
    {:else}
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Colaborador</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Horas</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Atraso</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {#each attendance as day}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-3 text-gray-600">{formatDate(day.date)}</td>
                <td class="px-6 py-3 font-medium text-gray-900">{day.user?.name}</td>
                <td class="px-6 py-3">
                  <span class="badge {day.status === 'COMPLETED' || day.status === 'ON_TIME' ? 'badge-success' :
                    day.status === 'LATE' ? 'badge-warning' : day.status === 'ABSENT' ? 'badge-danger' : 'badge-info'}">
                    {getAttendanceStatusLabel(day.status)}
                  </span>
                </td>
                <td class="px-6 py-3 text-gray-600">
                  {day.totalMinutes != null ? `${Math.floor(day.totalMinutes / 60)}h${String(day.totalMinutes % 60).padStart(2, '0')}min` : '—'}
                </td>
                <td class="px-6 py-3 text-gray-600">{day.lateMinutes > 0 ? `${day.lateMinutes}min` : '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {:else}
    {#if records.length === 0}
      <div class="text-center py-12 text-gray-500">Nenhum registro encontrado</div>
    {:else}
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Colaborador</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Método</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {#each records as record}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-3 text-gray-600">{formatDate(record.recordedAt)} {formatTime(record.recordedAt)}</td>
                <td class="px-6 py-3 font-medium text-gray-900">{record.user?.name}</td>
                <td class="px-6 py-3 text-gray-600">{getTimeRecordLabel(record.type)}</td>
                <td class="px-6 py-3">
                  <span class="badge {record.method === 'QR_CODE' ? 'badge-info' : 'badge-gray'}">
                    {record.method === 'QR_CODE' ? 'QR Code' : 'Manual'}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>
