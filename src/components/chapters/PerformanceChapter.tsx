import { useId } from 'react';
import type { CSSProperties } from 'react';
import { vehicle } from '../../config/vehicle';
import type { ChapterDefinition, MotionMode, VehicleConfiguration } from '../../types/cinematic';
import { mapGaugeValue, parseSpecification } from './PerformanceChapter.gauge';
import './PerformanceChapter.css';

export interface PerformanceChapterProps {
  /** Local chapter progress in [0, 1], supplied by the scroll director. */
  progress: number;
  chapter?: ChapterDefinition;
  motionMode?: MotionMode;
  config?: VehicleConfiguration;
  id?: string;
  className?: string;
}

export function useChapterReducedMotion(mode: MotionMode): boolean {
  return mode !== 'full';
}

export function PerformanceChapter({ progress, motionMode = 'full', config = vehicle,
  id = 'performance', className = '', chapter }: PerformanceChapterProps) {
  const headingId = useId();
  // Technical specifications remain constant; scroll never implies acceleration.
  void progress;
  void motionMode;
  const specifications = config.specifications.filter(spec => spec.source.trim() && spec.value.trim());
  const primary = specifications.find(spec => parseSpecification(spec.value));
  const primaryNumber = primary ? parseSpecification(primary.value) : null;
  const angle = primaryNumber && primaryNumber.value > 0
    ? mapGaugeValue(primaryNumber.value, 0, primaryNumber.value) : mapGaugeValue(0);

  return <section id={id} className={`performance-chapter ${className}`} aria-labelledby={headingId}>
    <header className="performance-chapter__intro">
      <p className="performance-chapter__eyebrow">{chapter?.label ?? 'Performance'}</p>
      <h2 id={headingId}>{chapter?.headline ?? <>Precision,<br />in every measure.</>}</h2>
      <p>{chapter?.description ?? 'Explore the details behind the drive.'}</p>
    </header>
    {!chapter && <div className="performance-chapter__instrument">
      <svg className="performance-chapter__gauge" viewBox="0 0 400 350" aria-hidden="true" focusable="false">
        <path className="performance-chapter__arc" d="M 61.44 280 A 160 160 0 1 1 338.56 280" />
        {Array.from({ length: 41 }, (_, index) => <line key={index}
          x1="200" y1={index % 5 === 0 ? 55 : 46} x2="200" y2="36"
          transform={`rotate(${-120 + index * 6} 200 200)`}
          className={index % 5 === 0 ? 'performance-chapter__tick major' : 'performance-chapter__tick'} />)}
        <g transform={`rotate(${angle} 200 200)`}>
          <path className="performance-chapter__needle" d="M 197 216 L 200 65 L 203 216 Z" />
        </g>
        <circle className="performance-chapter__hub" cx="200" cy="200" r="8" />
      </svg>
      <p className="performance-chapter__dial-label">{primary?.label ?? 'Specifications pending'}<span>{primaryNumber?.unit || 'Verified figures, when available'}</span></p>
    </div>}
    <dl className="performance-chapter__specs">
      {specifications.length ? specifications.map((spec, index) => {
        const numeric = parseSpecification(spec.value);
        const local = 1;
        const displayed = numeric ? `${(numeric.value * local).toFixed(numeric.decimals)}${numeric.unit ? ` ${numeric.unit}` : ''}` : spec.value;
        return <div key={`${spec.label}-${index}`} style={{ '--spec-progress': local } as CSSProperties}>
          <dt>{spec.label}</dt>
          <dd><span aria-hidden="true">{displayed}</span><span className="performance-chapter__sr">{spec.value}</span></dd>
        </div>;
      }) : <div><dt>Verified specifications</dt><dd><span aria-hidden="true">—</span><span className="performance-chapter__sr">Not yet available</span></dd><p>Approved figures will appear here.</p></div>}
    </dl>
  </section>;
}
