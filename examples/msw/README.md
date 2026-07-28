# MSW application example

This directory demonstrates application-owned MSW wiring. Copy the structure into
the consuming application and replace the example handler with business handlers.

`npm run mock` loads `.env.mock`, waits for `worker.start()`, and only then renders
the application. `onUnhandledRequest: 'bypass'` lets unmatched requests reach the
real backend.
