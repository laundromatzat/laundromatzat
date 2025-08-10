"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
async function seed(knex) {
    // Deletes ALL existing entries
    await knex("portfolio").del();
    // Inserts seed entries
    await knex("portfolio").insert([
        { id: 1, title: 'Video Project 1', type: 'video' },
        { id: 2, title: 'Photo Series A', type: 'photo' },
        { id: 3, title: 'Video Project 2', type: 'video' },
    ]);
}
;
