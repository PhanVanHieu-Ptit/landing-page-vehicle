/** Shared contracts only. No renderer or runtime is implemented here. */
export type ChapterId = 'presence' | 'silhouette' | 'detail' | 'interior' | 'journey' | 'invitation';
/** Runtime must validate finite values within [0, 1]. */
export type NormalizedProgress = number;
export type MotionMode = 'full' | 'reduced' | 'static';
export type AssetVariant = 'desktop' | 'mobile';
export type AssetId = `sequence-${AssetVariant}` | `poster-${ChapterId}-${AssetVariant}`;
export interface ChapterDefinition {
  id: ChapterId;
  label: string;
  start: NormalizedProgress;
  end: NormalizedProgress;
  headline: string;
  description: string;
}
export interface VerifiedSpecification {
  label: string;
  value: string;
  /** Approved source URL or document identifier; required before publication. */
  source: string;
}
export interface VehicleConfiguration {
  status: 'awaiting-project-configuration' | 'approved';
  identity: { brand: string | null; model: string | null; modelYear: string | null };
  specifications: readonly VerifiedSpecification[];
  primaryAction: { label: string; href: string } | null;
  chapters: readonly ChapterDefinition[];
}
export interface TimelineState {
  progress: NormalizedProgress;
  chapterId: ChapterId;
  localProgress: NormalizedProgress;
  frameIndex: number;
  motionMode: MotionMode;
}
export interface CinematicExperienceProps { config: VehicleConfiguration; manifest: AssetManifest }
export interface ScrollDirectorProps {
  chapters: readonly ChapterDefinition[];
  motionMode: MotionMode;
  onProgress: (state: TimelineState) => void;
}
export interface FrameSequenceProps {
  state: TimelineState;
  variant: AssetVariant;
  manifest: AssetManifest;
  onReady: () => void;
  onError: (assetId: AssetId) => void;
}
export interface ChapterPanelProps { chapter: ChapterDefinition; active: boolean; motionMode: MotionMode }
export interface ChapterNavigationProps {
  chapters: readonly ChapterDefinition[];
  activeId: ChapterId;
  onNavigate: (id: ChapterId) => void;
}
export interface ExperienceControlsProps {
  motionMode: MotionMode;
  onMotionModeChange: (mode: MotionMode) => void;
}
export interface InvitationProps { action: VehicleConfiguration['primaryAction'] }
export interface AssetRecord {
  id: AssetId;
  kind: 'sequence' | 'poster';
  status: 'required' | 'approved';
  variant: AssetVariant;
  url?: string;
  pattern?: string;
  width: number;
  height: number;
  frameCount?: number;
  firstFrame?: number;
  lastFrame?: number;
  maxBytesPerFile: number;
  license: string | null;
  source: string | null;
  alt: string | null;
}
export interface AssetManifest {
  schemaVersion: 1;
  status: 'requirements-only' | 'approved';
  assets: readonly AssetRecord[];
}
