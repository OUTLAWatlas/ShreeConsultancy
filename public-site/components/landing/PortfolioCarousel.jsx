'use client';

import { useEffect, useMemo, useRef } from 'react';
import { projects } from '../../data/projects';

const LOOP_COPIES = 3;

function ProjectCard({ project, cardRef }) {
  return (
    <article
      ref={cardRef}
      style={{
        transform:
          'translateZ(calc((var(--depth, 0.4) - 0.4) * 60px)) scale(calc(0.9 + var(--depth, 0.4) * 0.1))',
        opacity: 'calc(0.55 + var(--depth, 0.4) * 0.45)',
      }}
      className="group relative w-[300px] shrink-0 snap-center rounded-sm border border-white/10 bg-[#0A0A0C] p-6 transition-[transform,opacity,border-color,box-shadow] duration-300 ease-out hover:z-10 hover:border-[#00E5FF]/40 hover:shadow-[0_20px_60px_-20px_rgba(0,229,255,0.3)] sm:w-[340px]"
    >
      <div className="transition-transform duration-300 ease-out group-hover:-translate-y-1">
        <p className="font-mono text-xs text-[#00E5FF]">
          {project.year} — {project.location}
        </p>

        <h3 className="mt-3 font-display text-xl text-white">{project.company}</h3>
        <p className="mt-1 text-sm text-white/50">
          {project.name}
          {project.context && <span className="text-white/30"> · {project.context}</span>}
        </p>

        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:mt-4 group-hover:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <p className="text-sm leading-relaxed text-white/60">{project.scope}</p>
            {project.value && (
              <p className="mt-3 font-mono text-[11px] text-white/30">
                PO value: ₹{Number(project.value).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PortfolioCarousel() {
  const trackRef = useRef(null);
  const cardsRef = useRef([]);

  // Three identical copies of the list back-to-back. The middle copy is
  // where we start and where snapping/depth-fade get computed; the outer
  // two exist purely so there's always real content to scroll into in
  // either direction, which is what makes the loop feel seamless.
  const displayProjects = useMemo(
    () =>
      Array.from({ length: LOOP_COPIES }, (_, copy) =>
        projects.map((p) => ({ ...p, _key: `${copy}-${p.company}-${p.name}` }))
      ).flat(),
    []
  );

  // Fade-by-depth effect for cards scrolling into/out of view.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.style.setProperty('--depth', entry.intersectionRatio.toFixed(3));
        });
      },
      { root: track, threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    );

    cardsRef.current.forEach((card) => card && observer.observe(card));
    return () => observer.disconnect();
  }, []);

  // Start centered in the middle copy so there's room to scroll both ways
  // immediately, without a visible jump on first load.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const id = requestAnimationFrame(() => {
      track.scrollLeft = track.scrollWidth / LOOP_COPIES;
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // The actual loop: once scroll position strays into the first or third
  // copy, silently re-center it into the middle copy by exactly one copy's
  // width. Since all three copies render identical cards, this jump is
  // invisible — it only changes the numeric scrollLeft, not what's on screen.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function onScroll() {
      const oneSetWidth = track.scrollWidth / LOOP_COPIES;
      if (track.scrollLeft < oneSetWidth * 0.5) {
        track.scrollLeft += oneSetWidth;
      } else if (track.scrollLeft > oneSetWidth * 1.5) {
        track.scrollLeft -= oneSetWidth;
      }
    }

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  // Plain vertical wheel drives horizontal scroll, eased rather than jumped.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function onWheel(e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        track.scrollBy({ left: e.deltaY, behavior: 'smooth' });
      }
    }

    track.addEventListener('wheel', onWheel, { passive: false });
    return () => track.removeEventListener('wheel', onWheel);
  }, []);

  // Click-and-drag as a secondary way to move it.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let dragging = false;
    let startX = 0;
    let startScroll = 0;

    function onPointerDown(e) {
      dragging = true;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.style.cursor = 'grabbing';
    }
    function onPointerMove(e) {
      if (!dragging) return;
      track.scrollLeft = startScroll - (e.clientX - startX);
    }
    function stopDragging() {
      dragging = false;
      track.style.cursor = '';
    }

    track.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDragging);
    return () => {
      track.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDragging);
    };
  }, []);

  return (
    <section id="work" className="scroll-mt-24 py-28">
      <div className="mx-auto mb-12 max-w-7xl px-6 lg:px-10">
        <p className="mb-3 font-mono text-xs tracking-[0.2em] text-[#00E5FF]/70">
          SEC. 04 — PORTFOLIO
        </p>
        <h2 className="font-display text-3xl text-white sm:text-4xl">Work on the ground</h2>
        <p className="mt-4 max-w-xl text-white/60">
          The twelve largest engagements, across India, the Middle East, and Africa. Scroll or
          drag to browse, hover a card for the full scope.
        </p>
      </div>

      <div
        ref={trackRef}
        className="scrollbar-none flex cursor-grab snap-x snap-mandatory items-start gap-6 overflow-x-auto px-6 pb-8 [overscroll-behavior-x:contain] [perspective:1400px] lg:px-10"
      >
        {displayProjects.map((project, i) => (
          <ProjectCard
            key={project._key}
            project={project}
            cardRef={(el) => {
              cardsRef.current[i] = el;
            }}
          />
        ))}
      </div>
    </section>
  );
}