import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { ChapterDefinition, AssetId, AssetManifest, AssetRecord, AssetVariant, MotionMode, NormalizedProgress } from '../../types/cinematic';
import { assertLocalPath, validateManifest } from '../../lib/assets/manifest';
import { clampChapterProgress } from './OrbitChapter';
import styles from './DetailsChapter.module.css';

export type DetailSubject = 'headlights' | 'bodywork' | 'cockpit' | 'materials';
export interface VerifiedDetailAsset {
  /** Explicit media-owner verification of the subject; never inferred from a filename. */
  verified: true;
  assetId: AssetId;
  /** Subject-safe crop approved for this asset's variant. */
  position?: readonly [number, number];
}
export interface DetailsChapterProps {
  chapter?: ChapterDefinition;
  sharedMedia?: boolean;
  manifest: AssetManifest;
  variant: AssetVariant;
  progress: NormalizedProgress;
  motionMode: MotionMode;
  assets?: Partial<Record<DetailSubject, VerifiedDetailAsset>>;
  className?: string;
  onError?: (assetId: AssetId, error: Error) => void;
}
const subjects = [
  { id: 'headlights', label: 'Headlights', headline: 'Light, precisely framed.' },
  { id: 'bodywork', label: 'Bodywork', headline: 'A study in surfaces.' },
  { id: 'cockpit', label: 'Cockpit', headline: 'A closer perspective.' },
  { id: 'materials', label: 'Materials', headline: 'Texture. Tone. Detail.' },
] as const;

function DetailImage({ asset, position, onError }: { asset: AssetRecord; position?: readonly [number, number]; onError?: DetailsChapterProps['onError'] }) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const crop = position && position.every(v => Number.isFinite(v) && v >= 0 && v <= 100) ? position : [50, 50];
  return <>
    {state !== 'failed' && <img className={styles.image} src={asset.url} alt="" decoding="async"
      style={{ objectPosition: `${crop[0]}% ${crop[1]}%`, visibility: state === 'ready' ? 'visible' : 'hidden' }}
      onLoad={() => setState('ready')} onError={() => {
        setState('failed'); onError?.(asset.id, new Error(`Detail asset unavailable: ${asset.id}`));
      }} />}
    {state !== 'ready' && <div className={styles.missing}>{state === 'loading' ? 'Loading verified close-up…' : 'Close-up asset missing — image could not be loaded.'}</div>}
  </>;
}

/** All opacity/crop values derive from local progress, including reverse seeks. */
export function DetailsChapter({ manifest, variant, progress, motionMode, assets, className, onError, chapter, sharedMedia }: DetailsChapterProps) {
  const approved = useMemo(() => {
    try { return validateManifest(manifest).status === 'approved'; } catch { return false; }
  }, [manifest]);
  const p = clampChapterProgress(progress);
  const playhead = p * (subjects.length - 1);
  const current = Math.round(playhead);
  const full = motionMode === 'full';
  return <section className={[styles.root, className].filter(Boolean).join(' ')} aria-label="Details" data-motion={motionMode}>
    <header className={styles.header}><p className={styles.eyebrow}>{chapter?.label ?? 'Details'}</p><h2>{chapter?.headline ?? 'Look closer.'}</h2></header>
    {chapter && <p>{chapter.description}</p>}
    {!sharedMedia && <><div className={styles.stage}>
      {subjects.map((subject, index) => {
        const binding = assets?.[subject.id];
        const asset = approved && binding?.verified === true ? manifest.assets.find(a => a.id === binding.assetId
          && a.kind === 'poster' && a.variant === variant && a.status === 'approved' && a.source && a.license && a.alt && a.url) : undefined;
        let safe = Boolean(asset);
        if (asset?.url) { try { assertLocalPath(asset.url); } catch { safe = false; } }
        const opacity = full ? Math.max(0, 1 - Math.abs(playhead - index)) : Number(index === current);
        const style = { '--detail-opacity': opacity, '--detail-scale': full ? 1.025 + 0.025 * (playhead - index + 1) : 1 } as CSSProperties;
        return <figure key={subject.id} className={styles.panel} style={style} aria-hidden={index !== current}>
          <div className={styles.picture} aria-hidden="true">
            {safe && asset ? <DetailImage key={`${asset.id}:${asset.url}`} asset={asset} position={binding?.position} onError={onError} />
              : <div className={styles.missing}>{subject.label} asset missing — a verified close-up is required.</div>}
          </div>
          <figcaption className={styles.caption}>
            <p className={styles.eyebrow}>0{index + 1} / {subject.label}</p>
            <h3>{subject.headline}</h3>
            <p className={styles.alt}>{safe && asset ? asset.alt : `Verified ${subject.label.toLowerCase()} imagery is not supplied.`}</p>
          </figcaption>
        </figure>;
      })}
    </div>
    <ol className={styles.index} aria-label="Close-up subjects">{subjects.map((subject, i) => <li key={subject.id} data-current={i === current}>{subject.label}</li>)}</ol></>}
  </section>;
}

export default DetailsChapter;
