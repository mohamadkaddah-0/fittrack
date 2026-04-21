require('dotenv').config(); 
const mysql = require('mysql2/promise'); 
 
async function test() { 
  console.log('Testing database connection...'); 
  console.log('DB_HOST:', process.env.DB_HOST); 
  console.log('DB_USER:', process.env.DB_USER); 
  console.log('DB_NAME:', process.env.DB_NAME); 
 
  try { 
    const conn = await mysql.createConnection({ 
      host: process.env.DB_HOST, 
      user: process.env.DB_USER, 
      password: process.env.DB_PASS, 
      database: process.env.DB_NAME, 
    }); 
    console.log('? SUCCESS! Connected to MySQL!'); 
    const [result] = await conn.execute('SELECT COUNT(*) as count FROM users'); 
    console.log('Number of users:', result[0].count); 
    await conn.end(); 
  } catch (err) { 
    console.error('? FAILED:', err.message); 
    if (err.code === 'ECONNREFUSED') console.log(' MySQL is not running'); 
    if (err.code === 'ER_ACCESS_DENIED_ERROR') console.log(' Wrong password'); 
    if (err.code === 'ER_BAD_DB_ERROR') console.log(' Database does not exist'); 
  } 
} 
test(); 
