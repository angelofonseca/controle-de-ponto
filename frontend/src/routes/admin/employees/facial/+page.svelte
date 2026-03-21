<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api } from '$lib/api';
  import { toast } from 'svelte-sonner';
  import FaceCapture from '$lib/components/FaceCapture.svelte';

  let userId = '';
  let userName = '';
  let userEmail = '';
  let loadingUser = true;
  let enrolling = false;

  let faceStatus: { hasTemplate: boolean; template: any } | null = null;
  let capturedImages: string[] = [];

  $: userId = $page.url.searchParams.get('userId') ?? '';

  onMount(async () => {
    if (!userId) {
      toast.error('ID do colaborador não informado');
      loadingUser = false;
      return;
    }
    await loadUserData();
  });

  async function loadUserData() {
    loadingUser = true;
    try {
      const [employees, status] = await Promise.all([
        api.getEmployees(),
        api.getFaceStatus(userId),
      ]);
      const emp = employees.find((e) => e.userId === userId);
      if (emp?.user) {
        userName = emp.user.name ?? '';
        userEmail = emp.user.email ?? '';
      }
      faceStatus = status;
    } catch (err: any) {
      toast.error('Erro ao carregar dados do colaborador');
    } finally {
      loadingUser = false;
    }
  }

  function onFaceCaptured(event: CustomEvent<string>) {
    capturedImages = [...capturedImages, event.detail];
  }

  function onFaceError(event: CustomEvent<string>) {
    toast.error(event.detail || 'Erro ao acessar a câmera');
  }

  function removeImage(index: number) {
    capturedImages = capturedImages.filter((_, i) => i !== index);
  }

  async function handleEnroll() {
    if (capturedImages.length === 0) {
      toast.error('Capture pelo menos uma foto antes de cadastrar.');
      return;
    }
    enrolling = true;
    try {
      const result = await api.enrollFace({ images: capturedImages, userId });
      toast.success(`Face cadastrada! ${result.samplesUsed} amostra(s) usada(s).`);
      capturedImages = [];
      faceStatus = await api.getFaceStatus(userId);
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      toast.error(msg || 'Erro ao cadastrar face');
    } finally {
      enrolling = false;
    }
  }
</script>

<svelte:head>
  <title>Cadastrar Face - Controle de Ponto</title>
</svelte:head>

<div class="space-y-6 max-w-2xl">
  <div class="flex items-center space-x-3">
    <a href="/admin/employees" class="text-gray-400 hover:text-gray-600">← Voltar</a>
    <h1 class="text-2xl font-bold text-gray-900">Cadastrar Face</h1>
  </div>

  {#if loadingUser}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else if !userId}
    <div class="card p-8 text-center">
      <p class="text-gray-500">ID do colaborador não informado na URL.</p>
      <a href="/admin/employees" class="btn-primary mt-4 inline-block">Voltar para colaboradores</a>
    </div>
  {:else}
    <!-- Employee info -->
    <div class="card p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium text-gray-900">{userName}</p>
          <p class="text-sm text-gray-500">{userEmail}</p>
        </div>
        {#if faceStatus?.hasTemplate}
          <span class="badge badge-success">Face cadastrada</span>
        {:else}
          <span class="badge badge-gray">Sem face</span>
        {/if}
      </div>
      {#if faceStatus?.template}
        <div class="mt-3 text-xs text-gray-400 space-x-4">
          <span>Amostras: {faceStatus.template.samplesCount}</span>
          {#if faceStatus.template.qualityScore}
            <span>Qualidade: {(faceStatus.template.qualityScore * 100).toFixed(0)}%</span>
          {/if}
          <span>Engine: {faceStatus.template.engine} v{faceStatus.template.version}</span>
        </div>
      {/if}
    </div>

    <!-- Capture -->
    <div class="card p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Capturar fotos</h2>
      <p class="text-sm text-gray-500 mb-4">
        Capture uma ou mais fotos do colaborador. Mais fotos melhoram a precisão do reconhecimento.
      </p>

      <FaceCapture on:capture={onFaceCaptured} on:error={onFaceError} />
    </div>

    <!-- Captured images -->
    {#if capturedImages.length > 0}
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">
          Fotos capturadas ({capturedImages.length})
        </h2>
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {#each capturedImages as img, i}
            <div class="relative group">
              <img src={img} alt="Captura {i + 1}" class="w-full aspect-square object-cover rounded-lg" />
              <button
                on:click={() => removeImage(i)}
                class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs
                  opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          {/each}
        </div>

        <button
          on:click={handleEnroll}
          disabled={enrolling}
          class="btn-primary w-full mt-4"
        >
          {enrolling ? 'Cadastrando...' : `Cadastrar Face (${capturedImages.length} foto(s))`}
        </button>
      </div>
    {/if}
  {/if}
</div>
