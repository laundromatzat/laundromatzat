import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('portfolio', (table) => {
    table.string('coverImage');
    table.string('sourceUrl');
    table.string('date');
    table.string('location');
    table.string('gpsCoords');
    table.string('feat');
    table.text('description');
    table.string('easterEgg');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('portfolio', (table) => {
    table.dropColumn('coverImage');
    table.dropColumn('sourceUrl');
    table.dropColumn('date');
    table.dropColumn('location');
    table.dropColumn('gpsCoords');
    table.dropColumn('feat');
    table.dropColumn('description');
    table.dropColumn('easterEgg');
  });
}
