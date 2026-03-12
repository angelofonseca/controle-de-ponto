<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { toast } from 'svelte-sonner';
  import type { QrCodeSession } from '$lib/types';

  let token = '';
  let loading = false;
  let result: QrCodeSession | null = null;
  let manualToken = '';

  async function scanQrCode() {
    if (!manualToken.trim()) return;
    loading = true;
    try {
      const record = await api.createQrcodeRecord({ token: manualToken.trim() });
      toast.success('Ponto registrado via QR Code!');
      manualToken = '';
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      toast.error(msg || 'QR code inválido');
    } finally {
      loading = false;
    }
  }
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

    <!-- Camera placeholder - in a real app, this would use jsQR or similar -->
    <div class="bg-gray-100 rounded-xl aspect-square max-w-xs mx-auto flex items-center justify-center mb-6">
      <div class="text-center text-gray-400">
        <p class="text-4xl mb-2">📷</p>
        <p class="text-sm">Câmera não disponível nesta versão</p>
        <p class="text-xs mt-1">Use o campo abaixo</p>
      </div>
    </div>

    <div class="border-t border-gray-100 pt-5">
      <p class="text-sm text-gray-500 mb-3">Ou insira o token manualmente:</p>
      <div class="flex gap-2">
        <input
          type="text"
          bind:value={manualToken}
          placeholder="Token do QR code"
          class="input flex-1"
          on:keydown={(e) => e.key === 'Enter' && scanQrCode()}
        />
        <button
          on:click={scanQrCode}
          disabled={loading || !manualToken.trim()}
          class="btn-primary px-4"
        >
          {loading ? '...' : '✓'}
        </button>
      </div>
    </div>
  </div>
</div>
