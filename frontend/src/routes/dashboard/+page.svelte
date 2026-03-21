<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { api } from '$lib/api';
  import { currentUser } from '$lib/stores/auth';
  import { formatTime, getTimeRecordLabel, formatDate } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import type { TimeRecord, AttendanceDay, TimeRecordType } from '$lib/types';
  import FaceCapture from '$lib/components/FaceCapture.svelte';

  let todayRecords: TimeRecord[] = [];
  let todayAttendance: AttendanceDay | null = null;
  let loading = true;
  let clockingIn = false;
  let faceLoading = false;
  let facePreview: string | null = null;

  // Tab state
  type Tab = 'manual' | 'qrcode' | 'facial';
  let activeTab: Tab = 'manual';

  // QR Code state
  let videoElement: HTMLVideoElement;
  let scanner: import('qr-scanner').default | null = null;
  let startingCamera = false;
  let cameraActive = false;
  let cameraError = '';
  let scanLocked = false;
  let qrLoading = false;
  let manualToken = '';

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

  onDestroy(() => {
    void stopScanner();
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

  // Manual
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

  // QR Code
  function extractToken(rawValue: string): string {
    const trimmed = rawValue.trim();
    if (!trimmed) return '';
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.token === 'string') {
        return parsed.token.trim();
      }
    } catch {
      // plain token
    }
    return trimmed;
  }

  async function registerByToken(tokenValue: string) {
    const token = extractToken(tokenValue);
    if (!token) return;
    qrLoading = true;
    try {
      await api.createQrcodeRecord({ token });
      toast.success('Ponto registrado via QR Code!');
      manualToken = '';
      await loadData();
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      toast.error(msg || 'QR code inválido');
    } finally {
      qrLoading = false;
    }
  }

  async function startScanner() {
    if (scanner || !videoElement) return;
    cameraError = '';
    startingCamera = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Navegador sem suporte a camera.');
      }
      const { default: QrScanner } = await import('qr-scanner');
      scanner = new QrScanner(
        videoElement,
        async (result) => {
          if (scanLocked || qrLoading) return;
          scanLocked = true;
          const scannedText = typeof result === 'string' ? result : (result.data ?? '');
          const token = extractToken(scannedText);
          if (!token) {
            toast.error('Nao foi possivel extrair o token do QR code.');
            setTimeout(() => { scanLocked = false; }, 1200);
            return;
          }
          manualToken = token;
          await registerByToken(token);
          await stopScanner();
          scanLocked = false;
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 4,
          returnDetailedScanResult: true,
        },
      );
      await scanner.start();
      cameraActive = true;
    } catch (err: any) {
      cameraError = err?.message || 'Nao foi possivel iniciar a camera.';
      toast.error(cameraError);
      await stopScanner();
    } finally {
      startingCamera = false;
    }
  }

  async function stopScanner() {
    if (!scanner) {
      cameraActive = false;
      return;
    }
    await scanner.stop();
    scanner.destroy();
    scanner = null;
    cameraActive = false;
  }

  // Facial
  function onFaceCaptured(event: CustomEvent<string>) {
    facePreview = event.detail;
  }

  async function registerFacialPoint() {
    if (!nextType || !facePreview) {
      toast.error('Selecione uma foto para validar o ponto.');
      return;
    }
    faceLoading = true;
    try {
      const result = await api.createFacialRecord({ type: nextType, image: facePreview });
      if ('record' in result) {
        toast.success(`${getTimeRecordLabel(nextType)} registrado por face!`);
        await loadData();
      } else {
        const message = result.message ?? 'Validação facial requer revisão';
        toast.error(message);
      }
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      toast.error(msg || 'Erro ao registrar ponto facial');
    } finally {
      faceLoading = false;
    }
  }

  function onFaceError(event: CustomEvent<string>) {
    const message = event.detail || 'Erro ao acessar a câmera';
    toast.error(message);
  }

  function methodLabel(method: string) {
    if (method === 'QR_CODE') return 'QR Code';
    if (method === 'FACIAL') return 'Facial';
    return 'Manual';
  }

  function switchTab(tab: Tab) {
    // Stop QR scanner when leaving QR tab
    if (activeTab === 'qrcode' && tab !== 'qrcode') {
      void stopScanner();
    }
    activeTab = tab;
  }
</script>

<svelte:head>
  <title>Registrar Ponto - Controle de Ponto</title>
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

      {#if dayCompleted}
        <div class="text-center py-4">
          <div class="text-green-500 text-4xl mb-2">✅</div>
          <p class="text-green-700 font-medium">Expediente encerrado</p>
          <p class="text-gray-500 text-sm mt-1">Bom descanso!</p>
        </div>
      {:else}
        <!-- Tabs -->
        <div class="border-b border-gray-200 mb-4">
          <nav class="flex space-x-4" aria-label="Método de registro">
            <button
              on:click={() => switchTab('manual')}
              class="pb-3 px-1 text-sm font-medium border-b-2 transition-colors
                {activeTab === 'manual' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
            >
              Manual
            </button>
            <button
              on:click={() => switchTab('qrcode')}
              class="pb-3 px-1 text-sm font-medium border-b-2 transition-colors
                {activeTab === 'qrcode' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
            >
              QR Code
            </button>
            <button
              on:click={() => switchTab('facial')}
              class="pb-3 px-1 text-sm font-medium border-b-2 transition-colors
                {activeTab === 'facial' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
            >
              Facial
            </button>
          </nav>
        </div>

        <!-- Tab: Manual -->
        {#if activeTab === 'manual'}
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
        {/if}

        <!-- Tab: QR Code -->
        {#if activeTab === 'qrcode'}
          <div class="text-center py-4">
            <p class="text-gray-500 text-sm mb-4">
              Aproxime a câmera do QR code exibido pelo administrador, ou insira o token manualmente.
            </p>

            <div class="bg-gray-100 rounded-xl aspect-square max-w-xs mx-auto overflow-hidden mb-4 relative">
              <video
                bind:this={videoElement}
                class="h-full w-full object-cover"
                playsinline
                muted
              ></video>
              {#if !cameraActive}
                <div class="absolute inset-0 flex items-center justify-center bg-gray-100/90">
                  <div class="text-center text-gray-500 px-4">
                    <p class="text-3xl mb-2">📷</p>
                    <p class="text-sm font-medium">
                      {startingCamera ? 'Iniciando camera...' : 'Scanner parado'}
                    </p>
                    {#if cameraError}
                      <p class="text-xs mt-1 text-red-600">{cameraError}</p>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>

            <div class="flex gap-2 mb-4">
              <button
                on:click={startScanner}
                disabled={startingCamera || cameraActive}
                class="btn-secondary flex-1"
              >
                {startingCamera ? 'Abrindo...' : 'Iniciar camera'}
              </button>
              <button
                on:click={stopScanner}
                disabled={!cameraActive}
                class="btn-secondary flex-1"
              >
                Parar camera
              </button>
            </div>

            <div class="border-t border-gray-100 pt-4">
              <p class="text-sm text-gray-500 mb-3">Ou insira o token manualmente:</p>
              <div class="flex gap-2">
                <input
                  type="text"
                  bind:value={manualToken}
                  placeholder="Token do QR code"
                  class="input flex-1"
                  on:keydown={(e) => e.key === 'Enter' && registerByToken(manualToken)}
                />
                <button
                  on:click={() => registerByToken(manualToken)}
                  disabled={qrLoading || !manualToken.trim()}
                  class="btn-primary px-4"
                >
                  {qrLoading ? '...' : '✓'}
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Tab: Facial -->
        {#if activeTab === 'facial'}
          <div class="py-4">
            <p class="text-sm text-gray-500 mb-4">Permita a câmera ou envie uma foto atual para validar o ponto.</p>

            <FaceCapture on:capture={onFaceCaptured} on:error={onFaceError} />

            <button
              on:click={registerFacialPoint}
              class="btn-primary w-full mt-4"
              disabled={!facePreview || faceLoading}
            >
              {#if faceLoading}
                Validando rosto...
              {:else}
                Validar e registrar {nextType ? getTimeRecordLabel(nextType) : ''}
              {/if}
            </button>
          </div>
        {/if}
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
                  <p class="text-xs text-gray-400">{methodLabel(record.method)}</p>
                </div>
              </div>
              <span class="text-sm font-medium text-gray-700">{formatTime(record.recordedAt)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
