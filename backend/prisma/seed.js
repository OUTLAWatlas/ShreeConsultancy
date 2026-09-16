// Seeds the demo data that used to live in lib/mockData.js, so a fresh
// database looks like the frontend prototype did. Safe to delete or
// replace once real data exists — run with `npx prisma db seed`.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.ledgerEntry.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.project.deleteMany();
  await prisma.tender.deleteMany();
  await prisma.teamMember.deleteMany();

  const projects = [
    { title: 'Switchyard — Nagpur', client: 'GETCO', discipline: 'Electrical', stage: 'New Leads', value: 420000 },
    { title: '33kV Substation — Pune', client: 'Tata Power', discipline: 'Electrical', stage: 'Quoting', value: 680000,
      ledgerEntries: { create: [{ item: 'Site survey — subcontractor', amount: 18000 }] } },
    { title: 'GIS Sub-station — Surat', client: 'Adani Power', discipline: 'Structural', stage: 'Drafting', value: 910000, blocked: true, proposalGenerated: true,
      ledgerEntries: { create: [{ item: 'Soil testing', amount: 32000 }, { item: 'CAD contractor — 2 weeks', amount: 54000 }] } },
    { title: 'Warehouse Fit-out — Bhiwandi', client: 'Amazon', discipline: 'Civil', stage: 'Client Review', value: 310000, proposalGenerated: true,
      ledgerEntries: { create: [{ item: 'Structural review — S K Saha', amount: 12000 }] } },
    { title: 'Cement Plant — Satna', client: 'L&T', discipline: 'Electrical', stage: 'Invoicing', value: 550000, proposalGenerated: true, invoiceGenerated: true,
      ledgerEntries: { create: [{ item: 'Site supervision', amount: 40000 }] } },
    { title: 'Refinery Yard — Jamnagar', client: 'Reliance Industries', discipline: 'Electrical', stage: 'Closed', value: 1250000, proposalGenerated: true, invoiceGenerated: true,
      ledgerEntries: { create: [{ item: 'Commissioning support', amount: 65000 }] } },
  ];

  for (const p of projects) {
    await prisma.project.create({ data: p });
  }

  const satna = await prisma.project.findFirst({ where: { title: 'Cement Plant — Satna' } });
  if (satna) {
    await prisma.invoice.create({
      data: { projectId: satna.id, amount: 590000, status: 'sent', dueDate: new Date('2026-09-20') },
    });
  }

  await prisma.tender.createMany({
    data: [
      { source: 'MahaTenders', title: '110kV Grid Substation Upgrade — Aurangabad', location: 'Maharashtra, IN', estValue: 890000, deadline: new Date('2026-10-02'), status: 'new', externalId: 'seed-1' },
      { source: 'GeM', title: 'Structural Audit — Govt. Warehouse Complex', location: 'Nagpur, IN', estValue: 145000, deadline: new Date('2026-09-25'), status: 'new', externalId: 'seed-2' },
      { source: 'CPPP', title: 'Civil Works — District Hospital Annex', location: 'Nashik, IN', estValue: 620000, deadline: new Date('2026-10-10'), status: 'new', externalId: 'seed-3' },
      { source: 'MahaTenders', title: 'Electrical Retrofit — Textile Mill', location: 'Surat, IN', estValue: 275000, deadline: new Date('2026-09-18'), status: 'archived', externalId: 'seed-4' },
    ],
  });

  await prisma.teamMember.createMany({
    data: [
      { name: 'Suhas Patil', role: 'Founder & Principal', credential: 'B.Tech Electrical', discipline: 'All disciplines', draftsmen: 0 },
      { name: 'Mahesh Karia', role: 'Discipline Lead', credential: 'Electrical', discipline: 'Electrical', draftsmen: 3 },
      { name: 'Satyajeet Pimpalkar', role: 'Discipline Lead', credential: 'Civil', discipline: 'Civil', draftsmen: 2 },
      { name: 'S K Saha', role: 'Discipline Lead', credential: 'Structural', discipline: 'Structural', draftsmen: 2 },
    ],
  });

  console.log('Seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
