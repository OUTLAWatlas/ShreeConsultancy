const express = require('express');
const { prisma } = require('../db');
const { asyncHandler } = require('../asyncHandler');
const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const invoices = await prisma.invoice.findMany({
      include: { project: { select: { title: true, client: true } } },
      orderBy: { dueDate: 'asc' },
    });
    res.json({ invoices });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!req.body.status) return res.status(400).json({ error: 'status is required' });
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: req.body.status },
    });
    res.json({ invoice });
  })
);

module.exports = router;
