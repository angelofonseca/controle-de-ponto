<script lang="ts">
  import { browser } from '$app/environment';
  import { createEventDispatcher, onDestroy } from 'svelte';

  const dispatch = createEventDispatcher<{ capture: string; error: string }>();

  let videoEl: HTMLVideoElement | null = null;
  let stream: MediaStream | null = null;
  let preview: string | null = null;
  let isCameraOn = false;
  let isRequesting = false;
  let permissionError: string | null = null;
  let errorDetails: string | null = null;

  // Sempre que o elemento de vídeo ligar e houver stream ativo, conecte a stream.
  $: if (videoEl && stream) {
    videoEl.srcObject = stream;
    videoEl.muted = true;
    videoEl.playsInline = true;
    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => null);
    }
  }

  onDestroy(() => stopCamera());

  async function startCamera() {
    if (!browser) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      permissionError = 'Este navegador não suporta acesso à câmera.';
      dispatch('error', permissionError);
      return;
    }
    if (isRequesting) return;
    isRequesting = true;
    permissionError = null;
    errorDetails = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.muted = true;
        videoEl.playsInline = true;
        const playPromise = videoEl.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          await playPromise.catch(() => null);
        }
        isCameraOn = true;
      } else {
        // Se o bind ainda não ocorreu, mantenha a flag ligada; o vídeo exibirá ao montar.
        isCameraOn = true;
      }
    } catch (err: any) {
      permissionError = 'Não foi possível acessar a câmera. Verifique permissões ou uso de https/localhost.';
      errorDetails = err?.message || String(err);
      dispatch('error', permissionError);
    }
    isRequesting = false;
  }

  function stopCamera() {
    isCameraOn = false;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  }

  function captureFrame() {
    if (!videoEl) return;
    const canvas = document.createElement('canvas');
    const sourceWidth = videoEl.videoWidth || 1280;
    const sourceHeight = videoEl.videoHeight || 720;
    const maxWidth = 640;
    const scale = sourceWidth > maxWidth ? maxWidth / sourceWidth : 1;
    canvas.width = Math.round(sourceWidth * scale);
    canvas.height = Math.round(sourceHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    preview = canvas.toDataURL('image/jpeg', 0.7);
    dispatch('capture', preview);
  }

  async function onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const base64 = await toCompressedBase64(file);
    preview = base64;
    dispatch('capture', base64);
  }

  function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  async function toCompressedBase64(file: File): Promise<string> {
    const source = await toBase64(file);
    return compressBase64Image(source);
  }

  function compressBase64Image(source: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 640;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Nao foi possivel preparar imagem'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error('Falha ao carregar imagem para compressao'));
      img.src = source;
    });
  }
</script>

<div class="space-y-3">
  <div class="flex items-center space-x-2">
    <button class="btn-secondary" type="button" on:click={startCamera} disabled={isCameraOn}>
      Ativar câmera
    </button>
    <button class="btn-ghost" type="button" on:click={stopCamera} disabled={!isCameraOn}>
      Parar
    </button>
    <button class="btn-primary" type="button" on:click={captureFrame} disabled={!isCameraOn}>
      Capturar
    </button>
    <label class="btn-ghost cursor-pointer" for="face-upload">
      Upload
      <input id="face-upload" class="hidden" type="file" accept="image/*" on:change={onFileSelected} />
    </label>
  </div>

  {#if permissionError}
    <p class="text-sm text-red-600">{permissionError}</p>
    {#if errorDetails}
      <p class="text-xs text-red-500">{errorDetails}</p>
    {/if}
  {/if}

  <div class="grid grid-cols-2 gap-4 items-center">
    <div class="rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center h-72 relative">
      {#if isCameraOn}
        <video
          bind:this={videoEl}
          autoplay
          playsinline
          muted
          class="w-full h-full object-cover"
        />
      {:else}
        <p class="text-gray-400 text-sm">Câmera desligada</p>
      {/if}
    </div>
    <div class="h-72 rounded-lg border border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
      {#if preview}
        <img src={preview} alt="Pré-visualização" class="w-full h-full object-cover rounded-lg" />
      {:else}
        <p class="text-gray-400 text-sm text-center">Capture ou faça upload para pré-visualizar</p>
      {/if}
    </div>
  </div>
</div>
