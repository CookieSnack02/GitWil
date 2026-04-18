require('dotenv').config();

const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");
const crypto = require('crypto');

// 1. IMPORTANDO E CONFIGURANDO O CORS (Essencial para separar Front e Back)
const cors = require('cors');

const server = http.createServer(app);

// 2. CONFIGURANDO O SOCKET.IO PARA ACEITAR SUA HOSPEDAGEM
const io = new Server(server, {
    cors: {
        origin: ["https://gitwil.com.br", "https://www.gitwil.com.br", "http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"]
    }
});

app.use(express.json()); 

// 3. CONFIGURANDO O EXPRESS PARA ACEITAR O LOGIN DA SUA HOSPEDAGEM
app.use(cors({ 
    origin: ["https://gitwil.com.br", "https://www.gitwil.com.br", "http://localhost:3000", "http://127.0.0.1:3000"] 
}));

const publicDir = path.join(__dirname, 'public');

app.use(express.static(publicDir));

app.get('/', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/aluno', (_req, res) => {
    res.sendFile(path.join(publicDir, 'aluno.html'));
});

app.get('/painel', (_req, res) => {
    res.sendFile(path.join(publicDir, 'professor.html'));
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
    console.log(`API do GitWil rodando na porta ${PORT}`);
});
