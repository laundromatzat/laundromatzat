import { Knex } from "knex";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("portfolio").del();

    const csvFilePath = path.resolve(__dirname, '../../../../portfolio-data - Sheet1.csv');
    const csvFile = fs.readFileSync(csvFilePath, "utf8");

    const parsed = Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
    });

    const portfolioItems = parsed.data.map((row: any) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        coverImage: row.coverImage,
        sourceUrl: row.sourceUrl,
        date: row.date,
        location: row.location,
        gpsCoords: row.gpsCoords,
        feat: row.feat,
        description: row.description,
        easterEgg: row.easterEgg,
    }));

    // Inserts seed entries
    await knex("portfolio").insert(portfolioItems);
};