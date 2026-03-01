const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);

app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// --- ROTAS LIMPAS ---
app.get('/painel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'professor.html'));
});

// --- SEGURANÇA ---
const ADMIN_USER = process.env.ADMIN_USER || "wilson";
const ADMIN_PASS = process.env.ADMIN_PASS || "wilson@4321";

app.post('/api/login', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === ADMIN_USER && senha === ADMIN_PASS) {
        res.json({ sucesso: true });
    } else {
        res.status(401).json({ sucesso: false, mensagem: "Credenciais inválidas" });
    }
});

// --- LÓGICA DO JOGO ---
const salas = {};

// Função para gerar código aleatório com N dígitos
function gerarCodigoAleatorio(qtdDigitos) {
    const digitos = Math.max(3, Math.min(10, qtdDigitos || 6)); // Entre 3 e 10, padrão 6
    const min = Math.pow(10, digitos - 1);
    const max = Math.pow(10, digitos) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

// Função auxiliar para criar a estrutura de votos correta
function montarObjetoVotos(config) {
    const votos = {};
    if (config.tipoPergunta === 'certo_errado') {
        votos['Certo'] = 0;
        votos['Errado'] = 0;
    } else if (config.tipoPergunta === 'multipla_escolha') {
        const letras = ['A', 'B', 'C', 'D', 'E', 'F'];
        const qtd = parseInt(config.qtdOpcoes) || 4;
        for (let i = 0; i < qtd; i++) {
            votos[letras[i]] = 0;
        }
    }
    return votos;
}

io.on('connection', (socket) => {
    const clientIp = socket.handshake.address;

    socket.on('criar_sala', (opcoes) => {
        // opcoes pode ter: { codigoManual, qtdDigitos }
        let codigo;

        if (opcoes && opcoes.codigoManual && opcoes.codigoManual.trim() !== '') {
            // Código manual digitado pelo professor
            const codigoManual = opcoes.codigoManual.trim();

            // Validação: só aceita números
            if (!/^\d+$/.test(codigoManual)) {
                socket.emit('erro_criar_sala', 'O código deve conter apenas números.');
                return;
            }

            // Validação: entre 3 e 10 dígitos
            if (codigoManual.length < 3 || codigoManual.length > 10) {
                socket.emit('erro_criar_sala', 'O código deve ter entre 3 e 10 dígitos.');
                return;
            }

            // Validação: sala já existe
            if (salas[codigoManual]) {
                socket.emit('erro_criar_sala', 'Esse código já está em uso. Escolha outro.');
                return;
            }

            codigo = codigoManual;
        } else {
            // Código aleatório com N dígitos
            const qtdDigitos = (opcoes && opcoes.qtdDigitos) ? parseInt(opcoes.qtdDigitos) : 6;
            let tentativas = 0;
            do {
                codigo = gerarCodigoAleatorio(qtdDigitos);
                tentativas++;
                if (tentativas > 100) {
                    socket.emit('erro_criar_sala', 'Não foi possível gerar um código único. Tente outra quantidade de dígitos.');
                    return;
                }
            } while (salas[codigo]);
        }

        socket.join(codigo);
        
        // Configuração Inicial Padrão
        const configInicial = {
            tipoPergunta: 'multipla_escolha',
            modoSelecao: 'unica',
            qtdOpcoes: 4
        };

        salas[codigo] = {
            config: configInicial,
            votos: montarObjetoVotos(configInicial),
            respostasDiscursivas: [],
            total: 0,
            voters: new Set()
        };
        
        socket.emit('sala_criada', codigo);
        socket.emit('atualizar_config_aluno', salas[codigo].config);
    });

    socket.on('entrar_sala', (dados) => {
        const { codigo } = dados;
        if (salas[codigo]) {
            socket.join(codigo);
            socket.emit('entrada_ok');
            socket.emit('atualizar_config_aluno', salas[codigo].config);
            socket.emit('atualizar_stats_aluno', { total: salas[codigo].total });
            
            if (salas[codigo].voters.has(clientIp)) {
                 socket.emit('bloquear_voto');
            }
        } else {
            socket.emit('erro_sala', 'Sala não encontrada.');
        }
    });

    socket.on('alterar_config', (dados) => {
        const { codigo, novaConfig } = dados;
        if (salas[codigo]) {
            salas[codigo].config = novaConfig;
            
            salas[codigo].votos = montarObjetoVotos(novaConfig);
            salas[codigo].respostasDiscursivas = [];
            salas[codigo].total = 0;
            salas[codigo].voters.clear();
            
            io.to(codigo).emit('atualizar_config_aluno', novaConfig);
            io.to(codigo).emit('atualizar_grafico', salas[codigo].votos);
            io.to(codigo).emit('atualizar_discursivas', []);
            io.to(codigo).emit('reset_aluno');
            io.to(codigo).emit('atualizar_stats_aluno', { total: 0 });
        }
    });

    socket.on('enviar_resposta', (dados) => {
        const { codigo, respostas } = dados;

        if (salas[codigo]) {
            if (salas[codigo].voters.has(clientIp)) {
                socket.emit('erro_voto', 'Você já respondeu!');
                return;
            }

            if (salas[codigo].config.tipoPergunta === 'discursiva') {
                salas[codigo].respostasDiscursivas.push(respostas);
                io.to(codigo).emit('atualizar_discursivas', salas[codigo].respostasDiscursivas);
            } else {
                if (Array.isArray(respostas)) {
                    respostas.forEach(opcao => {
                        if (salas[codigo].votos[opcao] !== undefined) salas[codigo].votos[opcao]++;
                    });
                } else {
                    if (salas[codigo].votos[respostas] !== undefined) salas[codigo].votos[respostas]++;
                }
                io.to(codigo).emit('atualizar_grafico', salas[codigo].votos);
            }
            
            salas[codigo].voters.add(clientIp);
            salas[codigo].total++;
            io.to(codigo).emit('atualizar_stats_aluno', { total: salas[codigo].total });
            socket.emit('voto_confirmado');
        }
    });

    socket.on('resetar_sala', (codigo) => {
        if (salas[codigo]) {
            const chaves = Object.keys(salas[codigo].votos);
            chaves.forEach(k => salas[codigo].votos[k] = 0);
            
            salas[codigo].respostasDiscursivas = [];
            salas[codigo].total = 0;
            salas[codigo].voters.clear();

            io.to(codigo).emit('atualizar_grafico', salas[codigo].votos);
            io.to(codigo).emit('atualizar_discursivas', []);
            io.to(codigo).emit('reset_aluno');
            io.to(codigo).emit('atualizar_stats_aluno', { total: 0 });
        }
    });

    socket.on('encerrar_sala', (codigo) => {
        if (salas[codigo]) {
            // Primeiro notifica todos
            io.to(codigo).emit('sala_encerrada');
            
            // Converte para array ANTES de iterar (evita problemas de modificação durante iteração)
            const socketsNaSala = io.sockets.adapter.rooms.get(codigo);
            if (socketsNaSala) {
                const socketIds = [...socketsNaSala];
                socketIds.forEach(socketId => {
                    io.sockets.sockets.get(socketId)?.leave(codigo);
                });
            }
            
            // Remove a sala da memória
            delete salas[codigo];
            console.log(`Sala ${codigo} encerrada e removida.`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`GitWil Seguro rodando em http://localhost:${PORT}`);
});