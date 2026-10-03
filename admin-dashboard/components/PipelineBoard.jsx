'use client';

import { useState } from 'react';
import { STAGES, formatINR } from '../lib/mockData';

export default function PipelineBoard({
  projects,
  onMoveStage,
  onToggleBlocked,
  onOpenProject,
  canWrite = true,
}) {
  const [dragOverStage, setDragOverStage] = useState(null);

  function handleDragStart(e, projectId) {
    e.dataTransfer.setData('text/plain', String(projectId));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDrop(e, stage) {
    e.preventDefault();
    setDragOverStage(null);
    const projectId = Number(e.dataTransfer.getData('text/plain'));
    if (projectId) onMoveStage(projectId, stage);
  }

  return (
    <div className="board-scroll flex gap-px overflow-x-auto bg-fg/10">
      {STAGES.map((stage) => {
        const stageProjects = projects.filter((p) => p.stage === stage);
        const stageValue = stageProjects.reduce((sum, p) => sum + p.value, 0);
        const isDragOver = dragOverStage === stage;

        return (
          <div
            key={stage}
            className={`flex min-h-[calc(100vh-224px)] min-w-[240px] flex-1 flex-col bg-bg transition-colors ${
              isDragOver ? 'bg-accent/[0.04]' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage);
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="border-b border-fg/10 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs tracking-wide text-fg/60">{stage}</p>
                <span className="tabular text-[10px] text-fg/30">{stageProjects.length}</span>
              </div>
              <p className="mt-0.5 tabular text-[10px] text-fg/30">
                {stageValue > 0 ? formatINR(stageValue) : '—'}
              </p>
            </div>

            <div className="flex-1 space-y-2 p-2">
              {stageProjects.length === 0 && (
                <p className="px-1 py-3 text-center text-[10px] text-fg/20">no projects</p>
              )}
              {stageProjects.map((card) => (
                <div
                  key={card.id}
                  draggable={canWrite}
                  onDragStart={(e) => handleDragStart(e, card.id)}
                  onClick={() => onOpenProject(card.id)}
                  className={`cursor-pointer border bg-surface p-3 text-xs transition-colors ${
                    card.blocked ? 'border-warn/50' : 'border-fg/10 hover:border-fg/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-fg/90">{card.title}</p>
                    {/* Viewers still see the blocked flag — it's useful
                        status — they just can't change it. */}
                    <button
                      disabled={!canWrite}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBlocked(card.id);
                      }}
                      title={
                        canWrite
                          ? card.blocked
                            ? 'Marked blocked — click to clear'
                            : 'Mark as blocked'
                          : card.blocked
                            ? 'Marked blocked'
                            : ''
                      }
                      className={`shrink-0 border px-1.5 py-0.5 text-[10px] ${
                        card.blocked
                          ? 'border-warn text-warn'
                          : 'border-fg/15 text-fg/30 enabled:hover:text-fg/60'
                      } ${!canWrite && !card.blocked ? 'invisible' : ''}`}
                    >
                      blocked
                    </button>
                  </div>
                  <p className="mt-1 text-fg/40">{card.client}</p>
                  <p className="mt-1 tabular text-fg/60">{formatINR(card.value)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}