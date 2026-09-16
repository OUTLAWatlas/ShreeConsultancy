const express = require('express');
const { prisma } = require('../db');
const { sendEmail } = require('../email');
const { asyncHandler } = require('../asyncHandler');
const router = express.Router();

// Called by the standalone tender-scraper service. Upserts on
// externalId so re-running the scraper doesn't create duplicates.
router.post(
  '/tenders',
  asyncHandler(async (req, res) => {
    const { source, title, location, estValue, deadline, externalId } = req.body;
    if (!source || !title || !externalId) {
      return res.status(400).json({ error: 'source, title and externalId are required' });
    }

    const tender = await prisma.tender.upsert({
      where: { externalId },
      update: {
        source,
        title,
        location,
        estValue: Number(estValue) || 0,
        deadline: new Date(deadline),
      },
      create: {
        source,
        title,
        location: location || 'Unknown',
        estValue: Number(estValue) || 0,
        deadline: new Date(deadline),
        externalId,
      },
    });

    res.status(201).json({ tender });
  })
);

// Called by the standalone dunning service to get invoices it needs to
// evaluate for reminders.
router.get(
  '/invoices',
  asyncHandler(async (req, res) => {
    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ['draft', 'sent', 'overdue'] } },
      include: { project: { select: { title: true, client: true, contactEmail: true } } },
    });
    res.json({ invoices });
  })
);

// The dunning service just tells us "checkpoint hit for this invoice" —
// the actual reminder email is sent here, server-side, so the Resend key
// only ever needs to live in this one service.
router.post(
  '/invoices/:id/remind',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { project: { select: { title: true, contactEmail: true } } },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const isPastDue = new Date() > new Date(invoice.dueDate);

    if (invoice.project.contactEmail) {
      await sendEmail({
        to: invoice.project.contactEmail,
        subject: `Reminder: invoice for ${invoice.project.title}`,
        html: `<p>This is a reminder that payment for <strong>${invoice.project.title}</strong> (₹${invoice.amount}) is ${isPastDue ? 'now overdue' : 'due'} on ${new Date(invoice.dueDate).toDateString()}.</p>`,
      });
    } else {
      // No contact email on file (e.g. a tender-converted or manually
      // created project) — still record that a checkpoint was hit, so
      // it's visible in the dashboard, but there's nowhere to send it.
      console.warn(`Invoice ${id}: no contact email on file — reminder recorded, not sent.`);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        remindersSent: invoice.remindersSent + 1,
        lastReminderAt: new Date(),
        status: isPastDue && invoice.status === 'sent' ? 'overdue' : invoice.status,
      },
    });

    res.json({ invoice: updated });
  })
);

module.exports = router;