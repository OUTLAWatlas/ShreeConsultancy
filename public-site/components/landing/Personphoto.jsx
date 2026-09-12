'use client';

import { useState } from 'react';

// Renders a borderless cutout photo. If the image at `src` fails to load
// (or no src is given), falls back to a simple tinted silhouette so the
// layout still looks intentional before real team photos are added.
//
// Expects transparent-background PNGs (a bust/half-body cutout, not a
// square headshot) so the "breaking out of the card" treatment in
// TeamSection.jsx reads correctly — a rectangular photo with a visible
// background edge will look like a mistake in that spot.
export default function PersonPhoto({ src, alt, accent = '#00E5FF', className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-end justify-center ${className}`} aria-hidden="true">
        <svg viewBox="0 0 100 140" className="h-full w-full" style={{ color: accent }}>
          <circle
            cx="50"
            cy="38"
            r="26"
            fill="currentColor"
            opacity="0.15"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
          <path
            d="M10 138 C10 95 28 74 50 74 C72 74 90 95 90 138 Z"
            fill="currentColor"
            opacity="0.12"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- variable aspect
  // ratio cutouts with drop-shadow filters are simplest as a plain <img>.
  return <img src={src} alt={alt} onError={() => setFailed(true)} className={className} />;
}