const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');

const app = express();

// Receber dados de formulários e JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Conexão MySQL usando variáveis de ambiente do Railway
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar no MySQL:', err);
  } else {
    console.log('Conectado ao banco de dados MySQL do Railway!');
  }
});

// Configuração do store de sessão no MySQL
const sessionStore = new MySQLStore({}, db.promise());

// Sessão
app.use(session({
  key: 'session_cookie_name',
  secret: 'segredo-supersecreto',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 1 dia
  }
}));

// Pasta pública (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  db.query('SELECT * FROM admins WHERE usuario = ? AND senha = ?', [usuario, senha], (err, results) => {
    if (err) return res.status(500).send('Erro no servidor');

    if (results.length > 0) {
      req.session.logado = true;
      req.session.usuario = usuario;
      res.redirect('/painel');
    } else {
      res.status(401).send('Login inválido. <a href="/">Tentar novamente</a>');
    }
  });
});

// Painel (HTML)
app.get('/painel', (req, res) => {
  if (!req.session.logado) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para compras
app.get('/api/compras', (req, res) => {
  if (!req.session.logado) return res.status(401).json({ error: 'Não autorizado' });

  const { ano, mes, semana, dia } = req.query;
  let sql = 'SELECT * FROM venda WHERE 1=1';
  const params = [];

  if (ano) { sql += ' AND YEAR(data) = ?'; params.push(ano); }
  if (mes) { sql += ' AND MONTH(data) = ?'; params.push(mes); }
  if (semana) { sql += ' AND WEEK(data, 1) = ?'; params.push(semana); }
  if (dia) { sql += ' AND DAY(data) = ?'; params.push(dia); }

  sql += ' ORDER BY data DESC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao carregar dados' });

    const totalCompras = results.length;
    const valorTotal = results.reduce((acc, r) => acc + parseFloat(r.valor_total), 0);

    res.json({ compras: results, total_compras: totalCompras, valor_total: valorTotal });
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect('/');
  });
});

// Porta
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
