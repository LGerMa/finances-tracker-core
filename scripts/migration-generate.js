const { execSync } = require('child_process');
const name = process.argv[2];
if (!name) {
  console.error('Please provide a migration name.');
  process.exit(1);
}

execSync(
  `npm run typeorm -- migration:generate --dataSource src/database/data-source.ts src/database/migrations/${name}`,
  { stdio: 'inherit' },
);
