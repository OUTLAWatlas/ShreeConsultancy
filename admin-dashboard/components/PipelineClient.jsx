'use client';

import { useState } from 'react';
import { formatINR } from '../lib/mockData';
import PipelineBoard from './PipelineBoard';
import ProjectDrawer from './ProjectDrawer';
import NewProjectModal from './NewProjectModal';
import { useCanWrite } from './RoleContext';

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
    ledger: (p.ledgerEntries || []).map((e) => ({ id: e.id, item: e.item, amount: e.amount })),
    documents: { proposal: p.proposalGenerated, invoice: p.invoiceGenerated },
  };
}

export default function PipelineClient({ initialProjects }) {
  const [projects, setProjects] = useState(initialProjects.map(toClientShape));
  const canWrite = useCanWrite();
  const [selectedId, setSelectedId] = useState(null);
  const [syncError, setSyncError] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);

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

  function addProject(project) {
    setProjects((prev) => [toClientShape(project), ...prev]);
  }

  return (
    <div className="-m-6">
      {syncError && (
        <p className="border-b border-warn/40 bg-warn/10 px-4 py-2 text-xs text-warn">
          {syncError}
        </p>
      )}

      <div className="flex items-center justify-between border-b border-fg/10 px-4 py-2">
        <p className="text-xs tracking-wide text-fg/40">Pipeline</p>
        {canWrite && (
        <button
          onClick={() => setShowNewProject(true)}
          className="border border-fg/15 px-2 py-1 text-xs text-fg/60 hover:border-accent/50 hover:text-accent"
        >
          + new project
        </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px bg-fg/10 sm:grid-cols-4">
        <Stat label="Open projects" value={openProjects.length} />
        <Stat label="Active pipeline value" value={formatINR(activeValue)} />
        <Stat
          label="Blocked"
          value={blockedCount}
          accent={blockedCount > 0 ? 'warn' : undefined}
        />
        <Stat label="Closed value" value={formatINR(closedValue)} />
      </div>

      <PipelineBoard
        projects={projects}
        onMoveStage={moveStage}
        onToggleBlocked={toggleBlocked}
        onOpenProject={setSelectedId}
        canWrite={canWrite}
      />

      <ProjectDrawer
        project={selectedProject}
        onClose={() => setSelectedId(null)}
        onAddLedgerItem={addLedgerItem}
        onMarkDocument={markDocument}
      />

      {showNewProject && (
        <NewProjectModal onClose={() => setShowNewProject(false)} onCreated={addProject} />
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="bg-bg px-4 py-3">
      <p className="text-[10px] tracking-wide text-fg/30">{label}</p>
      <p className={`mt-1 tabular text-lg ${accent === 'warn' ? 'text-warn' : 'text-fg/90'}`}>
        {value}
      </p>
    </div>
  );
}