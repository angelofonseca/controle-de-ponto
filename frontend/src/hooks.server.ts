import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Silencia requisição automática do Chrome DevTools (PWA audit) para evitar 404 no console.
  if (event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  }

  const response = await resolve(event);

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=()'
  );

  return response;
};
