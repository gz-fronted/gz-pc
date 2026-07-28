import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/example', () => {
    return HttpResponse.json({
      records: [],
      total: 0,
    });
  }),
];
