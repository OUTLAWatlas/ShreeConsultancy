'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useThemeColors, useThemeName } from '../../hooks/useThemeColors';
import SceneBoundary from '../SceneBoundary';

// Real countries the firm has delivered projects in (see data/projects.js).
const LOCATIONS = [
  { name: 'India', lat: 21, lon: 78 },
  { name: 'Tanzania', lat: -6, lon: 35 },
  { name: 'Oman', lat: 21, lon: 57 },
  { name: 'Ghana', lat: 8, lon: -1 },
  { name: 'Congo', lat: -1, lon: 15 },
  { name: 'Namibia', lat: -22, lon: 17 },
  { name: 'Nigeria', lat: 9, lon: 8 },
  { name: 'Senegal', lat: 14, lon: -14 },
  { name: 'Bangladesh', lat: 24, lon: 90 },
];

const GLOBE_RADIUS = 2.4;

// Served from this site's own /public, not hotlinked.
//
// Previously this pointed at threejs.org's example texture, which meant the
// globe depended on a third party's uptime and willingness to serve our
// traffic — and because the loader threw on failure, a blocked or slow
// request took the entire landing page down with it. Both halves of that
// are fixed: the file is ours, and a missing file now degrades to a
// wireframe globe (see useEarthTexture below) rather than throwing.
//
// If /public/textures/earth.jpg is absent the globe still renders, just
// untextured. See public-site/README.md for where to get the file.
const EARTH_TEXTURE_URL = '/textures/earth.jpg';

// Deliberately not useLoader(): that suspends and then throws on error,
// which is exactly the behaviour that used to break the page. Loading it
// by hand keeps failure local and recoverable.
function useEarthTexture(url) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    let disposed = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (loaded) => {
        if (disposed) loaded.dispose();
        else setTexture(loaded);
      },
      undefined,
      () => {
        // Expected when the texture hasn't been added yet — the wireframe
        // fallback is a reasonable look, so don't make noise about it.
        console.info('Earth texture unavailable; rendering an untextured globe.');
      }
    );
    return () => {
      disposed = true;
    };
  }, [url]);

  return texture;
}

function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function Pin({ position, name, globeMeshRef, color }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      <Html
        occlude={globeMeshRef ? [globeMeshRef] : undefined}
        distanceFactor={8}
        style={{ pointerEvents: 'none', transition: 'opacity 0.25s ease' }}
      >
        <div className="relative -translate-x-1/2 -translate-y-[160%] whitespace-nowrap">
          <div className="rounded-sm border border-accent/40 bg-bg-deep/90 px-2 py-1 font-mono text-[10px] tracking-wide text-accent">
            {name}
          </div>
          <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-accent/40 bg-bg-deep/90" />
        </div>
      </Html>
    </group>
  );
}

function Globe({ spinning }) {
  const groupRef = useRef();
  // WebGL materials can't read CSS variables, so pull the live token
  // values and fall back to the dark-theme colours for the first frame
  // before they resolve.
  const themeColors = useThemeColors();
  const isLight = useThemeName() === 'light';
  const colors = { ...{ accent: '#00E5FF', warn: '#FF7B00' }, ...themeColors };
  const globeMeshRef = useRef();
  const texture = useEarthTexture(EARTH_TEXTURE_URL);

  const pins = useMemo(
    () =>
      LOCATIONS.map((loc) => ({
        ...loc,
        pos: latLonToVec3(loc.lat, loc.lon, GLOBE_RADIUS + 0.015),
      })),
    []
  );

  useFrame((_, delta) => {
    if (groupRef.current && spinning) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={globeMeshRef}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        {texture ? (
          <meshBasicMaterial map={texture} />
        ) : (
          // No texture: a solid dim sphere still occludes the back-face
          // pins correctly, so the wireframe above reads as a globe.
          <meshBasicMaterial color={colors.bg ?? '#0A0A0C'} />
        )}
      </mesh>

      <mesh scale={1.01}>
        <sphereGeometry args={[GLOBE_RADIUS, 24, 18]} />
        <meshBasicMaterial color={colors.accent} wireframe transparent opacity={isLight ? 0.28 : 0.12} />
      </mesh>

      {pins.map((pin) => (
        <Pin
          key={pin.name}
          position={pin.pos}
          name={pin.name}
          globeMeshRef={globeMeshRef}
          color={colors.warn}
        />
      ))}
    </group>
  );
}

export default function GlobalReach() {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative mx-auto max-w-7xl px-6 py-28 lg:px-10">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="mb-3 font-mono text-xs tracking-[0.2em] text-accent/70">
            SEC. 03 — GLOBAL REACH
          </p>
          <h2 className="font-display text-3xl text-fg sm:text-4xl">
            Nine countries, one design standard
          </h2>
          <p className="mt-4 max-w-md text-fg/60">
            From gas-gathering stations in India to switchyards in Senegal and water plants in
            Oman, every project follows the same IEEE, IEC, and IS-standard rigor.
          </p>
        </div>
        <div className="h-[360px] sm:h-[420px]">
          <SceneBoundary
            fallback={
              <div className="flex h-full items-center justify-center text-center">
                <p className="max-w-xs font-mono text-xs text-fg/40">
                  India · Tanzania · Oman · Ghana · Congo · Namibia · Nigeria · Senegal ·
                  Bangladesh
                </p>
              </div>
            }
          >
            <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 1.5]}>
              <Suspense fallback={null}>
                <Globe spinning={inView} />
              </Suspense>
            </Canvas>
          </SceneBoundary>
        </div>
      </div>
    </section>
  );
}