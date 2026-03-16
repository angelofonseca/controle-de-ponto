<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { api } from '$lib/api';
  import { profilePhoto } from '$lib/stores/profilePhoto';
  import { currentUser } from '$lib/stores/auth';
  import FaceCapture from '$lib/components/FaceCapture.svelte';
  import { toast } from 'svelte-sonner';
  import { formatDateTime } from '$lib/utils';
  import { get } from 'svelte/store';

  let photo: string | null = null;
  let user = get(currentUser);
  let loading = true;

  const unsubscribe = profilePhoto.subscribe((value) => {
    photo = value;
  });

  onMount(async () => {
    try {
      user = await api.getMe();
    } catch (err: any) {
      toast.error('Não foi possível carregar o perfil');
    } finally {
      loading = false;
    }
  });

  function onCapture(event: CustomEvent<string>) {
    photo = event.detail;
    profilePhoto.set(photo);
    toast.success('Foto atualizada localmente');
  }

  function onError(event: CustomEvent<string>) {
    toast.error(event.detail || 'Erro ao acessar câmera');
  }

  $: fullName = user?.name ?? 'Usuário';

  onDestroy(() => unsubscribe());
</script>

<svelte:head>
  <title>Perfil - Controle de Ponto</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Perfil</h1>
      <p class="text-gray-500 text-sm">Dados da conta e foto de perfil</p>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else}
    <div class="card p-6 space-y-4">
      <div class="flex items-center space-x-4">
        <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
          {#if photo}
            <img src={photo} alt="Foto de perfil" class="w-full h-full object-cover" />
          {:else}
            <span class="text-2xl">👤</span>
          {/if}
        </div>
        <div>
          <p class="text-lg font-semibold text-gray-900">{fullName}</p>
          <p class="text-sm text-gray-500">{user?.email}</p>
          <p class="text-xs text-gray-400 mt-1">Empresa: {user?.company?.name ?? '—'}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <p class="text-xs text-gray-500">Cargo</p>
          <p class="font-medium">{user?.role === 'COMPANY_ADMIN' ? 'Administrador' : 'Colaborador'}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Ativo desde</p>
          <p class="font-medium">{user?.createdAt ? formatDateTime(user.createdAt) : '—'}</p>
        </div>
      </div>
    </div>

    <div class="card p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Atualizar foto</h2>
          <p class="text-sm text-gray-500">Use a câmera ou upload para definir sua foto local.</p>
        </div>
        <span class="badge badge-gray">Local</span>
      </div>

      <FaceCapture on:capture={onCapture} on:error={onError} />
    </div>
  {/if}
</div>
