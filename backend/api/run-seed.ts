import knex from 'knex';
import config from './knexfile';

const db = knex(config);

db.seed.run()
  .then(() => {
    console.log('Seeding complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
