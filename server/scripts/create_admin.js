const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const db = require("../database");
const bcrypt = require("bcryptjs");

async function createAdmin() {
  const username = "admin";
  const password = "adminpassword123";

  console.log(`Creating admin user: ${username} / ${password}`);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const check = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (check.rows.length > 0) {
      console.log("User already exists. Promoting to admin...");
      await db.query(
        "UPDATE users SET role = 'admin', is_approved = TRUE, password = $1 WHERE username = $2",
        [hashedPassword, username]
      );
    } else {
      console.log("Creating new admin user...");
      await db.query(
        "INSERT INTO users (username, password, role, is_approved) VALUES ($1, $2, 'admin', TRUE)",
        [username, hashedPassword]
      );
    }

    console.log("Admin user created/updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Failed to create admin:", err);
    process.exit(1);
  }
}

createAdmin();
