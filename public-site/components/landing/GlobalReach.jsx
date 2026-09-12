'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

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

// A convenience copy of the standard NASA "Blue Marble" texture that ships
// with the three.js examples (public domain imagery) — fine for local dev.
// For production, download it once and serve it from /public/textures/ so
// the globe isn't depending on threejs.org's uptime/bandwidth at runtime:
//   const EARTH_TEXTURE_URL = '/textures/earth.jpg';
const EARTH_TEXTURE_URL = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';

function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function Pin({ position, name, globeMeshRef }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color="#FF7B00" />
      </mesh>

      <Html
        occlude={globeMeshRef ? [globeMeshRef] : undefined}
        distanceFactor={8}
        style={{ pointerEvents: 'none', transition: 'opacity 0.25s ease' }}
      >
        <div className="relative -translate-x-1/2 -translate-y-[160%] whitespace-nowrap">
          <div className="rounded-sm border border-[#00E5FF]/40 bg-[#050505]/90 px-2 py-1 font-mono text-[10px] tracking-wide text-[#00E5FF]">
            {name}
          </div>
          <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-[#00E5FF]/40 bg-[#050505]/90" />
        </div>
      </Html>
    </group>
  );
}

function Globe({ spinning }) {
  const groupRef = useRef();
  const globeMeshRef = useRef();
  const texture = useLoader(THREE.TextureLoader, EARTH_TEXTURE_URL);

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
        <meshBasicMaterial map={texture} />
      </mesh>

      <mesh scale={1.01}>
        <sphereGeometry args={[GLOBE_RADIUS, 24, 18]} />
        <meshBasicMaterial color="#00E5FF" wireframe transparent opacity={0.12} />
      </mesh>

      {pins.map((pin) => (
        <Pin key={pin.name} position={pin.pos} name={pin.name} globeMeshRef={globeMeshRef} />
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
          <p className="mb-3 font-mono text-xs tracking-[0.2em] text-[#00E5FF]/70">
            SEC. 03 — GLOBAL REACH
          </p>
          <h2 className="font-display text-3xl text-white sm:text-4xl">
            Nine countries, one design standard
          </h2>
          <p className="mt-4 max-w-md text-white/60">
            From gas-gathering stations in India to switchyards in Senegal and water plants in
            Oman, every project follows the same IEEE, IEC, and IS-standard rigor.
          </p>
        </div>
        <div className="h-[360px] sm:h-[420px]">
          <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 1.5]}>
            <Suspense fallback={null}>
              <Globe spinning={inView} />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </section>
  );
}