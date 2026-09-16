'use client';

import { useState } from 'react';
import { STAGES, formatINR } from '../lib/mockData';

export default function PipelineBoard({ projects, onMoveStage, onToggleBlocked, onOpenProject }) {
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
    <div className="board-scroll flex gap-px overflow-x-auto bg-white/10">
      {STAGES.map((stage) => {
        const stageProjects = projects.filter((p) => p.stage === stage);
        const stageValue = stageProjects.reduce((sum, p) => sum + p.value, 0);
        const isDragOver = dragOverStage === stage;

        return (
          <div
            key={stage}
            className={`flex min-h-[calc(100vh-224px)] min-w-[240px] flex-1 flex-col bg-ink transition-colors ${
              isDragOver ? 'bg-cyan/[0.04]' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage);
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="border-b border-white/10 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs tracking-wide text-white/60">{stage}</p>
                <span className="tabular text-[10px] text-white/30">{stageProjects.length}</span>
              </div>
              <p className="mt-0.5 tabular text-[10px] text-white/30">
                {stageValue > 0 ? formatINR(stageValue) : '—'}
              </p>
            </div>

            <div className="flex-1 space-y-2 p-2">
              {stageProjects.length === 0 && (
                <p className="px-1 py-3 text-center text-[10px] text-white/20">no projects</p>
              )}
              {stageProjects.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.id)}
                  onClick={() => onOpenProject(card.id)}
                  className={`cursor-pointer border bg-panel p-3 text-xs transition-colors ${
                    card.blocked ? 'border-amber/50' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white/90">{card.title}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBlocked(card.id);
                      }}
                      title={card.blocked ? 'Marked blocked — click to clear' : 'Mark as blocked'}
                      className={`shrink-0 border px-1.5 py-0.5 text-[10px] ${
                        card.blocked
                          ? 'border-amber text-amber'
                          : 'border-white/15 text-white/30 hover:text-white/60'
                      }`}
                    >
                      blocked
                    </button>
                  </div>
                  <p className="mt-1 text-white/40">{card.client}</p>
                  <p className="mt-1 tabular text-white/60">{formatINR(card.value)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}