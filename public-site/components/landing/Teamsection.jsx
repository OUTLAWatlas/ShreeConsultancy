import { founder, pillars } from '../../data/team';
import PersonPhoto from './PersonPhoto';

export default function TeamSection() {
  return (
    <section id="team" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-28 lg:px-10">
      {/* Heading row. The right column has no visible content of its own —
          it exists so the photo below has a column to sit in beside the
          heading — so its height simply stretches to match the heading
          column (grid's default), giving us a reliable anchor point at
          "the bottom of the heading text" without guessing pixel values. */}
      <div className="mb-6 grid gap-8 lg:grid-cols-2">
        <div className="max-w-xl">
          <p className="mb-3 font-mono text-xs tracking-[0.2em] text-[#00E5FF]/70">
            SEC. 02 — TEAM
          </p>
          <h2 className="font-display text-3xl text-white sm:text-4xl">Meet the team</h2>
          <p className="mt-4 text-white/60">
            Every engagement is led personally by our founder and delivered by three named
            discipline heads — each backed by their own dedicated drafting team.
          </p>
        </div>

        <div className="relative hidden lg:block">
          {/* Hangs 64px below this column's bottom edge (a modest, fixed
              overlap into the card below) and extends 256px upward from
              there — reaching up into the blank space beside the heading.
              Adjust -bottom/h- together if you change the photo's crop. */}
          <div className="absolute -bottom-16 right-0 z-20 h-64 w-52">
            <PersonPhoto
              src={founder.photo}
              alt={founder.name}
              accent="#00E5FF"
              className="h-full w-full object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,229,255,0.15)]"
            />
          </div>
        </div>
      </div>

      <div className="group relative rounded-sm border border-[#00E5FF]/20 bg-gradient-to-b from-[#0A0A0C] to-[#050505] p-8 sm:p-10">
        <div className="mb-4 h-16 w-16 lg:hidden">
          <PersonPhoto
            src={founder.photo}
            alt={founder.name}
            accent="#00E5FF"
            className="h-full w-full object-contain object-bottom"
          />
        </div>

        <p className="font-mono text-xs text-[#00E5FF]">{founder.role}</p>
        <h3 className="mt-2 font-display text-2xl text-white">{founder.name}</h3>
        <p className="mt-1 text-sm text-white/50">{founder.credential}</p>

        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:mt-4 group-hover:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <p className="max-w-2xl text-sm leading-relaxed text-white/70">{founder.bio}</p>
          </div>
        </div>
      </div>

      <div className="relative mt-8">
        <div className="absolute left-1/2 top-0 hidden h-8 w-px -translate-x-1/2 -translate-y-8 bg-white/15 lg:block" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.name}
              className="group relative rounded-sm border border-white/10 bg-[#0A0A0C] p-6 transition-colors hover:border-[#FF7B00]/40"
            >
              <p className="font-mono text-xs text-[#FF7B00]">{p.discipline}</p>
              <h4 className="mt-2 font-display text-lg text-white">{p.name}</h4>
              <p className="text-sm text-white/50">{p.credential}</p>

              <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:mt-4 group-hover:grid-rows-[1fr]">
                <div className="overflow-hidden">
                  <p className="text-sm leading-relaxed text-white/60">{p.focus}</p>
                  <p className="mt-4 border-t border-white/10 pt-4 text-xs text-white/40">
                    Drafting — {p.draftsman}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}