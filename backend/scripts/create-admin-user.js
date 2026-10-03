// Creates a new admin login, or resets an existing one's password.
//
// Usage:
//   node scripts/create-admin-user.js you@example.com "your password" "Your Name" [role]
//   npm run create-admin -- you@example.com "your password" "Your Name" admin
//
// role is 'admin' (default — can do everything) or 'viewer' (can read
// every tab but cannot change anything).
//
// Safe to re-run with the same email to change a password or role — it
// upserts on email rather than failing on a duplicate.
const bcrypt = require('bcryptjs');
const { prisma } = require('../src/db');

async function main() {
  const [, , email, password, name, role = 'admin'] = process.argv;

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin-user.js <email> <password> [name] [admin|viewer]');
    process.exit(1);
  }
  if (role !== 'admin' && role !== 'viewer') {
    console.error(`Unknown role "${role}" — use "admin" or "viewer".`);
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Use a password of at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, role, ...(name ? { name } : {}) },
    create: { email: email.toLowerCase(), passwordHash, name: name || null, role },
  });

  console.log(`Admin user ready: ${user.email} — role ${user.role} (id ${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());