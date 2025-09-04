const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const app = express();

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Sessão persistente
const sessionStore = new MySQLStore({}, db.promise());
app.use(session({
  key: 'sessao_painel',
  secret: 'segredo-supersecreto',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hora
}));

// Servir arquivos estáticos (CSS)
app.use(express.static(__dirname));

// === ROTAS ===

// Página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Login
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  db.query('SELECT * FROM admins WHERE usuario = ? AND senha = ?', [usuario, senha], (err, results) => {
    if (err) return res.status(500).send('Erro no servidor');

    if (results.length > 0) {
      req.session.logado = true;
      res.redirect('/painel');
    } else {
      res.status(401).send('Login inválido. <a href="/login">Tentar novamente</a>');
    }
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect('/login');
  });
});

// Painel
app.get('/painel', (req, res) => {
  if (!req.session.logado) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API de compras
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

// Porta
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
