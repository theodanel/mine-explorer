import { SoundId } from './sound-catalog';
import { renderSound, Samples } from './synth';
import { renderZoneMusic } from './zone-music';

/** Ce que le Web Worker calcule : un bruitage, ou la musique d'une zone. */
export type AudioRequest =
  | { readonly kind: 'sound'; readonly id: SoundId; readonly rate: number }
  | { readonly kind: 'music'; readonly zone: number; readonly rate: number };

export interface AudioResult {
  readonly key: string;
  readonly samples: Samples;
}

export function requestKey(request: AudioRequest): string {
  return request.kind === 'sound' ? `sound:${request.id}` : `music:${request.zone}`;
}

export function renderRequest(request: AudioRequest): Samples {
  return request.kind === 'sound' ? renderSound(request.id, request.rate) : renderZoneMusic(request.zone, request.rate);
}

/**
 * Calcule les bruitages et les musiques dans un Web Worker : 0,1 à 0,5 s de calcul par lot sur téléphone, qui
 * figeaient le jeu au premier toucher et à chaque nouvelle zone. Sans Worker (vieux navigateur, tests), le calcul se
 * fait sur le fil principal, juste après.
 */
export class AudioRenderer {
  private worker: Worker | null | undefined;
  /** Calculs demandés au Worker et pas encore reçus. */
  private readonly pending = new Map<string, { readonly request: AudioRequest; readonly resolve: (samples: Samples) => void }>();

  /** Vrai quand les calculs partent dans un Worker ; faux, ils se font sur le fil principal. */
  get usesWorker(): boolean {
    return this.ensureWorker() !== null;
  }

  render(request: AudioRequest): Promise<Samples> {
    const worker = this.ensureWorker();
    if (worker === null) {
      return new Promise((resolve) => setTimeout(() => resolve(renderRequest(request))));
    }
    return new Promise((resolve) => {
      this.pending.set(requestKey(request), { request, resolve });
      worker.postMessage(request);
    });
  }

  private ensureWorker(): Worker | null {
    if (this.worker !== undefined) {
      return this.worker;
    }
    if (typeof Worker === 'undefined') {
      this.worker = null;
      return null;
    }
    try {
      const worker = new Worker(new URL('./audio.worker', import.meta.url), { type: 'module' });
      worker.addEventListener('message', ({ data }: MessageEvent<AudioResult>) => {
        this.pending.get(data.key)?.resolve(data.samples);
        this.pending.delete(data.key);
      });
      worker.addEventListener('error', (event) => {
        // Le Worker ne démarre pas : les calculs en attente repassent sur le fil principal
        console.error('Calcul du son hors du fil principal impossible', event.message);
        this.worker = null;
        for (const { request, resolve } of this.pending.values()) {
          setTimeout(() => resolve(renderRequest(request)));
        }
        this.pending.clear();
      });
      this.worker = worker;
    } catch (error) {
      console.error('Calcul du son hors du fil principal impossible', error);
      this.worker = null;
    }
    return this.worker;
  }
}
