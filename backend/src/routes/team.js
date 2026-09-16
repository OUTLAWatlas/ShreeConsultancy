const express = require('express');
const { prisma } = require('../db');
const { asyncHandler } = require('../asyncHandler');
const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const team = await prisma.teamMember.findMany({ orderBy: { id: 'asc' } });
    res.json({ team });
  })
);

module.exports = router;
