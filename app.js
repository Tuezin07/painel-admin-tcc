const express = require('express'); 
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const app = express();

// Permite receber dados de formulários
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração da sessão (mantém usuário logado)
app.use(session({
  secret: 'segredo-supersecreto', // pode trocar por outra string
  resave: false,
  saveUninitialized: true
}));

// Define a pasta de arquivos públicos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Página de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Processo de login
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  db.query('SELECT * FROM admins WHERE usuario = ? AND senha = ?', [usuario, senha], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      req.session.logado = true;
      res.redirect('/painel');
    } else {
      res.send('Login inválido. <a href="/">Tentar novamente</a>');
    }
  });
});

// Painel de compras (protegido por login)
app.get('/painel', (req, res) => {
  if (!req.session.logado) {
    return res.redirect('/');
  }

  const filtro = req.query.filtro || 'todos';
  let sql = 'SELECT * FROM venda';
  const params = [];

  if (filtro === 'hoje') {
    sql += ' WHERE DATE(data) = CURDATE()';
  } else if (filtro === '7dias') {
    sql += ' WHERE `data` >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  } else if (filtro === 'mes') {
    sql += ' WHERE MONTH(data) = MONTH(CURDATE()) AND YEAR(data) = YEAR(CURDATE())';
  }

  sql += ' ORDER BY data DESC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Erro ao carregar dados:', err);
      return res.send('Erro ao carregar dados. Por favor, tente novamente.');
    }

    let html = `
      <html>
      <head>
        <link rel="stylesheet" href="/css/style.css">
        <title>Painel de Compras</title>
      </head>
      <body>
        <h1>Painel de Compras</h1>
        <div class="top-buttons">
          <a href="/logout" class="button">Sair</a>
        </div>
      
        <form method="GET" action="/painel">
          <label for="filtro">Filtrar por:</label>
          <select name="filtro" id="filtro">
            <option value="todos">Todos</option>
            <option value="hoje">Hoje</option>
            <option value="7dias">Últimos 7 dias</option>
            <option value="mes">Mês atual</option>
          </select>
          <button type="submit">Aplicar</button>
        </form>
      
        <table>
          <tr><th>ID</th><th>Data/Hora</th><th>Valor Total</th></tr>
    `;

    results.forEach(compra => {
      html += `
        <tr>
          <td>${compra.id}</td>
          <td>${new Date(compra.data).toLocaleString()}</td>
          <td>R$ ${parseFloat(compra.valor_total).toFixed(2)}</td>
        </tr>`;
    });

    html += `
        </table>
      </body>
      </html>`;

    res.send(html);
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) throw err;
    res.redirect('/');
  });
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
