import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('portfolio', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.string('type').notNullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('portfolio');
}
