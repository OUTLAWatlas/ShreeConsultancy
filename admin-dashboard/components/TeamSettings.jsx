import { TEAM } from '../lib/mockData';

export default function TeamSettings() {
  return (
    <div>
      <p className="mb-4 text-xs tracking-wide text-white/40">Org structure</p>

      <div className="border border-white/10">
        <div className="grid grid-cols-[1fr_160px_140px_140px_90px] gap-3 border-b border-white/10 px-3 py-2 text-[10px] tracking-wide text-white/30">
          <span>NAME</span>
          <span>ROLE</span>
          <span>CREDENTIAL</span>
          <span>DISCIPLINE</span>
          <span>DRAFTSMEN</span>
        </div>
        {TEAM.map((member) => (
          <div
            key={member.name}
            className="grid grid-cols-[1fr_160px_140px_140px_90px] gap-3 border-b border-white/5 px-3 py-2.5 text-xs last:border-b-0"
          >
            <span className="text-white/90">{member.name}</span>
            <span className="text-white/50">{member.role}</span>
            <span className="text-white/50">{member.credential}</span>
            <span className="text-white/50">{member.discipline}</span>
            <span className="tabular text-white/40">{member.draftsmen || '—'}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-white/30">
        This view is read-only for now — editing roles, adding logins for discipline leads, and
        assigning draftsmen to projects are natural next additions once more than one person needs
        access to this dashboard.
      </p>
    </div>
  );
}
