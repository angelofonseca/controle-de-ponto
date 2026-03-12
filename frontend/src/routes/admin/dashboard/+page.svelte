<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { toast } from 'svelte-sonner';
  import type { DashboardSummary, AttendanceDay } from '$lib/types';

  let summary: DashboardSummary | null = null;
  let recentAttendance: AttendanceDay[] = [];
  let loading = true;

  const today = new Date().toISOString().split('T')[0];

  onMount(async () => {
    try {
      const [dashboardData, attendanceData] = await Promise.all([
        api.getDashboard(),
        api.getCompanyAttendance({ startDate: today, endDate: today }),
      ]);
      summary = dashboardData;
      recentAttendance = attendanceData;
    } catch (err: any) {
      toast.error('Erro ao carregar dashboard');
    } finally {
      loading = false;
    }
  });

  function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      ON_TIME: 'badge-success',
      LATE: 'badge-warning',
      ABSENT: 'badge-danger',
      IN_PROGRESS: 'badge-info',
      COMPLETED: 'badge-success',
    };
    return map[status] || 'badge-gray';
  }

  function getStatusLabel(status: string) {
    const map: Record<string, string> = {
      ON_TIME: 'No Horário',
      LATE: 'Atrasado',
      ABSENT: 'Falta',
      IN_PROGRESS: 'Em andamento',
      COMPLETED: 'Concluído',
      INCONSISTENT: 'Inconsistente',
    };
    return map[status] || status;
  }
</script>

<svelte:head>
  <title>Dashboard Admin - Controle de Ponto</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
    <p class="text-gray-500 text-sm">{formatDate(new Date())} - Visão geral de hoje</p>
  </div>

  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else if summary}
    <!-- KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-5">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm text-gray-500">Total</p>
          <span class="text-xl">👥</span>
        </div>
        <p class="text-3xl font-bold text-gray-900">{summary.totalEmployees}</p>
        <p class="text-xs text-gray-400 mt-1">Colaboradores</p>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm text-gray-500">Presentes</p>
          <span class="text-xl">✅</span>
        </div>
        <p class="text-3xl font-bold text-green-600">{summary.presentToday}</p>
        <p class="text-xs text-gray-400 mt-1">Registraram hoje</p>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm text-gray-500">Atrasos</p>
          <span class="text-xl">⚠️</span>
        </div>
        <p class="text-3xl font-bold text-yellow-600">{summary.lateToday}</p>
        <p class="text-xs text-gray-400 mt-1">Chegaram atrasados</p>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm text-gray-500">Faltas</p>
          <span class="text-xl">❌</span>
        </div>
        <p class="text-3xl font-bold text-red-600">{summary.absentToday}</p>
        <p class="text-xs text-gray-400 mt-1">Marcados ausentes</p>
      </div>
    </div>

    <!-- Attendance today -->
    {#if recentAttendance.length > 0}
      <div class="card overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">Frequência de Hoje</h2>
          <a href="/admin/reports" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Ver relatório →
          </a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Colaborador</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Horas</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Atraso</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              {#each recentAttendance as day}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 font-medium text-gray-900">{day.user?.name}</td>
                  <td class="px-6 py-4">
                    <span class="badge {getStatusBadge(day.status)}">{getStatusLabel(day.status)}</span>
                  </td>
                  <td class="px-6 py-4 text-gray-600">
                    {day.totalMinutes != null
                      ? `${Math.floor(day.totalMinutes / 60)}h${String(day.totalMinutes % 60).padStart(2, '0')}min`
                      : '--'}
                  </td>
                  <td class="px-6 py-4 text-gray-600">
                    {day.lateMinutes > 0 ? `${day.lateMinutes}min` : '—'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else}
      <div class="card p-8 text-center text-gray-500">
        <p class="text-3xl mb-2">📋</p>
        <p>Nenhum registro de frequência hoje</p>
      </div>
    {/if}

    <!-- Quick actions -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <a href="/admin/employees" class="card p-4 text-center hover:border-primary-200 transition-colors">
        <span class="text-2xl">👥</span>
        <p class="text-sm font-medium text-gray-900 mt-2">Colaboradores</p>
      </a>
      <a href="/admin/reports" class="card p-4 text-center hover:border-primary-200 transition-colors">
        <span class="text-2xl">📈</span>
        <p class="text-sm font-medium text-gray-900 mt-2">Relatórios</p>
      </a>
      <a href="/admin/qrcode" class="card p-4 text-center hover:border-primary-200 transition-colors">
        <span class="text-2xl">🔲</span>
        <p class="text-sm font-medium text-gray-900 mt-2">QR Code</p>
      </a>
    </div>
  {/if}
</div>
