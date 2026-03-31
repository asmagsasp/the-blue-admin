const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const dbPath = process.env.VERCEL ? '/tmp/database.sqlite' : './database.sqlite';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar com banco de dados SQLite', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            sexo TEXT NOT NULL,
            telefone TEXT NOT NULL,
            chave_pix TEXT NOT NULL
        )`);
    }
});

// Routes

// Create User
app.post('/usuarios', (req, res) => {
    const { nome, sexo, telefone, chave_pix } = req.body;
    if (!nome || !sexo || !telefone || !chave_pix) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    const sql = 'INSERT INTO usuarios (nome, sexo, telefone, chave_pix) VALUES (?, ?, ?, ?)';
    db.run(sql, [nome, sexo, telefone, chave_pix], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, nome, sexo, telefone, chave_pix });
    });
});

// List Users
app.get('/usuarios', (req, res) => {
    const sql = 'SELECT * FROM usuarios ORDER BY id DESC';
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Update User
app.put('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { nome, sexo, telefone, chave_pix } = req.body;
    if (!nome || !sexo || !telefone || !chave_pix) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    const sql = 'UPDATE usuarios SET nome = ?, sexo = ?, telefone = ?, chave_pix = ? WHERE id = ?';
    db.run(sql, [nome, sexo, telefone, chave_pix, id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ id, nome, sexo, telefone, chave_pix });
    });
});

// Delete User
app.delete('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM usuarios WHERE id = ?';
    db.run(sql, id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ message: 'Usuário deletado com sucesso' });
    });
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

module.exports = app;
