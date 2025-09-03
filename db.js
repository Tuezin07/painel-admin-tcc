const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQL_ROOT_PASSWORD || '',
  database: process.env.MYSQLDATABASE || 'caixarapido',
  port: process.env.MYSQLPORT || 3306
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar no MySQL:', err);
    return;
  }
  console.log('Conectado ao banco de dados MySQL!');
});

module.exports = connection;
