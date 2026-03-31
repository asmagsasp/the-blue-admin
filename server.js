const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Supabase Configuration
// Em Vercel, defina essas chaves em Settings > Environment Variables
const supabaseUrl = process.env.SUPABASE_URL || 'URL_AQUI_SE_FOR_RODAR_LOCAL';
const supabaseKey = process.env.SUPABASE_KEY || 'CHAVE_AQUI_SE_FOR_RODAR_LOCAL';

const supabase = createClient(supabaseUrl, supabaseKey);

// Rotas da API (CRUD)

// 1. Criar novo usuário
app.post('/usuarios', async (req, res) => {
    const { nome, sexo, telefone, chave_pix, foto, sugestoes } = req.body;
    
    if (!nome || !sexo || !telefone || !chave_pix) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios precisam estar preenchidos' });
    }
    
    const { data, error } = await supabase
        .from('usuarios')
        .insert([{ nome, sexo, telefone, chave_pix, foto: foto || null, sugestoes: sugestoes || null }])
        .select();
        
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json(data[0]);
});

// 2. Listar usuários
app.get('/usuarios', async (req, res) => {
    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('id', { ascending: false });
        
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    
    res.json(data);
});

// 3. Atualizar usuário
app.put('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, sexo, telefone, chave_pix, foto, sugestoes } = req.body;
    
    if (!nome || !sexo || !telefone || !chave_pix) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios precisam estar preenchidos' });
    }
    
    const { data, error } = await supabase
        .from('usuarios')
        .update({ nome, sexo, telefone, chave_pix, foto: foto || null, sugestoes: sugestoes || null })
        .eq('id', id)
        .select();
        
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    
    if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado no Supabase' });
    }
    
    res.json(data[0]);
});

// 4. Deletar usuário
app.delete('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    
    const { data, error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id)
        .select();
        
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    
    if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado no Supabase' });
    }
    
    res.json({ message: 'Usuário deletado com sucesso' });
});

// Configuração para Serverless Vercel
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

module.exports = app;
