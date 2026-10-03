export default function TeamSettings({ team = [] }) {
  return (
    <div>
      <p className="mb-4 text-xs tracking-wide text-fg/40">Org structure</p>

      <div className="border border-fg/10">
        <div className="grid grid-cols-[1fr_160px_140px_140px_90px] gap-3 border-b border-fg/10 px-3 py-2 text-[10px] tracking-wide text-fg/30">
          <span>NAME</span>
          <span>ROLE</span>
          <span>CREDENTIAL</span>
          <span>DISCIPLINE</span>
          <span>DRAFTSMEN</span>
        </div>

        {team.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-fg/30">
            No team members on file — seed the database or add them directly.
          </p>
        )}

        {team.map((member) => (
          <div
            key={member.id ?? member.name}
            className="grid grid-cols-[1fr_160px_140px_140px_90px] gap-3 border-b border-fg/5 px-3 py-2.5 text-xs last:border-b-0"
          >
            <span className="text-fg/90">{member.name}</span>
            <span className="text-fg/50">{member.role}</span>
            <span className="text-fg/50">{member.credential}</span>
            <span className="text-fg/50">{member.discipline}</span>
            <span className="tabular text-fg/40">{member.draftsmen || '—'}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-fg/30">
        This view is read-only — editing roles and assigning draftsmen to projects are natural next
        additions. Note this is the org chart, separate from dashboard logins, which are managed
        with <span className="text-fg/50">npm run create-admin</span> in the backend.
      </p>
    </div>
  );
}
