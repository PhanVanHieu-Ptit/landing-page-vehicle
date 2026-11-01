import type { VehicleConfiguration } from '../types/cinematic';

/** Shared project configuration: docs/creative-brief.md. Vehicle approval is pending. */
export const vehicle = {
  status: 'awaiting-project-configuration',
  identity: { brand: null, model: null, modelYear: null },
  specifications: [],
  primaryAction: null,
  chapters: [
    { id: 'presence', label: 'Presence', start: 0, end: 0.14,
      headline: 'A presence, revealed.', description: 'Light introduces the whole form.' },
    { id: 'silhouette', label: 'Silhouette', start: 0.14, end: 0.32,
      headline: 'Follow the line.', description: 'A lateral view traces the silhouette.' },
    { id: 'detail', label: 'Detail', start: 0.32, end: 0.49,
      headline: 'Look closer.', description: 'Light isolates a small exterior detail.' },
    { id: 'interior', label: 'Interior', start: 0.49, end: 0.66,
      headline: 'A different perspective.', description: 'The viewpoint moves inside the cabin.' },
    { id: 'journey', label: 'Journey', start: 0.66, end: 0.85,
      headline: 'Beyond the frame.', description: 'The vehicle is situated within an open landscape.' },
    { id: 'invitation', label: 'Invitation', start: 0.85, end: 1,
      headline: 'Stay with the moment.', description: 'A final still leaves space for an approved next step.' },
  ],
} as const satisfies VehicleConfiguration;

/** Original concept study: generated studio stills, not production vehicle claims. */
export const conceptChapters = [
  { id: 'presence', label: 'The unveiling', kicker: 'An exercise in timelessness', title: 'Some things\nnever grow old.', text: 'A silhouette from another era. A presence entirely its own.', image: 'covered' },
  { id: 'silhouette', label: 'The silhouette', kicker: '01 / Form', title: 'Drawn by hand.\nFelt by instinct.', text: 'A long bonnet. A falling roofline. Nothing more than the essential.', image: 'hero' },
  { id: 'detail', label: 'The details', kicker: '02 / Detail', title: 'The closer you look,\nthe longer you stay.', text: 'Light finds the curves. Chrome catches the last of it.', image: 'detail' },
  { id: 'interior', label: 'The perspective', kicker: '03 / Perspective', title: 'A different\npoint of view.', text: 'Walk around the form. Let every angle tell its own story.', image: 'rear' },
  { id: 'journey', label: 'The character', kicker: '04 / Character', title: 'Measured in\nfeeling.', text: 'Not every quality belongs on a specification sheet.', image: 'hero' },
  { id: 'invitation', label: 'The last look', kicker: 'The study continues', title: 'Made to be\nremembered.', text: 'An original grand tourer concept. A study in light, form and motion.', image: 'rear' },
];


/** Original motorcycle concept; no production specifications or brand claims. */
export const motorcycleChapters = [
  { id: 'presence', label: 'The unveiling', kicker: 'Two wheels. An enduring spirit.', title: 'Less between you.\nMore ahead.', text: 'A classic café racer. A study in balance, light and freedom.', image: 'covered' },
  { id: 'silhouette', label: 'The silhouette', kicker: '01 / Form', title: 'One line.\nPure intention.', text: 'A sculpted tank. A low saddle. A silhouette reduced to its essentials.', image: 'hero' },
  { id: 'detail', label: 'The details', kicker: '02 / Detail', title: 'Character in\nevery curve.', text: 'Brushed metal, deep colour and the quiet precision of exposed mechanics.', image: 'detail' },
  { id: 'interior', label: 'The perspective', kicker: '03 / Perspective', title: 'An open\npoint of view.', text: 'No cabin. No frame around the world. Just a different way to see it.', image: 'rear' },
  { id: 'journey', label: 'The character', kicker: '04 / Character', title: 'Follow\nthe feeling.', text: 'The anticipation of a bend. The stillness before the road begins.', image: 'hero' },
  { id: 'invitation', label: 'The last look', kicker: 'The study continues', title: 'Two wheels.\nCountless stories.', text: 'An original motorcycle concept. An independent study in light, form and motion.', image: 'rear' },
];


export const vehicleStudies = {
  car: { chapters: conceptChapters, directory: '/assets/concept', note: 'A grand touring study', edition: 'GRAND TOURER', number: '001', alt: 'Oxblood grand tourer concept' },
  motorcycle: { chapters: motorcycleChapters, directory: '/assets/motorcycle', note: 'A motorcycle study', edition: 'CAFÉ RACER', number: '002', alt: 'Oxblood café racer motorcycle concept' },
} as const;
export type VehicleStudy = keyof typeof vehicleStudies;
