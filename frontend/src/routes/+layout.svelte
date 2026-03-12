<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { Toaster } from 'svelte-sonner';
</script>

<Toaster position="top-right" richColors />

<slot />
