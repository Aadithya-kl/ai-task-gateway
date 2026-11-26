# ai-task-gateway

A small TypeScript gateway for AI calls in production apps:

- **Routes each task** (e.g. `image_edit_draft`, `text`) to a primary model, with an optional **fallback** if the first fails
- **Logs every call** (provider, model, status, cost, duration) through a `JobStore` you implement for your database. An in-memory store is included
- **Daily spend limit**: stops new calls once today's cost reaches your cap
- **Image-edit provider** for any OpenAI-compatible `/images/edits` API. Bring your own storage (S3, R2, Supabase, local)
- **Render history helpers**: version names ("lobby render v3", never reused), path-ownership checks, metadata

No runtime dependencies. Built from the AI design studio Hexaspace uses for interior renders.

## Install

```bash
npm install @hexaspace/ai-task-gateway
```

## Example

```ts
import { Gateway, imageEditProvider } from '@hexaspace/ai-task-gateway';

const gateway = new Gateway({ dailyLimitUsd: 20 });
gateway.register('image_edit_draft',
  imageEditProvider({ apiKey: process.env.IMAGE_API_KEY!, storage: myStorage, costUsdPerImage: 0.04 }),
  imageEditProvider({ apiKey: process.env.BACKUP_KEY!, baseUrl: 'https://other-provider.example/v1', storage: myStorage }),
);

const { output, costUsd } = await gateway.run('image_edit_draft',
  { sourcePath: 'quick/u1/room.png', prompt: 'warm oak flooring, linen curtains' },
  { userId: 'u1' });
```

To use your own database, implement `JobStore` (`create`, `update`, `spendSince`).

## Roadmap

- Per-user and per-project limits
- Retry with backoff before falling back
- More providers (text, vision)

## Licence

MIT. Maintained by [Hexaspace](https://hexaspace.in).
