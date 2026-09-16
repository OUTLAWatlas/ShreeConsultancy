const express = require('express');
const { prisma } = require('../db');
const { asyncHandler } = require('../asyncHandler');
const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const tenders = await prisma.tender.findMany({ orderBy: { deadline: 'asc' } });
    res.json({ tenders });
  })
);

// PATCH { status: 'archived' }             — simple status change
// PATCH { action: 'convert', discipline }  — status -> converted AND
//   creates a matching Project in "New Leads".
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const body = req.body;

    if (body.action === 'convert') {
      const tender = await prisma.tender.findUnique({ where: { id } });
      if (!tender) return res.status(404).json({ error: 'Tender not found' });

      const [, project] = await prisma.$transaction([
        prisma.tender.update({ where: { id }, data: { status: 'converted' } }),
        prisma.project.create({
          data: {
            title: tender.title,
            client: tender.source,
            discipline: body.discipline || 'Electrical',
            value: tender.estValue,
            stage: 'New Leads',
            source: 'tender',
          },
        }),
      ]);

      return res.json({ tender: { ...tender, status: 'converted' }, project });
    }

    if (body.status) {
      const tender = await prisma.tender.update({ where: { id }, data: { status: body.status } });
      return res.json({ tender });
    }

    res.status(400).json({ error: 'Nothing to update' });
  })
);

module.exports = router;
