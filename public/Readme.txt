TAREFAS A SEREM FEITAS: 

Problema de recarregar a página: Quando a sala é recarregada ela permanece aberta, mas pede para o usuário administrador realizar a criação da sala novamente, ou seja, ela faz um redirecionamento para a parte da criação com uma sala aberta. 
Solução: Quando recarregar a página, ela necessita aparecer conforme o código com que foi criado. 

Problema de carregamento/atualização: As respostas do GitWil são computadas, porém com um problema para o aluno e para o professor, há uma dificuldade de atualização de números de votações, não atualiza diretamente a contagem de respostas. 
Solução possível: Adquirir uma VPS para um sistema de atualização mais rápido, porém mais dispendioso para uma aplicação de pouca escalabilidade. 

Problema de bloqueamento de respostas: Muitas vezes quando reseta a votação dá a informação ao usuário como se ele já tivesse respondido e bloqueia ela de responder novamente, mesmo quando a votação foi resetada. 
Solução possível: Realizar uma verificação de como está sendo esse bloqueio e permitir que o usuário vote novamente quando resetado.

Problema de visualização da fonte do gráfico: A visualização da fonte do gráfico está muito pequena, quase invisível para enxergar em um projetor, eu preciso da necessidade de trocar para colocar uma fonte maior e com negrito, além do textcolor ser preto também. 
Solução: Realizar a pesquisa na API do ChartJS para a verificação da possibilidade de alterar a fonte dos valores dentro do gráfico para algo maior, com negrito e visível. 

Problema de copiar o gráfico no modo escuro: Quando é para clicar no botão de copiar gráfico no modo escuro, há um problema gigantesco, ele copia o gráfico, mas não aparece os valores nem nada, sendo assim, quando copiar ele deve aparecer os valores e as legendas do gráfico. 
Solução: Quando copiar no modo escuro, copiar igual está presente no modo claro. 

Problema de QR Code sempre mudar: Quando é criada uma nova sala, o QR Code tem que permanecer o mesmo porque ele será utilizado várias vezes durante a aula. 
Solução: Realizar a criação do QR Code apenas uma vez e ele dar acesso a todas as salas criadas a partir deste único QR Code que foi criado. 
