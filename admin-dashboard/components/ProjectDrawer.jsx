'use client';

import { useEffect, useState } from 'react';
import { formatINR } from '../lib/mockData';
import { useCanWrite } from './RoleContext';

const KIND_LABEL = { cad: 'CAD file', proposal: 'Proposal PDF', invoice: 'Final Invoice PDF' };

export default function ProjectDrawer({ project, onClose, onAddLedgerItem, onMarkDocument }) {
  const canWrite = useCanWrite();
  const [ledgerDraft, setLedgerDraft] = useState({ item: '', amount: '' });
  const [status, setStatus] = useState('');
  const [generating, setGenerating] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchForm, setDispatchForm] = useState(null); // null until opened

  // Files persisted in object storage: CAD uploads plus every generated
  // PDF. Fetched fresh whenever a project's drawer opens, which is what
  // lets a proposal generated weeks ago still be attached today.
  const [files, setFiles] = useState([]);
  const [filesNote, setFilesNote] = useState('');

  const projectId = project?.id;

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    setFiles([]);
    setFilesNote('');
    setStatus('');

    fetch(`/api/projects/${projectId}/files`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not load files.');
        return data;
      })
      .then((data) => {
        if (!cancelled) setFiles(data.files || []);
      })
      .catch((err) => {
        // Storage being unconfigured is an expected state, not a failure —
        // say so plainly instead of showing a scary error.
        if (!cancelled) setFilesNote(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (!project) return null;

  const ledgerTotal = project.ledger.reduce((sum, row) => sum + row.amount, 0);

  function handleAddLedgerItem(e) {
    e.preventDefault();
    const amount = Number(ledgerDraft.amount);
    if (!ledgerDraft.item || !amount) return;
    onAddLedgerItem(project.id, { item: ledgerDraft.item, amount });
    setLedgerDraft({ item: '', amount: '' });
  }

  async function handleGenerate(kind) {
    setGenerating(kind);
    setStatus('');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      const title = kind === 'proposal' ? 'PROPOSAL' : 'FINAL INVOICE';
      doc.setFont('courier', 'normal');
      doc.setFontSize(16);
      doc.text('Shree Consultancy', 14, 20);
      doc.setFontSize(11);
      doc.text(title, 14, 30);
      doc.setFontSize(10);
      doc.text(`Project: ${project.title}`, 14, 42);
      doc.text(`Client: ${project.client}`, 14, 49);
      doc.text(`Discipline: ${project.discipline}`, 14, 56);

      let y = 70;
      doc.text('Line items:', 14, y);
      y += 8;
      if (kind === 'proposal') {
        doc.text('Base scope of work', 18, y);
        doc.text(formatINR(project.value), 160, y);
        y += 8;
      } else {
        project.ledger.forEach((row) => {
          doc.text(row.item, 18, y);
          doc.text(formatINR(row.amount), 160, y);
          y += 8;
        });
        doc.text('Base scope of work', 18, y);
        doc.text(formatINR(project.value), 160, y);
        y += 8;
      }

      y += 4;
      const total = kind === 'proposal' ? project.value : project.value + ledgerTotal;
      doc.setFontSize(11);
      doc.text(`Total: ${formatINR(total)}`, 14, y + 4);

      const filename = `${kind}-${project.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      doc.save(filename); // the local download always works, storage or not

      onMarkDocument(project.id, kind); // a DB flag, independent of storage

      // Best-effort persistence. If storage isn't configured this fails,
      // and that's fine — the download above already succeeded, so say
      // what the user actually lost rather than claiming an error.
      try {
        const res = await fetch(`/api/projects/${project.id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind, filename, contentBase64: doc.output('datauristring') }),
        });
        if (!res.ok) throw new Error();
        const { file } = await res.json();
        setFiles((prev) => [file, ...prev]);
        setStatus(`Generated and saved ${filename}.`);
      } catch {
        setStatus(`Generated ${filename} — downloaded, but not saved to the project (storage isn’t configured).`);
      }
    } catch (err) {
      setStatus('Could not generate the PDF — see the browser console for details.');
      console.error(err);
    } finally {
      setGenerating(null);
    }
  }

  async function handleCadUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // so picking the same file again still fires
    if (!file) return;

    setUploading(true);
    setStatus('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/projects/${project.id}/files`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      setFiles((prev) => [data.file, ...prev]);
      setStatus(`Uploaded ${file.name}.`);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(file) {
    try {
      const res = await fetch(`/api/projects/${project.id}/files/download?fileId=${file.id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not get a download link.');
      window.open(data.url, '_blank', 'noopener');
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function handleDeleteFile(file) {
    const previous = files;
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    try {
      const res = await fetch(`/api/projects/${project.id}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFiles(previous);
      setStatus('Could not delete that file.');
    }
  }

  function openDispatchForm() {
    const preferred =
      files.find((f) => f.kind === 'invoice') || files.find((f) => f.kind === 'proposal');
    setDispatchForm({
      to: project.contactEmail || '',
      subject: `Regarding ${project.title}`,
      message:
        `Hi,\n\nPlease find the ${preferred ? KIND_LABEL[preferred.kind].toLowerCase() : 'update'} for ` +
        `${project.title} ${preferred ? 'attached' : 'below'}.\n\nBest,\nShree Consultancy`,
      fileId: preferred ? String(preferred.id) : '',
    });
    setStatus('');
  }

  async function handleDispatch(e) {
    e.preventDefault();
    setDispatching(true);
    setStatus('');
    try {
      const res = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: dispatchForm.to,
          subject: dispatchForm.subject,
          message: dispatchForm.message.replace(/\n/g, '<br/>'),
          fileId: dispatchForm.fileId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Dispatch failed.');
      setStatus(`Sent to ${dispatchForm.to}.`);
      setDispatchForm(null);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setDispatching(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-fg/10 bg-bg p-6 text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs text-fg/40">{project.stage}</p>
            <h2 className="mt-1 text-base text-fg">{project.title}</h2>
            <p className="mt-1 text-xs text-fg/50">
              {project.client} — {project.discipline}
            </p>
          </div>
          <button onClick={onClose} className="text-xs text-fg/40 hover:text-fg">
            close
          </button>
        </div>

        <section className="mb-6">
          <p className="mb-2 text-xs tracking-wide text-fg/40">Base scope value</p>
          <p className="tabular text-lg">{formatINR(project.value)}</p>
        </section>

        <section className="mb-6 border-t border-fg/10 pt-4">
          <p className="mb-2 text-xs tracking-wide text-fg/40">Subcontractor ledger</p>
          <div className="space-y-1.5">
            {project.ledger.length === 0 && (
              <p className="text-xs text-fg/30">No expenses logged yet.</p>
            )}
            {project.ledger.map((row) => (
              <div key={row.id} className="flex justify-between text-xs text-fg/70">
                <span>{row.item}</span>
                <span className="tabular">{formatINR(row.amount)}</span>
              </div>
            ))}
            {project.ledger.length > 0 && (
              <div className="flex justify-between border-t border-fg/10 pt-1.5 text-xs text-fg/90">
                <span>Ledger total</span>
                <span className="tabular">{formatINR(ledgerTotal)}</span>
              </div>
            )}
          </div>

          {canWrite && (
            <form onSubmit={handleAddLedgerItem} className="mt-3 flex gap-2">
              <input
                placeholder="expense description"
                value={ledgerDraft.item}
                onChange={(e) => setLedgerDraft((d) => ({ ...d, item: e.target.value }))}
                className="min-w-0 flex-1 border border-fg/15 bg-transparent px-2 py-1.5 text-xs placeholder:text-fg/30 focus:border-accent focus:outline-none"
              />
              <input
                placeholder="₹"
                inputMode="numeric"
                value={ledgerDraft.amount}
                onChange={(e) => setLedgerDraft((d) => ({ ...d, amount: e.target.value }))}
                className="w-20 border border-fg/15 bg-transparent px-2 py-1.5 text-xs placeholder:text-fg/30 focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 border border-fg/15 px-2 py-1.5 text-xs text-fg/60 hover:text-fg"
              >
                add
              </button>
            </form>
          )}
        </section>

        {canWrite && (
          <section className="mb-6 border-t border-fg/10 pt-4">
            <p className="mb-2 text-xs tracking-wide text-fg/40">Document engine</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerate('proposal')}
                disabled={generating === 'proposal'}
                className="flex-1 border border-fg/15 px-2 py-2 text-xs text-fg/80 hover:border-accent/50 hover:text-accent disabled:opacity-50"
              >
                {generating === 'proposal' ? 'generating…' : 'Generate Proposal PDF'}
                {project.documents.proposal && <span className="ml-1 text-fg/30">✓</span>}
              </button>
              <button
                onClick={() => handleGenerate('invoice')}
                disabled={generating === 'invoice'}
                className="flex-1 border border-fg/15 px-2 py-2 text-xs text-fg/80 hover:border-accent/50 hover:text-accent disabled:opacity-50"
              >
                {generating === 'invoice' ? 'generating…' : 'Generate Final Invoice PDF'}
                {project.documents.invoice && <span className="ml-1 text-fg/30">✓</span>}
              </button>
            </div>
          </section>
        )}

        <section className="mb-6 border-t border-fg/10 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs tracking-wide text-fg/40">Files</p>
            {canWrite && (
              <label className="cursor-pointer border border-fg/15 px-2 py-1 text-[10px] text-fg/50 hover:text-fg">
                {uploading ? 'uploading…' : '+ upload CAD file'}
                <input
                  type="file"
                  onChange={handleCadUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {filesNote && <p className="text-[10px] text-fg/30">{filesNote}</p>}
          {!filesNote && files.length === 0 && (
            <p className="text-[10px] text-fg/30">No files yet.</p>
          )}

          <div className="space-y-1">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => handleDownload(file)}
                  className="truncate text-left text-fg/70 hover:text-accent"
                >
                  {file.filename}
                </button>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-[10px] text-fg/30">
                    {KIND_LABEL[file.kind] || file.kind}
                  </span>
                  {canWrite && (
                    <button
                      onClick={() => handleDeleteFile(file)}
                      aria-label={`Delete ${file.filename}`}
                      className="text-fg/30 hover:text-warn"
                    >
                      ×
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        {canWrite && (
          <section className="border-t border-fg/10 pt-4">
            {!dispatchForm ? (
              <>
                <button
                  onClick={openDispatchForm}
                  className="w-full border border-warn/50 px-2 py-2 text-xs text-warn hover:bg-warn/10"
                >
                  Send to Client
                </button>
                {status && <p className="mt-2 text-xs text-fg/60">{status}</p>}
              </>
            ) : (
              <form onSubmit={handleDispatch} className="space-y-2">
                <input
                  required
                  type="email"
                  placeholder="client email"
                  value={dispatchForm.to}
                  onChange={(e) => setDispatchForm((f) => ({ ...f, to: e.target.value }))}
                  className="w-full border border-fg/15 bg-transparent px-2 py-1.5 text-xs placeholder:text-fg/30 focus:border-accent focus:outline-none"
                />
                <input
                  required
                  placeholder="subject"
                  value={dispatchForm.subject}
                  onChange={(e) => setDispatchForm((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full border border-fg/15 bg-transparent px-2 py-1.5 text-xs placeholder:text-fg/30 focus:border-accent focus:outline-none"
                />
                <textarea
                  required
                  rows={4}
                  value={dispatchForm.message}
                  onChange={(e) => setDispatchForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full border border-fg/15 bg-transparent px-2 py-1.5 text-xs placeholder:text-fg/30 focus:border-accent focus:outline-none"
                />
                <select
                  value={dispatchForm.fileId}
                  onChange={(e) => setDispatchForm((f) => ({ ...f, fileId: e.target.value }))}
                  className="w-full border border-fg/15 bg-surface px-2 py-1.5 text-xs text-fg/80 focus:border-accent focus:outline-none"
                >
                  <option value="">No attachment</option>
                  {files.map((file) => (
                    <option key={file.id} value={file.id}>
                      Attach {file.filename}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDispatchForm(null)}
                    className="flex-1 border border-fg/15 px-2 py-1.5 text-xs text-fg/50 hover:text-fg"
                  >
                    cancel
                  </button>
                  <button
                    type="submit"
                    disabled={dispatching}
                    className="flex-1 border border-warn/50 px-2 py-1.5 text-xs text-warn hover:bg-warn/10 disabled:opacity-50"
                  >
                    {dispatching ? 'sending…' : 'send'}
                  </button>
                </div>
                {status && <p className="text-xs text-fg/60">{status}</p>}
              </form>
            )}
          </section>
        )}

        {!canWrite && status && <p className="text-xs text-fg/60">{status}</p>}
      </div>
    </div>
  );
}
