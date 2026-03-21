<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { toast } from 'svelte-sonner';
  import type { EmployeeProfile, WorkSchedule } from '$lib/types';

  let employees: EmployeeProfile[] = [];
  let workSchedules: WorkSchedule[] = [];
  let loading = true;
  let showModal = false;

  // Form fields
  let formName = '';
  let formEmail = '';
  let formPassword = '';
  let formPosition = '';
  let formDepartment = '';
  let formRegistration = '';
  let formWorkScheduleId = '';
  let formLoading = false;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    try {
      [employees, workSchedules] = await Promise.all([
        api.getEmployees(),
        api.getWorkSchedules(),
      ]);
    } catch {
      toast.error('Erro ao carregar colaboradores');
    } finally {
      loading = false;
    }
  }

  async function handleAddEmployee() {
    formLoading = true;
    try {
      // First create user
      const user = await api.createUser({
        name: formName,
        email: formEmail,
        password: formPassword,
        role: 'EMPLOYEE',
      });

      // Then create employee profile
      await api.createEmployee({
        userId: user.id,
        registration: formRegistration || undefined,
        position: formPosition || undefined,
        department: formDepartment || undefined,
        workScheduleId: formWorkScheduleId || undefined,
      });

      toast.success('Colaborador adicionado com sucesso!');
      showModal = false;
      resetForm();
      await loadData();
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      toast.error(msg || 'Erro ao adicionar colaborador');
    } finally {
      formLoading = false;
    }
  }

  function resetForm() {
    formName = formEmail = formPassword = formPosition = formDepartment = formRegistration = formWorkScheduleId = '';
  }
</script>

<svelte:head>
  <title>Colaboradores - Controle de Ponto</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-gray-900">Colaboradores</h1>
    <button on:click={() => (showModal = true)} class="btn-primary">
      + Adicionar
    </button>
  </div>

  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else if employees.length === 0}
    <div class="card p-12 text-center">
      <p class="text-4xl mb-3">👥</p>
      <p class="text-gray-500 mb-4">Nenhum colaborador cadastrado</p>
      <button on:click={() => (showModal = true)} class="btn-primary">
        Adicionar primeiro colaborador
      </button>
    </div>
  {:else}
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cargo</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Depto.</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Matrícula</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {#each employees as emp}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div>
                    <p class="font-medium text-gray-900">{emp.user?.name}</p>
                    <p class="text-xs text-gray-400">{emp.user?.email}</p>
                  </div>
                </td>
                <td class="px-6 py-4 text-gray-600">{emp.position || '—'}</td>
                <td class="px-6 py-4 text-gray-600">{emp.department || '—'}</td>
                <td class="px-6 py-4 text-gray-600">{emp.registration || '—'}</td>
                <td class="px-6 py-4">
                  <span class="badge {emp.user?.active ? 'badge-success' : 'badge-danger'}">
                    {emp.user?.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <a
                    href="/admin/employees/facial?userId={emp.userId}"
                    class="text-sm text-primary-600 hover:text-primary-800 font-medium"
                  >
                    Cadastrar face
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- Modal -->
{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="card w-full max-w-lg p-6 max-h-screen overflow-y-auto">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-semibold text-gray-900">Novo Colaborador</h2>
        <button on:click={() => { showModal = false; resetForm(); }} class="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <form on:submit|preventDefault={handleAddEmployee} class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input type="text" bind:value={formName} required class="input" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
            <input type="email" bind:value={formEmail} required class="input" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Senha inicial *</label>
            <input type="password" bind:value={formPassword} required minlength="6" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
            <input type="text" bind:value={formRegistration} class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
            <input type="text" bind:value={formPosition} class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
            <input type="text" bind:value={formDepartment} class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Jornada</label>
            <select bind:value={formWorkScheduleId} class="input">
              <option value="">— Selecionar —</option>
              {#each workSchedules as ws}
                <option value={ws.id}>{ws.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" on:click={() => { showModal = false; resetForm(); }} class="btn-secondary flex-1">
            Cancelar
          </button>
          <button type="submit" disabled={formLoading} class="btn-primary flex-1">
            {formLoading ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
