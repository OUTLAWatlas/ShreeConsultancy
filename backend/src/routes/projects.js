const express = require('express');
const multer = require('multer');
const { prisma } = require('../db');
const { asyncHandler } = require('../asyncHandler');
const { uploadBuffer, getDownloadUrl, deleteObject, buildKey } = require('../storage');
const router = express.Router();

// Files stream through memory straight to object storage — nothing touches
// this server's disk, which matters on hosts with ephemeral filesystems.
// 50MB is a starting ceiling, not a business rule; raise it if real CAD
// files need more headroom.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const projects = await prisma.project.findMany({
      include: { ledgerEntries: { orderBy: { id: 'asc' } } },
      orderBy: { id: 'asc' },
    });
    res.json({ projects });
  })
);

// Manual project creation — the Pipeline tab doesn't have an "add
// project" button yet, but this is here for that and for imports.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { title, client, discipline, value, stage } = req.body;
    if (!title || !client || !discipline || !value) {
      return res
        .status(400)
        .json({ error: 'title, client, discipline and value are required' });
    }
    const project = await prisma.project.create({
      data: { title, client, discipline, value: Number(value), stage: stage || 'New Leads' },
    });
    res.status(201).json({ project });
  })
);

// Allowlist so a stray extra key in a request body can't overwrite
// something it shouldn't.
const PATCHABLE_FIELDS = ['stage', 'blocked', 'value', 'proposalGenerated', 'invoiceGenerated'];

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = {};
    for (const field of PATCHABLE_FIELDS) {
      if (field in req.body) data[field] = req.body[field];
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const project = await prisma.project.update({
      where: { id },
      data,
      include: { ledgerEntries: true },
    });

    // Generating the final invoice is also the moment a real Invoice
    // record should exist. Draft, due in 30 days, amount = scope value +
    // ledger total. Only creates it the first time.
    if (data.invoiceGenerated === true) {
      const existing = await prisma.invoice.findUnique({ where: { projectId: id } });
      if (!existing) {
        const ledgerTotal = project.ledgerEntries.reduce((sum, row) => sum + row.amount, 0);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        await prisma.invoice.create({
          data: { projectId: id, amount: project.value + ledgerTotal, status: 'draft', dueDate },
        });
      }
    }

    res.json({ project });
  })
);

router.post(
  '/:id/ledger',
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.id);
    const { item, amount } = req.body;
    if (!item || !amount) {
      return res.status(400).json({ error: 'item and amount are required' });
    }
    const entry = await prisma.ledgerEntry.create({
      data: { projectId, item, amount: Number(amount) },
    });
    res.status(201).json({ entry });
  })
);

/* ---------------------------------------------------------------------
   Project files — CAD uploads and persisted generated documents.
   All of these need object storage configured; without it they return
   503 with a clear message and nothing else in the app is affected.
   --------------------------------------------------------------------- */

router.get(
  '/:id/files',
  asyncHandler(async (req, res) => {
    const files = await prisma.projectFile.findMany({
      where: { projectId: Number(req.params.id) },
      orderBy: { id: 'desc' },
    });
    res.json({ files });
  })
);

// multipart/form-data, field name "file".
router.post(
  '/:id/files',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.id);
    if (!req.file) return res.status(400).json({ error: 'file is required' });

    const key = buildKey(projectId, req.file.originalname);
    await uploadBuffer(key, req.file.buffer, req.file.mimetype);

    const file = await prisma.projectFile.create({
      data: {
        projectId,
        filename: req.file.originalname,
        key,
        contentType: req.file.mimetype,
        size: req.file.size,
        kind: 'cad',
      },
    });
    res.status(201).json({ file });
  })
);

// Persists a PDF the browser already generated with jsPDF (base64 JSON,
// not multipart). This is what lets a proposal generated last week still
// be attached to an email today without regenerating it.
router.post(
  '/:id/documents',
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.id);
    const { kind, filename, contentBase64 } = req.body;
    if (!kind || !filename || !contentBase64) {
      return res.status(400).json({ error: 'kind, filename and contentBase64 are required' });
    }

    const buffer = Buffer.from(contentBase64.replace(/^data:.*;base64,/, ''), 'base64');
    const key = buildKey(projectId, filename);
    await uploadBuffer(key, buffer, 'application/pdf');

    const file = await prisma.projectFile.create({
      data: { projectId, filename, key, contentType: 'application/pdf', size: buffer.length, kind },
    });
    res.status(201).json({ file });
  })
);

// Returns a time-limited signed URL rather than redirecting or proxying
// the bytes — keeps the bucket private without this process streaming
// large CAD files. fileId rides as a query param so admin-dashboard's
// proxy doesn't need a second nested dynamic route segment.
router.get(
  '/:id/files/download',
  asyncHandler(async (req, res) => {
    const file = await prisma.projectFile.findFirst({
      where: { id: Number(req.query.fileId), projectId: Number(req.params.id) },
    });
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json({ url: await getDownloadUrl(file.key) });
  })
);

router.delete(
  '/:id/files',
  asyncHandler(async (req, res) => {
    const file = await prisma.projectFile.findFirst({
      where: { id: Number(req.body.fileId), projectId: Number(req.params.id) },
    });
    if (!file) return res.status(404).json({ error: 'File not found' });

    await deleteObject(file.key);
    await prisma.projectFile.delete({ where: { id: file.id } });
    res.json({ ok: true });
  })
);

module.exports = router;
