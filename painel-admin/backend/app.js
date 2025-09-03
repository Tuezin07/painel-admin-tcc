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

// Define a pasta de arquivos públicos (CSS, imagens etc)
app.use(express.static(path.join(__dirname, '../public')));

// Página de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Processo de login
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  db.query('SELECT * FROM admins WHERE usuario = ? AND senha = ?', [usuario, senha], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      // Se login for válido, criamos uma sessão
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
      if (err) throw err;
  
      let html = `
      <html>
      <head>
        <link rel="stylesheet" href="/css/style.css">
        <title>Painel de Compras</title>
      <style>
          body {
          font-family: 'Segoe UI', sans-serif;
          background-color: #f4f6f8;
          margin: 0;
          padding: 0;
        }

        h1 {
          text-align: center;
          padding-top: 20px;
          color: #2c3e50;
        }

        form {
          text-align: center;
          margin-bottom: 20px;
        }

        select {
          padding: 10px;
          font-size: 16px;
          border-radius: 8px;
          border: 1px solid #ccc;
          margin-right: 10px;
          background-color: #fff;
        }

        button {
          padding: 10px 20px;
          font-size: 16px;
          background-color: #3498db;
          border: none;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.3s ease;
          display: inline-block;
          margin-top: 10px;
          width: auto;
        }

        button:hover {
          background-color: #2980b9;
        }

        table {
          width: 90%;
          margin: auto;
          border-collapse: collapse;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }

        th {
          background-color: #2c3e50;
          color: white;
          padding: 12px;
          text-align: center;
        }

        td {
          padding: 12px;
          text-align: center;
          border-bottom: 1px solid #ddd;
        }

        tr:hover {
          background-color: #f1f1f1;
        }

      .top-buttons {
        display: flex;
        justify-content: center;
        margin-top: 20px;
        margin-bottom: 20px;
      }

      .button {
        padding: 10px 20px;
        font-size: 16px;
        background-color: #3498db;
        border: none;
        color: white;
        border-radius: 8px;
        cursor: pointer;
        transition: 0.3s ease;
        text-decoration: none;
      }
      .button:hover {
        background-color: #2980b9;
      }


      </style>
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
  

// Rota para encerrar a sessão (logout)
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) throw err;
    res.redirect('/'); // volta para login
  });
});

// Inicia o servidor
app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
