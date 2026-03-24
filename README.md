# GitWil — Documentação Completa do Projeto

---

## 1. Visão Geral do Projeto

O **GitWil** é uma plataforma web acadêmica de interação em tempo real em sala de aula, inspirada em ferramentas como Kahoot e Mentimeter. Foi desenvolvido para uso pessoal do professor **Wilson Amaral**, permitindo que ele crie sessões interativas nas quais os alunos respondem a perguntas diretamente pelo celular ou computador, com os resultados sendo exibidos em tempo real por meio de gráficos dinâmicos e painéis visuais.

O sistema funciona como uma aplicação cliente-servidor onde o professor cria uma sala com um código numérico de 4 dígitos e os alunos se conectam através de um QR Code ou inserindo o código manualmente na página inicial. Toda a comunicação em tempo real é feita via WebSockets (Socket.IO), garantindo que as respostas dos alunos apareçam instantaneamente no painel do professor.

### 1.1. Objetivos do Projeto

O projeto atende aos seguintes objetivos: proporcionar ao professor uma ferramenta própria e personalizável para dinamizar aulas presenciais ou remotas; permitir a coleta de respostas dos alunos em tempo real com visualização gráfica imediata; oferecer múltiplos modos de questão (múltipla escolha, certo/errado e discursiva); funcionar em qualquer dispositivo com navegador web, sem necessidade de instalação de aplicativos; e fornecer controle total ao professor sobre a sessão, incluindo reset de votos, alteração de configurações e personalização visual dos gráficos.

### 1.2. Público-Alvo

O sistema possui dois perfis de usuário: o **Professor** (administrador), que acessa o painel protegido por autenticação e gerencia toda a sessão, e os **Alunos** (participantes), que acessam a interface de votação através do código da sala, sem necessidade de cadastro ou login.

---

## 2. Arquitetura e Stack Tecnológica

### 2.1. Tecnologias Utilizadas

O projeto utiliza a seguinte stack:

**Back-End:** Node.js com Express 5.2.1 como framework HTTP e Socket.IO 4.8.1 para comunicação em tempo real via WebSockets. O servidor é executado com Nodemon 3.1.11 (em desenvolvimento) para hot-reload automático.

**Front-End:** HTML5, CSS3 e JavaScript puro (Vanilla JS) sem frameworks como React ou Vue. A estilização é feita com Bootstrap 5 para o layout responsivo, Bootstrap Icons para iconografia, Chart.js com o plugin ChartDataLabels para renderização de gráficos interativos, QRCode.js para geração de QR Codes dinâmicos, e AOS (Animate On Scroll) para animações na landing page.

**Fontes:** A tipografia padrão é Nunito (Google Fonts), utilizada em toda a interface.

### 2.2. Padrão de Arquitetura

O GitWil segue um padrão de arquitetura monolítica simples. O servidor Express serve os arquivos estáticos do front-end e gerencia simultaneamente as conexões WebSocket. Não há banco de dados — todo o estado das salas é mantido em memória no objeto JavaScript `salas` no servidor. Isso significa que os dados são voláteis e se perdem quando o servidor é reiniciado, o que é adequado para o propósito acadêmico do projeto onde as sessões são temporárias.

### 2.3. Fluxo de Comunicação

A comunicação entre o professor, o servidor e os alunos funciona da seguinte maneira. O professor faz login no painel e emite o evento `criar_sala` via Socket.IO. O servidor gera um código de 4 dígitos, cria a estrutura de dados da sala em memória e responde com o evento `sala_criada`. O aluno acessa a URL com o código (via QR Code ou digitando manualmente) e emite o evento `entrar_sala`. O servidor verifica se a sala existe, autoriza a entrada com `entrada_ok` e envia a configuração atual da questão. Quando o aluno responde, emite `enviar_resposta`. O servidor processa o voto, atualiza os totais e emite `atualizar_grafico` (ou `atualizar_discursivas`) para todos os conectados à sala. O painel do professor atualiza o gráfico em tempo real sem necessidade de refresh.

---

## 3. Estrutura de Arquivos e Diretórios

A estrutura principal do projeto é a seguinte:

```
Código/
├── server.js                  # Servidor principal (Express + Socket.IO)
├── package.json               # Definição de dependências do projeto
├── package-lock.json          # Lockfile de dependências
├── node_modules/              # Dependências instaladas
└── public/                    # Arquivos estáticos servidos pelo Express
    ├── index.html             # Página inicial (entrada do aluno)
    ├── aluno.html             # Interface de votação do aluno
    ├── professor.html         # Painel administrativo do professor
    ├── service-details.html   # Página auxiliar (template)
    ├── starter-page.html      # Página auxiliar (template)
    ├── Readme.txt             # Readme do template base
    ├── forms/
    │   ├── contact.php        # Formulário de contato (do template base)
    │   └── Readme.txt
    └── assets/
        ├── css/
        │   └── main.css       # Estilos globais e sistema de temas
        ├── js/
        │   └── main.js        # JavaScript da landing page
        ├── img/
        │   ├── dark.png       # Logo para o tema escuro
        │   ├── light.png      # Logo para o tema claro
        │   └── favicon/       # Favicons (vários tamanhos)
        ├── scss/
        │   └── Readme.txt
        └── vendor/            # Bibliotecas de terceiros
            ├── bootstrap/     # Bootstrap 5 (CSS e JS)
            ├── bootstrap-icons/
            ├── aos/           # Animate On Scroll
            ├── glightbox/     # Lightbox para imagens
            ├── swiper/        # Carrossel
            └── purecounter/   # Contadores animados
```

---

## 4. Detalhamento do Back-End (server.js)

O arquivo `server.js` é o coração do projeto, contendo toda a lógica do servidor em aproximadamente 160 linhas de código.

### 4.1. Inicialização do Servidor

O servidor é criado usando Express e HTTP, com o Socket.IO acoplado para WebSockets. O Express serve arquivos estáticos da pasta `public/` e processa requisições JSON para a API de login. O servidor escuta na porta 3000.

### 4.2. Sistema de Autenticação

A autenticação é feita via uma rota REST (`POST /api/login`) que valida credenciais hardcoded no código. O usuário padrão é `admin` e a senha padrão é `1234`. Ao enviar as credenciais corretas, o servidor retorna `{ sucesso: true }`. Em caso de falha, retorna status 401 com `{ sucesso: false, mensagem: "Credenciais inválidas" }`. É importante destacar que este mecanismo é simplificado para uso acadêmico e não utiliza tokens JWT, sessões ou hashing de senhas.

### 4.3. Estrutura de Dados das Salas

Cada sala é armazenada no objeto `salas` com a seguinte estrutura:

```javascript
salas[codigo] = {
    config: {
        tipoPergunta: 'multipla_escolha' | 'certo_errado' | 'discursiva',
        modoSelecao: 'unica' | 'multipla',
        qtdOpcoes: 2 | 3 | 4 | 5 | 6
    },
    votos: { A: 0, B: 0, C: 0, D: 0 },   // Chaves dinâmicas
    respostasDiscursivas: [],               // Array de textos
    total: 0,                               // Total de participantes
    voters: new Set()                       // IPs que já votaram
}
```

A função `montarObjetoVotos(config)` cria dinamicamente o objeto de votos: para `certo_errado` gera `{ Certo: 0, Errado: 0 }`; para `multipla_escolha` gera as letras correspondentes (por exemplo, `{ A: 0, B: 0, C: 0, D: 0 }` para 4 opções); para `discursiva` o objeto de votos não é utilizado, sendo as respostas armazenadas no array `respostasDiscursivas`.

### 4.4. Eventos Socket.IO

O servidor gerencia os seguintes eventos:

**`criar_sala`** — Gera um código aleatório de 4 dígitos (entre 1000 e 9999), cria a estrutura da sala em memória, coloca o socket do professor na room do Socket.IO e emite de volta o código da sala com a configuração inicial.

**`entrar_sala`** — Verifica se a sala existe, adiciona o aluno à room, envia a configuração atual da questão e verifica se o IP do aluno já votou anteriormente (se sim, bloqueia o voto).

**`alterar_config`** — Permite ao professor mudar o tipo de questão em tempo real. Quando alterada, a sala é resetada (votos zerados, IPs liberados) e todos os clientes conectados recebem a nova configuração.

**`enviar_resposta`** — Processa a resposta do aluno. Para questões objetivas, incrementa o contador do voto correspondente. Para discursivas, adiciona o texto ao array de respostas. O IP do aluno é registrado no Set de voters para prevenir votos duplicados.

**`resetar_sala`** — Zera todos os votos mantendo a estrutura atual (tipo de questão e quantidade de opções), limpa o array de respostas discursivas, reseta o total e libera todos os IPs para votarem novamente.

### 4.5. Controle Anti-Voto Duplicado

O sistema de prevenção de votos duplicados é baseado no endereço IP do cliente (`socket.handshake.address`). Quando um aluno envia uma resposta, seu IP é adicionado a um `Set`. Se o mesmo IP tentar votar novamente, o servidor emite `erro_voto`. Essa abordagem funciona bem em redes onde cada dispositivo possui IP único, mas pode ter limitações em redes com NAT (onde vários alunos compartilham o mesmo IP público).

---

## 5. Detalhamento do Front-End

### 5.1. Página Inicial (index.html)

A página inicial é a porta de entrada dos alunos no sistema. Ela apresenta o logo do GitWil (com versões para tema claro e escuro), um campo de entrada para o código de 4 dígitos da sala e um botão de alternância de tema (claro/escuro).

O campo de código aceita apenas dígitos numéricos, com limite de 4 caracteres. A submissão pode ser feita pressionando Enter ou clicando no botão "Entrar". Ao submeter, o aluno é redirecionado para `aluno.html?codigo=XXXX`, onde XXXX é o código digitado.

O tema escolhido pelo usuário é salvo no `localStorage` do navegador com a chave `gitwil-theme`, garantindo persistência entre sessões.

### 5.2. Interface do Aluno (aluno.html)

Após entrar na sala, o aluno visualiza uma interface limpa e responsiva projetada para uso em celulares. A tela é composta por um contador global de respostas no topo, um título indicando o modo atual da questão, botões de opção (para questões objetivas) ou área de texto (para questões discursivas), e uma mensagem de confirmação após o envio da resposta.

**Fluxo de interação do aluno:** ao carregar a página, o código da sala é extraído da URL e o socket emite `entrar_sala`. Se a sala existe, o servidor responde com `entrada_ok` e a configuração atual. A interface é renderizada dinamicamente com base no tipo de questão.

Para **questões de seleção única** (múltipla escolha ou certo/errado com modo "única"), o aluno clica em um botão e a resposta é enviada imediatamente com uma animação de loading seguida de um check de confirmação.

Para **questões de seleção múltipla**, o aluno seleciona várias opções (que ficam destacadas visualmente) e confirma clicando no botão "Enviar Resposta".

Para **questões discursivas**, é exibida uma área de texto (textarea) onde o aluno digita sua resposta livremente e confirma o envio.

Após enviar a resposta, a interface exibe uma mensagem de "Resposta Enviada!" e os botões são ocultados. Quando o professor reseta a sala ou altera a configuração, o evento `reset_aluno` desbloqueia a interface para o aluno votar novamente.

### 5.3. Painel do Professor (professor.html)

O painel do professor é a interface mais completa e complexa do sistema. Ele é dividido em duas telas principais:

**Tela de Login:** Um overlay de tela cheia com campos de usuário e senha. Ao fazer login com sucesso, o overlay desaparece com uma transição suave (fade-out de 500ms) revelando o dashboard.

**Tela de Início (sem sessão ativa):** Exibe um botão centralizado "Iniciar Sessão" e um botão para fazer logout. Quando o professor clica em "Iniciar Sessão", o socket emite `criar_sala`.

**Dashboard (com sessão ativa):** Após criar a sala, o painel apresenta os seguintes elementos:

*Barra superior:* Exibe o código de acesso da sala em tamanho grande, o total de respostas recebidas e o QR Code gerado automaticamente com a URL de acesso dos alunos. O QR Code pode ser copiado para a área de transferência ou baixado como imagem PNG.

*Painel de Controles (coluna esquerda):* Contém seletor de tipo de questão (Múltipla Escolha, Certo/Errado, Discursiva); seletor de quantidade de opções (2 a 6, disponível apenas para múltipla escolha); seletor de modo de seleção (Única ou Múltipla); seletores de cor individual para cada opção de resposta (color pickers circulares com reset para paleta padrão); seletores de tipo de gráfico com 6 opções (Barras, Pizza, Rosca, Linha, Polar, Radar); toggle para exibir/ocultar valores nos gráficos; seletor entre exibição numérica ou percentual; botão para copiar o gráfico como imagem; botão "Limpar Respostas" (reseta votos sem alterar configuração); e botão "Encerrar Sessão" (volta à tela inicial).

*Área de Visualização (coluna direita):* Para questões objetivas, exibe o gráfico do Chart.js com atualização em tempo real a cada voto recebido. Para questões discursivas, exibe as respostas em formato de "post-it cards" coloridos dispostos em grid, com animação de hover e efeito de sombra luminosa (glow).

---

## 6. Sistema de Temas (Dark/Light Mode)

O GitWil implementa um sistema completo de temas claro e escuro usando CSS Custom Properties (variáveis CSS). O tema padrão é o escuro.

As variáveis de tema são definidas no `:root` (escuro) e sobrescritas em `body.light-mode` (claro). As principais variáveis são:

| Variável | Tema Escuro | Tema Claro |
|----------|-------------|------------|
| `--bg-color` | `#121212` | `#f4f7f5` |
| `--text-primary` | `#ffffff` | `#212529` |
| `--surface-color` | `#1e1e1e` | `#ffffff` |
| `--accent-color` | `#0d83fd` | `#0d83fd` |
| `--border-color` | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.1)` |

A cor de destaque (`--accent-color`) permanece a mesma em ambos os temas, mantendo a identidade visual azul do GitWil.

A alternância de tema é feita adicionando/removendo a classe `light-mode` do `<body>`, e a preferência é persistida em `localStorage` com a chave `gitwil-theme`.

No painel do professor, a alternância de tema também atualiza as cores do Chart.js (textos dos eixos, linhas de grade, legendas).

---

## 7. Sistema de Gráficos

O painel do professor utiliza o Chart.js para renderizar gráficos das respostas em tempo real. As funcionalidades de gráfico incluem:

**6 tipos de gráfico disponíveis:** Barras (bar), Pizza (pie), Rosca (doughnut), Linha (line), Polar Area (polarArea) e Radar (radar). A troca entre os tipos é feita sem perda de dados — os votos atuais são preservados durante a mudança.

**Paleta de cores padrão:** A paleta segue as cores do Bootstrap — azul (#0d6efd), vermelho (#dc3545), amarelo (#ffc107), verde (#198754), roxo (#6610f2) e laranja (#fd7e14). Cada cor pode ser personalizada individualmente pelo professor usando color pickers.

**Plugin DataLabels:** Permite exibir os valores diretamente sobre as barras ou fatias do gráfico, com opção de mostrar valores numéricos absolutos ou percentuais.

**Exportação de gráfico:** O gráfico pode ser copiado para a área de transferência como imagem PNG (com fundo branco e texto preto para garantir legibilidade) ou baixado como arquivo.

---

## 8. Guia de Instalação e Execução

### 8.1. Pré-requisitos

Para executar o GitWil é necessário ter o **Node.js** (versão 14 ou superior) e o **npm** (gerenciador de pacotes do Node.js) instalados na máquina.

### 8.2. Instalação

1. Extraia os arquivos do projeto para um diretório local.
2. Abra o terminal e navegue até o diretório do projeto (onde se encontra o `server.js`).
3. Instale as dependências com o comando:

```bash
npm install
```

Este comando instala o Express, o Socket.IO e o Nodemon automaticamente.

### 8.3. Execução

Para iniciar o servidor em modo de desenvolvimento (com hot-reload), execute:

```bash
npx nodemon server.js
```

Para iniciar sem hot-reload:

```bash
node server.js
```

Após iniciar, o terminal exibirá a mensagem:

```
🚀 GitWil Seguro rodando em http://localhost:3000
```

### 8.4. Acesso

Abra o navegador e acesse `http://localhost:3000` para ver a página inicial. Para acessar o painel do professor, navegue até `http://localhost:3000/professor.html` e faça login com as credenciais padrão (usuário: `admin`, senha: `1234`).

Para que os alunos acessem de outros dispositivos na mesma rede local, substitua `localhost` pelo IP da máquina que está executando o servidor (por exemplo, `http://192.168.1.100:3000`).

---

## 9. Guia de Uso — Passo a Passo

### 9.1. Fluxo do Professor

1. Acesse `/professor.html` e faça login.
2. Clique em **"Iniciar Sessão"** para criar uma nova sala.
3. Compartilhe o código de 4 dígitos ou o QR Code com os alunos (o QR Code pode ser copiado ou baixado clicando no botão "Copiar QR").
4. Configure o tipo de questão desejado no painel de controles à esquerda.
5. Acompanhe os votos chegando em tempo real pelo gráfico.
6. Personalize a visualização: troque o tipo de gráfico, altere as cores, alterne entre valores numéricos e percentuais.
7. Para uma nova pergunta, clique em **"Limpar Respostas"** — isso zera os votos e libera os alunos para responderem novamente.
8. Para mudar o tipo de questão (por exemplo, de múltipla escolha para discursiva), altere o seletor — isso automaticamente reseta os votos e reconfigura a interface dos alunos.
9. Ao final da aula, clique em **"Encerrar Sessão"** ou **"Sair do Painel"**.

### 9.2. Fluxo do Aluno

1. Acesse a URL do GitWil (ou escaneie o QR Code fornecido pelo professor).
2. Na página inicial, digite o código de 4 dígitos da sala e clique em "Entrar".
3. Aguarde a tela de votação carregar com a questão configurada pelo professor.
4. Selecione sua resposta (clicando no botão correspondente) ou digite o texto (em questões discursivas).
5. Após enviar, aguarde a mensagem de confirmação "Resposta Enviada!".
6. Quando o professor passar para a próxima questão (limpar respostas ou alterar configuração), a interface será automaticamente desbloqueada para uma nova resposta.

---

## 10. Eventos Socket.IO — Referência Completa

### 10.1. Eventos do Cliente para o Servidor

| Evento | Origem | Dados | Descrição |
|--------|--------|-------|-----------|
| `criar_sala` | Professor | — | Solicita criação de uma nova sala |
| `entrar_sala` | Aluno | `{ codigo }` | Solicita entrada em uma sala existente |
| `alterar_config` | Professor | `{ codigo, novaConfig }` | Altera configuração da questão |
| `enviar_resposta` | Aluno | `{ codigo, respostas }` | Envia a resposta do aluno |
| `resetar_sala` | Professor | `codigo` (string) | Zera votos mantendo configuração |

### 10.2. Eventos do Servidor para o Cliente

| Evento | Destino | Dados | Descrição |
|--------|---------|-------|-----------|
| `sala_criada` | Professor | `codigo` (string) | Informa o código da sala criada |
| `entrada_ok` | Aluno | — | Confirma entrada na sala |
| `erro_sala` | Aluno | `mensagem` (string) | Sala não encontrada |
| `erro_voto` | Aluno | `mensagem` (string) | Voto duplicado detectado |
| `atualizar_config_aluno` | Todos | `{ tipoPergunta, modoSelecao, qtdOpcoes }` | Envia configuração atualizada |
| `atualizar_grafico` | Todos | `{ A: n, B: n, ... }` | Envia dados de votos atualizados |
| `atualizar_discursivas` | Todos | `[string, ...]` | Envia array de respostas textuais |
| `atualizar_stats_aluno` | Todos | `{ total }` | Envia total de respostas |
| `voto_confirmado` | Aluno | — | Confirma recebimento do voto |
| `bloquear_voto` | Aluno | — | Sinaliza que o IP já votou |
| `reset_aluno` | Todos | — | Desbloqueia interface para novo voto |

---

## 11. API REST

O projeto possui uma única rota REST:

**`POST /api/login`**

Corpo da requisição (JSON):
```json
{
    "usuario": "admin",
    "senha": "1234"
}
```

Resposta de sucesso (200):
```json
{
    "sucesso": true
}
```

Resposta de erro (401):
```json
{
    "sucesso": false,
    "mensagem": "Credenciais inválidas"
}
```

---

## 12. Dependências do Projeto

### 12.1. Dependências de Produção

| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `express` | ^5.2.1 | Framework web para Node.js |
| `socket.io` | ^4.8.1 | Biblioteca de comunicação em tempo real via WebSockets |

### 12.2. Dependências de Desenvolvimento

| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `nodemon` | ^3.1.11 | Monitor de alterações para reinício automático do servidor |

### 12.3. Bibliotecas Front-End (CDN e Vendor)

| Biblioteca | Versão | Uso |
|------------|--------|-----|
| Bootstrap | 5.x | Layout responsivo e componentes UI |
| Bootstrap Icons | — | Ícones vetoriais |
| Chart.js | Última via CDN | Renderização de gráficos |
| chartjs-plugin-datalabels | 2.0.0 | Rótulos de dados nos gráficos |
| QRCode.js | 1.0.0 | Geração de QR Codes no navegador |
| AOS (Animate On Scroll) | — | Animações de scroll na landing page |
| GLightbox | — | Lightbox para imagens |
| Swiper | — | Carrossel |
| PureCounter | — | Contadores animados |
| Nunito (Google Fonts) | — | Fonte tipográfica do projeto |

---

## 13. Considerações de Segurança

Por ser um projeto acadêmico de uso pessoal, o GitWil adota uma abordagem simplificada de segurança. Os seguintes pontos devem ser considerados:

As credenciais de login estão hardcoded no código-fonte (`admin` / `1234`), sem hashing ou criptografia. Não há sistema de tokens ou sessões — se o navegador do professor for atualizado, ele precisará fazer login novamente, mas não há expiração de sessão. O controle de voto duplicado é baseado em IP, o que pode ser insuficiente em redes com NAT onde vários dispositivos compartilham o mesmo IP público. O servidor não implementa HTTPS — para uso em produção, seria necessário configurar um proxy reverso (como Nginx) com certificado SSL. Não há sanitização avançada de entrada nas respostas discursivas — em ambientes não controlados, isso poderia representar risco de injeção de conteúdo.

---

## 14. Limitações Conhecidas

Os dados das salas existem apenas em memória e são perdidos ao reiniciar o servidor. Não há histórico de sessões ou exportação de dados para análise posterior. A autenticação é básica e não suporta múltiplos professores com credenciais diferentes. Apenas uma sala pode ser gerenciada por vez por janela de navegador do professor. O controle de voto por IP pode falhar em redes NAT ou quando alunos usam VPN. Não há limite de participantes por sala (a escalabilidade depende dos recursos do servidor).

---

## 15. Possíveis Melhorias Futuras

Para evoluções futuras do projeto, poderiam ser consideradas as seguintes melhorias: integração com banco de dados (como MongoDB ou SQLite) para persistência de dados e histórico de sessões; sistema de autenticação robusto com JWT e hashing de senhas; suporte a múltiplas salas simultâneas por professor; exportação de resultados em formatos como CSV, PDF ou Excel; temporizador para questões com contagem regressiva; nuvem de palavras para respostas discursivas; deploy com HTTPS via serviços como Railway, Render ou VPS com Nginx; e PWA (Progressive Web App) para instalação no celular como aplicativo.

---

## 16. Resultado - Demonstração



https://github.com/user-attachments/assets/98d36719-aacb-4053-a559-1168c28166aa



---


*Documentação elaborada para o projeto acadêmico GitWil — Plataforma de Interação em Sala de Aula em Tempo Real.*
*Professor Wilson Amaral.*

*Assinado: João Paulo Manzioli Silva*
