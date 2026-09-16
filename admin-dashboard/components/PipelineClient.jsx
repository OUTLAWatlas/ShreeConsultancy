'use client';

import { useState } from 'react';
import { formatINR } from '../lib/mockData';
import PipelineBoard from './PipelineBoard';
import ProjectDrawer from './ProjectDrawer';

// Prisma's shape (ledgerEntries, proposalGenerated, invoiceGenerated) is
// translated to the shape the board/drawer components already expect
// (ledger, documents.proposal/invoice) here, in one place, so those
// components don't need to know or care that a database exists.
function toClientShape(p) {
  return {
    id: p.id,
    stage: p.stage,
    title: p.title,
    client: p.client,
    value: p.value,
    blocked: p.blocked,
    discipline: p.discipline,
    contactEmail: p.contactEmail || '',
    ledger: p.ledgerEntries.map((e) => ({ id: e.id, item: e.item, amount: e.amount })),
    documents: { proposal: p.proposalGenerated, invoice: p.invoiceGenerated },
  };
}

export default function PipelineClient({ initialProjects }) {
  const [projects, setProjects] = useState(initialProjects.map(toClientShape));
  const [selectedId, setSelectedId] = useState(null);
  const [syncError, setSyncError] = useState('');

  const selectedProject = projects.find((p) => p.id === selectedId) || null;

  const openProjects = projects.filter((p) => p.stage !== 'Closed');
  const activeValue = openProjects.reduce((sum, p) => sum + p.value, 0);
  const blockedCount = projects.filter((p) => p.blocked).length;
  const closedValue = projects
    .filter((p) => p.stage === 'Closed')
    .reduce((sum, p) => sum + p.value, 0);

  async function patchProject(id, data) {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setSyncError('');
    } catch {
      setSyncError('A change didn\u2019t save — check your connection and try again.');
    }
  }

  function moveStage(projectId, stage) {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, stage } : p)));
    patchProject(projectId, { stage });
  }

  function toggleBlocked(projectId) {
    const project = projects.find((p) => p.id === projectId);
    const blocked = !project.blocked;
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, blocked } : p)));
    patchProject(projectId, { blocked });
  }

  async function addLedgerItem(projectId, entry) {
    const pendingId = `pending-${Date.now()}`;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, ledger: [...p.ledger, { id: pendingId, ...entry }] } : p
      )
    );
    try {
      const res = await fetch(`/api/projects/${projectId}/ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error();
      const { entry: saved } = await res.json();
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, ledger: p.ledger.map((row) => (row.id === pendingId ? saved : row)) }
            : p
        )
      );
      setSyncError('');
    } catch {
      setSyncError('A change didn\u2019t save — check your connection and try again.');
    }
  }

  function markDocument(projectId, kind) {
    const field = kind === 'proposal' ? 'proposalGenerated' : 'invoiceGenerated';
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, documents: { ...p.documents, [kind]: true } } : p
      )
    );
    patchProject(projectId, { [field]: true });
  }

  return (
    <div className="-m-6">
      {syncError && (
        <p className="border-b border-amber/40 bg-amber/10 px-4 py-2 text-xs text-amber">
          {syncError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
        <Stat label="Open projects" value={openProjects.length} />
        <Stat label="Active pipeline value" value={formatINR(activeValue)} />
        <Stat
          label="Blocked"
          value={blockedCount}
          accent={blockedCount > 0 ? 'amber' : undefined}
        />
        <Stat label="Closed value" value={formatINR(closedValue)} />
      </div>

      <PipelineBoard
        projects={projects}
        onMoveStage={moveStage}
        onToggleBlocked={toggleBlocked}
        onOpenProject={setSelectedId}
      />

      <ProjectDrawer
        project={selectedProject}
        onClose={() => setSelectedId(null)}
        onAddLedgerItem={addLedgerItem}
        onMarkDocument={markDocument}
      />
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="bg-ink px-4 py-3">
      <p className="text-[10px] tracking-wide text-white/30">{label}</p>
      <p className={`mt-1 tabular text-lg ${accent === 'amber' ? 'text-amber' : 'text-white/90'}`}>
        {value}
      </p>
    </div>
  );
}