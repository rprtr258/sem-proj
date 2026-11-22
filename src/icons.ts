// Hand-drawn icons, one per spell id plus the wand shop card. Shared by the
// DOM UI (inline SVG) and the canvas wand-slot HUD (rasterized from the same
// source of truth).

const STROKE = `fill="none" stroke="#cfc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

const ICONS: Record<string, string> = {
  // circle with arrows pressing inward
  compression_sphere: `
    <circle cx="12" cy="12" r="4.5" ${STROKE}/>
    <path d="M12 2.6v3" ${STROKE}/><path d="M9.9 3.5 12 5.6l2.1-2.1" ${STROKE}/>
    <path d="M12 21.4v-3" ${STROKE}/><path d="M9.9 20.5 12 18.4l2.1 2.1" ${STROKE}/>
    <path d="M2.6 12h3" ${STROKE}/><path d="M3.5 9.9 5.6 12l-2.1 2.1" ${STROKE}/>
    <path d="M21.4 12h-3" ${STROKE}/><path d="M20.5 9.9 18.4 12l2.1 2.1" ${STROKE}/>`,
  // three stacked pulse waveforms, one per alternating pulse
  phase_discharge: `
    <path d="M3 5.5h4l2-2.4 2 4.8 2-2.4h8" ${STROKE}/>
    <path d="M3 12h4l2-2.4 2 4.8 2-2.4h8" ${STROKE}/>
    <path d="M3 18.5h4l2-2.4 2 4.8 2-2.4h8" ${STROKE}/>`,
  // tornado funnel, narrowing downward
  vortex: `
    <path d="M4 5c3.5 1.4 12.5 1.4 16 0" ${STROKE}/>
    <path d="M6.5 9.7c3 1.2 8 1.2 11 0" ${STROKE}/>
    <path d="M9 14.2c2 .9 4 .9 6 0" ${STROKE}/>
    <path d="M11 18.5h2" ${STROKE}/>`,
  // center dot with expanding pressure rings
  shockwave: `
    <circle cx="12" cy="12" r="1.6" fill="#cfc" stroke="none"/>
    <circle cx="12" cy="12" r="5.2" ${STROKE}/>
    <circle cx="12" cy="12" r="8.8" stroke-dasharray="3.4 3.4" ${STROKE}/>`,
  // jagged hot bolt
  spark: `
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" ${STROKE}/>`,
  // snowflake: three axes with branch chevrons on the vertical
  ice_needle: `
    <path d="M12 3v18" ${STROKE}/>
    <path d="M4.2 7.5l15.6 9" ${STROKE}/>
    <path d="M4.2 16.5l15.6-9" ${STROKE}/>
    <path d="M9.8 5.4 12 7.5l2.2-2.1" ${STROKE}/>
    <path d="M9.8 18.6 12 16.5l2.2 2.1" ${STROKE}/>`,
  // cycling arrows around a small flame
  heat_pump: `
    <path d="M21.5 4.5V10h-5.5" ${STROKE}/>
    <path d="M2.5 19.5V14h5.5" ${STROKE}/>
    <path d="M4.2 9.2a8.2 8.2 0 0 1 13.6-3L21.5 10" ${STROKE}/>
    <path d="M19.8 14.8a8.2 8.2 0 0 1-13.6 3L2.5 14" ${STROKE}/>
    <path d="M12 8.5c1.3 2-1.7 2.8-1.7 4.8a2.7 2.7 0 0 0 5.4 0c0-1.1-.5-2-1.2-2.6.1.9-.5 1.5-1.1 1.5.5-1.2-.3-2.5-1.4-3.7z" ${STROKE}/>`,
  // steam cloud with burst wisps above
  steam_blast: `
    <path d="M12 2.2v2.4" ${STROKE}/>
    <path d="M7.6 3.6l1.2 2" ${STROKE}/>
    <path d="M16.4 3.6l-1.2 2" ${STROKE}/>
    <path d="M17.5 20.5H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9z" ${STROKE}/>`,
  // bullet: capsule body, ogive tip, rim
  bullet: `
    <path d="M13.5 8.5H5a1.5 1.5 0 0 0-1.5 1.5v4A1.5 1.5 0 0 0 5 15.5h8.5" ${STROKE}/>
    <path d="M13.5 8.5v7" ${STROKE}/>
    <path d="M13.5 8.5c3 0 5.7 1.4 7.3 3.5-1.6 2.1-4.3 3.5-7.3 3.5" ${STROKE}/>`,
  // beam from an emitter into an impact flash
  laser: `
    <rect x="2.5" y="10" width="2.5" height="4" ${STROKE}/>
    <path d="M5 10.8 17.5 11.7" ${STROKE}/>
    <path d="M5 13.2 17.5 12.3" ${STROKE}/>
    <circle cx="18" cy="12" r="1" fill="#cfc" stroke="none"/>
    <path d="M20.2 12h2.3" ${STROKE}/>
    <path d="M19.8 9.7l1.7-1.4" ${STROKE}/>
    <path d="M19.8 14.3l1.7 1.4" ${STROKE}/>`,
  // grenade body with cross-hatch, cap and pin ring
  grenade: `
    <rect x="6.5" y="8.5" width="11" height="12" rx="4" ${STROKE}/>
    <path d="M12 8.5v12" ${STROKE}/>
    <path d="M6.5 14.5h11" ${STROKE}/>
    <rect x="10.25" y="5.5" width="3.5" height="3" ${STROKE}/>
    <path d="M13.9 6.2 16.6 4.9" ${STROKE}/>
    <circle cx="18.2" cy="4.4" r="1.7" ${STROKE}/>`,
  // wand: diagonal rod with plus-shaped sparkles at the tip
  wand: `
    <path d="M3.5 20.5 13.5 10.5" ${STROKE}/>
    <path d="M17 3.2v7.6" ${STROKE}/>
    <path d="M13.2 7h7.6" ${STROKE}/>
    <path d="M20.9 10.4v2.2" ${STROKE}/>
    <path d="M19.8 11.5h2.2" ${STROKE}/>
    <path d="M13.6 1.3v1.8" ${STROKE}/>
    <path d="M12.7 2.2h1.8" ${STROKE}/>`,
};

export function spellIconSvg(id: string): string {
  const inner = ICONS[id] ?? "";
  // xmlns is required when the SVG is loaded as an image (canvas HUD), harmless inline
  return `<svg xmlns="http://www.w3.org/2000/svg" class="spellicon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">${inner}</svg>`;
}

const imgCache = new Map<string, HTMLImageElement>();

// Rasterized icon for canvas drawImage; loads async, so callers must check
// img.complete before drawing.
export function spellIconImage(id: string): HTMLImageElement {
  let img = imgCache.get(id);
  if (!img) {
    img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(spellIconSvg(id))}`;
    imgCache.set(id, img);
  }
  return img;
}
