const express = require('express');
const { prisma } = require('../db');
const { asyncHandler } = require('../asyncHandler');
const router = express.Router();

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

module.exports = router;
