const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false
  },
  family: 4 // 👈 FUERZA IPv4
});

module.exports = pool;
