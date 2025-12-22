const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// DB is in server: ./paystubs.db
const dbPath = path.join(__dirname, 'paystubs.db');
// Uploads is in backend/uploads: ./uploads
const uploadsDir = path.join(__dirname, 'uploads');

console.log('Clearing database at ' + dbPath);
if (fs.existsSync(dbPath)) {
    const db = new Database(dbPath);
    try {
        db.exec('DELETE FROM paychecks');
        // Reset auto-increment
        db.exec("DELETE FROM sqlite_sequence WHERE name='paychecks'");
        db.exec('VACUUM');
        console.log('Database cleared.');
    } catch (e) {
        console.error('Error clearing database:', e);
    }
    db.close();
} else {
    console.log('Database file not found.');
}

console.log('Clearing uploads at ' + uploadsDir);
if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
        // Avoid deleting the directory itself or hidden files if we want to keep them
        if (file.startsWith('.')) continue;
        
        try {
            fs.unlinkSync(path.join(uploadsDir, file));
            console.log(`Deleted ${file}`);
        } catch (e) {
            console.error(`Failed to delete ${file}:`, e);
        }
    }
    console.log('Uploads cleared.');
} else {
    console.log('Uploads directory not found.');
}
