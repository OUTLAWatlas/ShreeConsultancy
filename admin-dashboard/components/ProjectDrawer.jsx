'use client';

import { useState } from 'react';
import { formatINR } from '../lib/mockData';

export default function ProjectDrawer({ project, onClose, onAddLedgerItem, onMarkDocument }) {
  const [ledgerDraft, setLedgerDraft] = useState({ item: '', amount: '' });
  const [status, setStatus] = useState('');
  const [generating, setGenerating] = useState(null);
  const [dispatching, setDispatching] = useState(false);

  // Generated PDFs live only in this component's state, for as long as
  // the drawer stays open — there's no file storage yet (see README), so
  // closing the drawer and reopening it means regenerating a document
  // before it can be attached to a dispatch email again.
  const [generatedPdfs, setGeneratedPdfs] = useState({});

  const [dispatchForm, setDispatchForm] = useState(null); // null until opened

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
        doc.text(`Base scope of work`, 18, y);
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
      doc.save(filename); // still offers the local download, same as before

      // Also keep the bytes in memory so Send to Client can attach the
      // exact same PDF to the email in this same session.
      setGeneratedPdfs((prev) => ({
        ...prev,
        [kind]: { filename, dataUri: doc.output('datauristring') },
      }));

      onMarkDocument(project.id, kind);
      setStatus(`Generated ${filename}`);
    } catch (err) {
      setStatus('Could not generate PDF — see console for details.');
      console.error(err);
    } finally {
      setGenerating(null);
    }
  }

  function openDispatchForm() {
    const defaultKind = generatedPdfs.invoice ? 'invoice' : generatedPdfs.proposal ? 'proposal' : 'none';
    setDispatchForm({
      to: project.contactEmail || '',
      subject: `Regarding ${project.title}`,
      message:
        `Hi,\n\nPlease find the ${defaultKind === 'none' ? 'update' : defaultKind} for ${project.title} ` +
        (defaultKind === 'none' ? 'below.' : 'attached.') +
        `\n\nBest,\nShree Consultancy`,
      attachKind: defaultKind,
    });
    setStatus('');
  }

  async function handleDispatch(e) {
    e.preventDefault();
    setDispatching(true);
    setStatus('');
    try {
      const attachment =
        dispatchForm.attachKind !== 'none' && generatedPdfs[dispatchForm.attachKind]
          ? {
              filename: generatedPdfs[dispatchForm.attachKind].filename,
              contentBase64: generatedPdfs[dispatchForm.attachKind].dataUri,
            }
          : undefined;

      const res = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: dispatchForm.to,
          subject: dispatchForm.subject,
          message: dispatchForm.message.replace(/\n/g, '<br/>'),
          attachment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dispatch failed.');
      setStatus(`Sent to ${dispatchForm.to}.`);
      setDispatchForm(null);
    } catch (err) {
      setStatus(err.message || 'Dispatch failed — see console for details.');
      console.error(err);
    } finally {
      setDispatching(false);
    }
  }

  const availableAttachments = ['proposal', 'invoice'].filter((k) => generatedPdfs[k]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-ink p-6 text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs text-white/40">{project.stage}</p>
            <h2 className="mt-1 text-base text-white">{project.title}</h2>
            <p className="mt-1 text-xs text-white/50">
              {project.client} — {project.discipline}
            </p>
          </div>
          <button onClick={onClose} className="text-xs text-white/40 hover:text-white">
            close
          </button>
        </div>

        <section className="mb-6">
          <p className="mb-2 text-xs tracking-wide text-white/40">Base scope value</p>
          <p className="tabular text-lg">{formatINR(project.value)}</p>
        </section>

        <section className="mb-6 border-t border-white/10 pt-4">
          <p className="mb-2 text-xs tracking-wide text-white/40">Subcontractor ledger</p>
          <div className="space-y-1.5">
            {project.ledger.length === 0 && (
              <p className="text-xs text-white/30">No expenses logged yet.</p>
            )}
            {project.ledger.map((row) => (
              <div key={row.id} className="flex justify-between text-xs text-white/70">
                <span>{row.item}</span>
                <span className="tabular">{formatINR(row.amount)}</span>
              </div>
            ))}
            {project.ledger.length > 0 && (
              <div className="flex justify-between border-t border-white/10 pt-1.5 text-xs text-white/90">
                <span>Ledger total</span>
                <span className="tabular">{formatINR(ledgerTotal)}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleAddLedgerItem} className="mt-3 flex gap-2">
            <input
              placeholder="expense description"
              value={ledgerDraft.item}
              onChange={(e) => setLedgerDraft((d) => ({ ...d, item: e.target.value }))}
              className="min-w-0 flex-1 border border-white/15 bg-transparent px-2 py-1.5 text-xs placeholder:text-white/30 focus:border-cyan focus:outline-none"
            />
            <input
              placeholder="₹"
              inputMode="numeric"
              value={ledgerDraft.amount}
              onChange={(e) => setLedgerDraft((d) => ({ ...d, amount: e.target.value }))}
              className="w-20 border border-white/15 bg-transparent px-2 py-1.5 text-xs placeholder:text-white/30 focus:border-cyan focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 border border-white/15 px-2 py-1.5 text-xs text-white/60 hover:text-white"
            >
              add
            </button>
          </form>
        </section>

        <section className="mb-6 border-t border-white/10 pt-4">
          <p className="mb-2 text-xs tracking-wide text-white/40">Document engine</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleGenerate('proposal')}
              disabled={generating === 'proposal'}
              className="flex-1 border border-white/15 px-2 py-2 text-xs text-white/80 hover:border-cyan/50 hover:text-cyan disabled:opacity-50"
            >
              {generating === 'proposal' ? 'generating…' : 'Generate Proposal PDF'}
              {project.documents.proposal && <span className="ml-1 text-white/30">✓</span>}
            </button>
            <button
              onClick={() => handleGenerate('invoice')}
              disabled={generating === 'invoice'}
              className="flex-1 border border-white/15 px-2 py-2 text-xs text-white/80 hover:border-cyan/50 hover:text-cyan disabled:opacity-50"
            >
              {generating === 'invoice' ? 'generating…' : 'Generate Final Invoice PDF'}
              {project.documents.invoice && <span className="ml-1 text-white/30">✓</span>}
            </button>
          </div>
          {(project.documents.proposal || project.documents.invoice) &&
            availableAttachments.length === 0 && (
              <p className="mt-2 text-[10px] text-white/30">
                A document was generated in an earlier session — regenerate it here to attach it
                to an email now.
              </p>
            )}
        </section>

        <section className="border-t border-white/10 pt-4">
          {!dispatchForm ? (
            <>
              <button
                onClick={openDispatchForm}
                className="w-full border border-amber/50 px-2 py-2 text-xs text-amber hover:bg-amber/10"
              >
                Send to Client
              </button>
              {status && <p className="mt-2 text-xs text-white/60">{status}</p>}
            </>
          ) : (
            <form onSubmit={handleDispatch} className="space-y-2">
              <input
                required
                type="email"
                placeholder="client email"
                value={dispatchForm.to}
                onChange={(e) => setDispatchForm((f) => ({ ...f, to: e.target.value }))}
                className="w-full border border-white/15 bg-transparent px-2 py-1.5 text-xs placeholder:text-white/30 focus:border-cyan focus:outline-none"
              />
              <input
                required
                placeholder="subject"
                value={dispatchForm.subject}
                onChange={(e) => setDispatchForm((f) => ({ ...f, subject: e.target.value }))}
                className="w-full border border-white/15 bg-transparent px-2 py-1.5 text-xs placeholder:text-white/30 focus:border-cyan focus:outline-none"
              />
              <textarea
                required
                rows={4}
                value={dispatchForm.message}
                onChange={(e) => setDispatchForm((f) => ({ ...f, message: e.target.value }))}
                className="w-full border border-white/15 bg-transparent px-2 py-1.5 text-xs placeholder:text-white/30 focus:border-cyan focus:outline-none"
              />
              <select
                value={dispatchForm.attachKind}
                onChange={(e) => setDispatchForm((f) => ({ ...f, attachKind: e.target.value }))}
                className="w-full border border-white/15 bg-ink px-2 py-1.5 text-xs text-white/80 focus:border-cyan focus:outline-none"
              >
                <option value="none">No attachment</option>
                {availableAttachments.map((k) => (
                  <option key={k} value={k}>
                    Attach {k === 'proposal' ? 'Proposal PDF' : 'Final Invoice PDF'}
                  </option>
                ))}
              </select>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDispatchForm(null)}
                  className="flex-1 border border-white/15 px-2 py-1.5 text-xs text-white/50 hover:text-white"
                >
                  cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatching}
                  className="flex-1 border border-amber/50 px-2 py-1.5 text-xs text-amber hover:bg-amber/10 disabled:opacity-50"
                >
                  {dispatching ? 'sending…' : 'send'}
                </button>
              </div>
              {status && <p className="text-xs text-white/60">{status}</p>}
            </form>
          )}
        </section>
      </div>
    </div>
  );
}