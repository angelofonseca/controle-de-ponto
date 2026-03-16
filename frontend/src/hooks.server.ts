import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Silencia requisição automática do Chrome DevTools (PWA audit) para evitar 404 no console.
  if (event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  }

  return resolve(event);
};
