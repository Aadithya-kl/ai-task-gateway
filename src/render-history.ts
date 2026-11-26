// Pure helpers for a render history: version names, path ownership, metadata. No I/O.

export const QUICK_NAME = 'Quick renders';

/** Name of the next render view for a source image, e.g. "photo.png render v2". Never reuses a number. */
export function nextRenderName(sourceFile: string, existingNames: string[]): string {
  const base = sourceFile.replace(/^[0-9a-f]{24}-/, '').replace(/\.[^.]+$/, '') || 'source';
  const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} render v(\\d+)$`);
  const max = existingNames.reduce((m, n) => {
    const hit = re.exec(n);
    return hit ? Math.max(m, Number(hit[1])) : m;
  }, 0);
  return `${base} render v${max + 1}`;
}

/** Only paths under the caller's own folder are accepted as sources or renders. */
export function ownsPath(path: string, userId: string, root: 'quick' | 'renders'): boolean {
  return path.startsWith(`${root}/${userId}/`) && !path.includes('..');
}

export type RenderMeta = {
  prompt: string;
  settings: Record<string, string>;
  jobId: string;
  pricePending: boolean;
  references: { path: string; role: string }[];
};

/** Metadata stored on the render asset. The Design Concept label is applied at export, not stored here. */
export function buildRenderMeta(m: RenderMeta) {
  return {
    ...m,
    prompt: m.prompt.slice(0, 4000),
    design_concept: true,
    cost_label: m.pricePending ? 'price pending' : 'recorded',
  };
}
