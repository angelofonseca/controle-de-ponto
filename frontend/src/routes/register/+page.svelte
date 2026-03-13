<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { authStore } from '$lib/stores/auth';
  import { toast } from 'svelte-sonner';

  let step = 1;
  let loading = false;
  let error = '';

  // Step 1: Company data
  let companyName = '';
  let companyCnpj = '';
  let companyEmail = '';
  let companyPhone = '';
  let companyAddress = '';

  // Step 2: Admin data
  let adminName = '';
  let adminEmail = '';
  let adminPassword = '';
  let adminPasswordConfirm = '';

  async function handleCompanyStep() {
    error = '';
    step = 2;
  }

  async function handleAdminStep() {
    error = '';

    if (adminPassword !== adminPasswordConfirm) {
      error = 'As senhas não coincidem';
      return;
    }

    if (adminPassword.length < 6) {
      error = 'A senha deve ter pelo menos 6 caracteres';
      return;
    }

    loading = true;

    try {
      const response = await api.registerCompanyAdmin({
        companyName,
        companyCnpj: companyCnpj || undefined,
        companyEmail,
        companyPhone: companyPhone || undefined,
        companyAddress: companyAddress || undefined,
        adminName,
        adminEmail,
        adminPassword,
      });

      authStore.setAuth(response.user, response.accessToken, response.refreshToken);
      toast.success('Conta criada com sucesso! Bem-vindo!');
      goto('/admin/dashboard');
    } catch (err: any) {
      error = Array.isArray(err.message) ? err.message.join(', ') : err.message || 'Erro ao criar administrador';
      toast.error(error);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Cadastro - Controle de Ponto</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
  <div class="w-full max-w-lg">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
        <span class="text-3xl">🏢</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Cadastrar Empresa</h1>
      <p class="text-gray-500 mt-1">
        {step === 1 ? 'Dados da empresa' : 'Dados do administrador'}
      </p>
    </div>

    <!-- Progress indicator -->
    <div class="flex items-center justify-center mb-8 space-x-4">
      <div class="flex items-center space-x-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
          {step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}">
          1
        </div>
        <span class="text-sm {step >= 1 ? 'text-primary-600 font-medium' : 'text-gray-400'}">Empresa</span>
      </div>
      <div class="h-px w-12 {step >= 2 ? 'bg-primary-400' : 'bg-gray-200'}"></div>
      <div class="flex items-center space-x-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
          {step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}">
          2
        </div>
        <span class="text-sm {step >= 2 ? 'text-primary-600 font-medium' : 'text-gray-400'}">Admin</span>
      </div>
    </div>

    <div class="card p-8">
      {#if error}
        <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-6">
          {error}
        </div>
      {/if}

      {#if step === 1}
        <form on:submit|preventDefault={handleCompanyStep} class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa *</label>
            <input type="text" bind:value={companyName} placeholder="Minha Empresa Ltda" required class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input type="text" bind:value={companyCnpj} placeholder="00.000.000/0001-00" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">E-mail da Empresa *</label>
            <input type="email" bind:value={companyEmail} placeholder="contato@empresa.com" required class="input" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input type="text" bind:value={companyPhone} placeholder="(11) 9999-9999" class="input" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input type="text" bind:value={companyAddress} placeholder="Rua Exemplo, 123 - SP" class="input" />
          </div>
          <button type="submit" disabled={loading} class="btn-primary w-full py-2.5">
            {loading ? 'Cadastrando...' : 'Próximo →'}
          </button>
        </form>
      {:else}
        <form on:submit|preventDefault={handleAdminStep} class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
            <input type="text" bind:value={adminName} placeholder="João da Silva" required class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
            <input type="email" bind:value={adminEmail} placeholder="admin@empresa.com" required class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
            <input type="password" bind:value={adminPassword} placeholder="Mín. 6 caracteres" required minlength="6" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha *</label>
            <input type="password" bind:value={adminPasswordConfirm} placeholder="Repita a senha" required class="input" />
          </div>
          <div class="flex gap-3">
            <button type="button" on:click={() => (step = 1)} class="btn-secondary flex-1 py-2.5">
              ← Voltar
            </button>
            <button type="submit" disabled={loading} class="btn-primary flex-1 py-2.5">
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </div>
        </form>
      {/if}
    </div>

    <p class="text-center mt-6 text-sm text-gray-500">
      Já tem uma conta?
      <a href="/login" class="text-primary-600 hover:text-primary-700 font-medium">Fazer login</a>
    </p>
  </div>
</div>
