const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');

const app = express();

// --- Conexão com MySQL usando variáveis de ambiente do Railway ---
const db = mysql.createConnection({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'caixarapido',
  port: process.env.MYSQLPORT || 3306
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar no MySQL:', err);
  } else {
    console.log('Conectado ao banco de dados MySQL!');
  }
});

// --- Middlewares ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: 'segredo-supersecreto',
  resave: false,
  saveUninitialized: true
}));

// Define pasta pública (CSS, JS, HTML)
app.use(express.static(path.join(__dirname, 'public')));

// --- Rotas ---
// Página de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  db.query('SELECT * FROM admins WHERE usuario = ? AND senha = ?', [usuario, senha], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro interno do servidor');
    }

    if (results.length > 0) {
      req.session.logado = true;
      res.redirect('/painel');
    } else {
      res.send('Login inválido. <a href="/">Tentar novamente</a>');
    }
  });
});

// Painel principal (página HTML)
app.get('/painel', (req, res) => {
  if (!req.session.logado) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para buscar compras (usada pelo front-end)
app.get('/api/compras', (req, res) => {
  if (!req.session.logado) return res.status(401).json({ erro: 'Não autorizado' });

  const ano = req.query.ano;
  const mes = req.query.mes;
  const semana = req.query.semana;

  let sql = 'SELECT * FROM venda WHERE 1=1';
  const params = [];

  if (ano) sql += ' AND YEAR(data) = ?' && params.push(ano);
  if (mes) sql += ' AND MONTH(data) = ?' && params.push(mes);
  if (semana) sql += ' AND WEEK(data,1) = ?' && params.push(semana);

  sql += ' ORDER BY data DESC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao carregar dados' });
    }
    res.json(results);
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect('/');
  });
});

// --- Inicialização do servidor ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
