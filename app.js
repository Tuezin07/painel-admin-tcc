const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db'); // conexão com o MySQL

const app = express();

// Receber dados de formulários
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Sessão
app.use(session({
  secret: 'segredo-supersecreto',
  resave: false,
  saveUninitialized: true
}));

// Pasta pública (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Página de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
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
      res.send('Login inválido. <a href="/">Tentar novamente</a>');
    }
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Erro ao sair');
    res.redirect('/');
  });
});

// Painel de vendas (HTML)
app.get('/painel', (req, res) => {
  if (!req.session.logado) return res.redirect('/');

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para o frontend carregar dados em JSON
app.get('/api/compras', (req, res) => {
  if (!req.session.logado) return res.status(401).json({ erro: "Não autorizado" });

  // filtros (ano, mês, semana, etc)
  const { ano, mes, semana, dia } = req.query;
  let sql = 'SELECT * FROM venda WHERE 1=1';
  const params = [];

  if (ano) {
    sql += ' AND YEAR(data) = ?';
    params.push(ano);
  }
  if (mes) {
    sql += ' AND MONTH(data) = ?';
    params.push(mes);
  }
  if (semana) {
    sql += ' AND WEEK(data, 1) = ?';
    params.push(semana);
  }
  if (dia) {
    sql += ' AND DAY(data) = ?';
    params.push(dia);
  }

  sql += ' ORDER BY data DESC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ erro: "Erro ao carregar dados" });
    res.json(results);
  });
});

// Inicia o servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
