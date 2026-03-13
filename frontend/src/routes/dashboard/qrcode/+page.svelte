<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { api } from '$lib/api';
  import { toast } from 'svelte-sonner';

  let videoElement: HTMLVideoElement;
  let scanner: import('qr-scanner').default | null = null;
  let startingCamera = false;
  let cameraActive = false;
  let cameraError = '';
  let scanLocked = false;
  let loading = false;
  let manualToken = '';

  function extractToken(rawValue: string): string {
    const trimmed = rawValue.trim();
    if (!trimmed) return '';

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.token === 'string') {
        return parsed.token.trim();
      }
    } catch {
      // QR payload can also be plain token.
    }

    return trimmed;
  }

  async function registerByToken(tokenValue: string) {
    const token = extractToken(tokenValue);
    if (!token) return;

    loading = true;
    try {
      await api.createQrcodeRecord({ token });
      toast.success('Ponto registrado via QR Code!');
      manualToken = '';
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      toast.error(msg || 'QR code inválido');
    } finally {
      loading = false;
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
          if (scanLocked || loading) return;

          scanLocked = true;
          const scannedText =
            typeof result === 'string' ? result : (result.data ?? '');
          const token = extractToken(scannedText);

          if (!token) {
            toast.error('Nao foi possivel extrair o token do QR code.');
            setTimeout(() => {
              scanLocked = false;
            }, 1200);
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

  onMount(async () => {
    await startScanner();
  });

  onDestroy(() => {
    void stopScanner();
  });
</script>

<svelte:head>
  <title>QR Code - Controle de Ponto</title>
</svelte:head>

<div class="space-y-6 max-w-lg mx-auto">
  <h1 class="text-2xl font-bold text-gray-900">Registrar via QR Code</h1>

  <div class="card p-6 text-center">
    <div class="text-6xl mb-4">📷</div>
    <h2 class="text-lg font-semibold text-gray-900 mb-2">Leia o QR Code</h2>
    <p class="text-gray-500 text-sm mb-6">
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

    <div class="flex gap-2 mb-6">
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

    <div class="border-t border-gray-100 pt-5">
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
          disabled={loading || !manualToken.trim()}
          class="btn-primary px-4"
        >
          {loading ? '...' : '✓'}
        </button>
      </div>
    </div>
  </div>
</div>
