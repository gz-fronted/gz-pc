async function renderApp(): Promise<void> {
  // Replace this placeholder with the application's React render call.
}

async function bootstrap(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const { startMock } = await import('./mock/browser');
    await startMock();
  }

  await renderApp();
}

void bootstrap();
