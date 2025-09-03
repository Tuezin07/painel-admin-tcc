const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.MYSQLHOST,             // host fornecido pelo Railway
  user: process.env.MYSQLUSER,             // usuário fornecido pelo Railway
  password: process.env.MYSQL_ROOT_PASSWORD, // senha do Railway
  database: process.env.MYSQLDATABASE,     // banco de dados Railway
  port: process.env.MYSQLPORT || 3306
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar no MySQL:', err);
    return;
  }
  console.log('Conectado ao banco de dados MySQL do Railway!');
});

module.exports = connection;
