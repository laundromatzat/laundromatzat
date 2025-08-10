"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('portfolio', (table) => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.string('type').notNullable();
    });
}
async function down(knex) {
    return knex.schema.dropTable('portfolio');
}
