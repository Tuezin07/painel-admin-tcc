const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db'); // Conexão com o MySQL (configurada para Railway)

const app = express();

// Receber dados de formulários
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // caso o frontend envie JSON

// Sessão
app.use(session({
  secret: 'segredo-supersecreto', // troque se quiser
  resave: false,
  saveUninitialized: true
}));

// Pasta pública (CSS, JS, HTML)
app.use(express.static(path.join(__dirname, 'public')));

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
      return res.status(500).send('Erro no servidor.');
    }

    if (results.length > 0) {
      req.session.logado = true;
      res.redirect('/painel');
    } else {
      res.send('Login inválido. <a href="/">Tentar novamente</a>');
    }
  });
});

// Middleware para proteger rotas
function checarLogin(req, res, next) {
  if (!req.session.logado) return res.redirect('/');
  next();
}

// Painel de vendas
app.get('/painel', checarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API de compras (retorna JSON)
app.get('/api/compras', checarLogin, (req, res) => {
  const { ano, mes, semana, dia } = req.query;

  let sql = 'SELECT * FROM venda';
  const params = [];
  const filtros = [];

  if (ano) filtros.push('YEAR(data) = ?') && params.push(ano);
  if (mes) filtros.push('MONTH(data) = ?') && params.push(mes);
  if (semana) filtros.push('WEEK(data, 1) = ?') && params.push(semana);
  if (dia) filtros.push('DAY(data) = ?') && params.push(dia);

  if (filtros.length > 0) sql += ' WHERE ' + filtros.join(' AND ');

  sql += ' ORDER BY data DESC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Erro ao buscar compras:', err);
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

// Porta do Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
