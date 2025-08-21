const express = require('express');
const cors = require('cors');
const connection = require('./db_config');
const app = express();

app.use(cors());
app.use(express.json());

const port = 3000;

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  connection.query(query, [email, password], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Erro no servidor.'
      });
    }

    if (results.length > 0) {
      res.json({
        success: true,
        message: 'Login completo'
      });
    } else {
      res.json({
        success: false,
        message: 'Usuário ou senha incorretos'
      });
    }
  });
});

app.post('/cadastro', (req, res) => {
    const { name, email, password} = req.body;
    const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    connection.query(query, [name, email, password], (err, result) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao cadastrar.' });
      }
      res.json({ 
        success: true, 
        message: 'Você foi cadastrado',
         id: result.insertId });
    });
  });

  app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));