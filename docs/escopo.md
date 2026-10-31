# Morro Verde Hortifruti: Escopo do Protótipo (v4)

> Atualizado em 31/10/2026. Itens marcados com **[pendente]** dependem de definição do André.
> Mudança principal da v4: **o restaurante não tem login.** O catálogo é aberto. No fim da compra, o cliente digita só o telefone, o sistema busca o cadastro dele no SG e o pedido é concluído. **Só o ADM entra com senha.**
>
> Protótipo navegável: https://claude.ai/artifact/Rm2UPgJe4mNiMbYo4EdZZ4

## 1. Contexto

Venda de hortifruti em quantidade para restaurantes. O cliente é o restaurante.
O sistema tem duas partes:

- **App do restaurante** (web, mobile-first, público): catálogo da semana, montagem do pedido e identificação pelo telefone no fechamento.
- **Painel ADM** (web, desktop-first, com senha): pedidos recebidos, cadastro de clientes e lista de produtos e preços da semana.

Não há pagamento nem checkout no app.

## 2. Objetivo

O restaurante abre o link e, sem login e sem precisar ligar:

- vê o que está disponível na semana, quanto custa e qual a quantidade mínima;
- sabe até quando pode pedir e quando a entrega acontece;
- monta o pedido e, ao finalizar, **se identifica só com o telefone**;
- envia o pedido, que **cai direto no painel**.

A Morro Verde recebe todos os pedidos num só lugar, ligados ao cadastro do cliente, confirma cada um, sabe quanto comprar de cada produto e publica os preços da semana.

## 3. Fluxo do pedido

O fluxograma completo está no protótipo (artboard "Fluxo do pedido").

| # | Quem | Passo |
|---|---|---|
| 1 | Restaurante | Abre o link do catálogo (aberto, sem login). |
| 2 | Restaurante | Monta o pedido: produtos, quantidades, mínimo. |
| 3 | Restaurante | Finaliza o orçamento e digita o telefone. |
| 4 | Sistema (SG) | Busca o telefone no cadastro de clientes. |
| 5a | Restaurante | **Encontrado:** confere nome e endereço puxados do cadastro e envia (observação opcional). |
| 5b | — | **Não encontrado:** **[pendente, ver 10.1]**. |
| 6 | Sistema | Grava o pedido ligado ao cliente, com status **Novo**. |
| 7 | Restaurante | Vê a confirmação com o nº do pedido. WhatsApp disponível só como apoio. |
| 8 | ADM | Recebe o pedido no painel e confirma. |
| 9 | ADM | Entrega na sexta e marca como **Entregue**. |

Base do fluxo: o ADM entra no painel com senha e cadastra os restaurantes (nome, telefone, endereço). Esse cadastro é o que o passo 4 consulta.

## 4. Ciclo semanal (regra de negócio)

| Evento | Regra |
|---|---|
| Publicação de preços | Semanal, pelo painel ADM. O app mostra a data da publicação. |
| Validade dos preços | Até quinta-feira, 12h. |
| Recebimento de pedidos | Até quinta-feira, 12h. |
| Edição e cancelamento pelo cliente | Até quinta-feira, 12h **[pendente: como funciona sem login, ver 10.3]**. |
| Entrega | Toda sexta-feira. |
| Pedido mínimo para entrega | R$ 200 no protótipo **[pendente: confirmar valor e regra]**. |

## 5. Produtos (dados iniciais)

| # | Produto | Unidade de venda | Pedido mínimo | Observação no protótipo |
|---|---|---|---|---|
| 1 | Tomate | kg | 10 kg | |
| 2 | Cebola | kg | 5 kg | |
| 3 | Pimentão | kg | 2 kg | |
| 4 | Alho | kg | 2 kg | |
| 5 | Batata Reino | kg | 5 kg | |
| 6 | Cenoura | kg | 2 kg | |
| 7 | Abacaxi | kg | 5 kg | |
| 8 | Manga | kg | 10 kg | |
| 9 | Laranja | saco | 1 saco | saco de 20 kg **[pendente]** |
| 10 | Banana da terra | unidade | 10 unidades | por unidade **[pendente]** |
| 11 | Maracujá | saco | 1 saco | saco de 12 kg **[pendente]** |
| 12 | Morango | caixa | 1 caixa | caixa com 4 bandejas **[pendente]** |
| 13 | Limão | saco | 1 saco | saco de 20 kg **[pendente]** |

Preços no protótipo são fictícios.

## 6. App do restaurante (mobile-first, público)

### 6.1 Acesso
- **Sem login, sem senha e sem cadastro pelo cliente.** Qualquer pessoa com o link vê o catálogo.
- A identificação acontece só no fechamento do pedido, pelo telefone (ver 6.5).

### 6.2 Cabeçalho
- Logo da Morro Verde e botão de WhatsApp para dúvidas.
- O nome do restaurante só aparece depois da identificação pelo telefone **[pendente: lembrar o telefone no aparelho para os próximos pedidos?]**.

### 6.3 Status do ciclo (faixa discreta)
- **Aceitando pedidos**: tempo restante até quinta, 12h, e data da entrega. Ao tocar, abre "Como funciona".
- **Pedidos fechados**: data de reabertura e preços da semana como referência.

### 6.4 Catálogo e detalhe do produto
- Grade 2×N com imagem, nome, mínimo e preço. Filtros: Todos, Legumes, Frutas.
- "Adicionar" já coloca a quantidade mínima, com −/+ no card.
- Selos "Destaque" e "Novo" e marcação "Em falta", definidos no painel.
- Detalhe: imagem grande, preço, quantidade com atalhos (1×, 2× e 3× o mínimo), subtotal, forma de venda, prazo e entrega.

### 6.5 Fechamento do pedido
- Barra com total e progresso até o pedido mínimo; envio bloqueado abaixo do mínimo.
- Resumo com itens, total estimado e observação para a entrega (opcional).
- **Campo de telefone** → o sistema busca o cadastro → o cliente **confere nome e endereço** → envia.
- O pedido é gravado no sistema e cai direto no painel. Não existe outro canal de pedido.
- Tela de confirmação com o nº do pedido e o andamento (Recebido → Confirmado → Entregue).
- WhatsApp é só apoio ("Avisar também pelo WhatsApp").
- **[pendente]** Como exibir os dados do cadastro com segurança (ver 10.2).

### 6.6 Meus pedidos
- **[pendente, ver 10.3]** Sem login, ainda não está definido como o cliente acompanha o status, edita, cancela ou vê o histórico.

## 7. Painel ADM (desktop, com senha)

### 7.1 Acesso e navegação
- **Login com senha**, exclusivo do ADM **[pendente: telefone ou e-mail + senha? mais de um usuário ADM?]**.
- Menu lateral: Pedidos (com contador de novos), Clientes, Produtos e preços.
- Card da semana: data da entrega e horário do fechamento.

### 7.2 Pedidos
- Indicadores: aguardando confirmação, pedidos da semana, total estimado e clientes ativos sem pedido.
- Lista com número, data/hora de envio, cliente, bairro, itens, total e status. Todos os pedidos vêm do app.
- Filtros por status e busca por cliente ou número.
- Detalhe: cliente (responsável, telefone com link para WhatsApp, endereço), observação, itens e total.
- Ações: Confirmar, Marcar como entregue, Cancelar (com confirmação).
- **Totais por produto**: soma da semana por produto, que serve de lista de compra.

### 7.3 Clientes (base da identificação)
- Lista com restaurante, responsável, telefone, endereço, total de pedidos, último pedido e status (Ativo/Inativo). Busca.
- Cadastro e edição: nome*, responsável, **telefone* (chave de identificação no app, único)**, CNPJ (opcional), e-mail (opcional), um endereço de entrega, observações, ativo/inativo.
- Cliente inativo não consegue concluir pedido **[pendente: confirmar]**.
- Não há envio de link de acesso nem senha para o cliente.

### 7.4 Produtos e preços
- Tabela com produto, forma de venda, mínimo, preço da semana (editável), preço anterior, variação, disponibilidade (Disponível/Em falta) e selo (Destaque, Novo).
- Filtros: Todos, Legumes, Frutas, Em falta, Alterados.
- Alterações ficam "não publicadas" até o ADM clicar em **"Publicar lista da semana"**. Preço inválido bloqueia a publicação.

### 7.5 Status do pedido

| Status | Quem muda | O que o restaurante vê |
|---|---|---|
| Novo | Sistema, ao receber o pedido | Recebido |
| Confirmado | ADM | Confirmado |
| Entregue | ADM | Entregue |
| Cancelado | ADM (cliente **[pendente]**) | Cancelado |

## 8. Situação das telas do protótipo

| Artboard | Situação |
|---|---|
| Fluxo do pedido | **Vale.** Referência do fluxo v4. |
| Início · aceitando pedidos | Vale para catálogo, detalhe e resumo. **Ajustar:** tirar a identificação fixa do cabeçalho e colocar o passo do telefone antes do envio. |
| Detalhes do produto | Vale. |
| Início · pedidos fechados | Vale. Ajustar o cabeçalho como no Início. |
| Meus pedidos | **Em revisão** (depende de 10.3). |
| Entrar / Cadastrar restaurante / Primeiro acesso | **Descartadas para o cliente.** O login com senha passa a ser só do painel ADM. |
| ADM · Pedidos | Vale. |
| ADM · Clientes | Vale. **Ajustar:** remover o botão "Enviar link de primeiro acesso". |
| ADM · Produtos e preços | Vale. |
| Design system | Vale. |

## 9. Fora do escopo (v1)

- Login, senha e cadastro feitos pelo cliente.
- Pagamento, checkout e cobrança.
- Lançamento manual de pedidos pelo ADM (todo pedido vem do app).
- Notificações automáticas (push, WhatsApp automático) **[pendente: ver 10.5]**.
- Múltiplos endereços por cliente.
- Múltiplas cidades ou fornecedores.
- App nativo (a v1 é web responsiva).
- Relatórios financeiros e emissão de nota.

## 10. Perguntas em aberto

**10.1 Telefone não encontrado**
1. O que acontece? Opções: (a) mensagem "fale com a Morro Verde" com o WhatsApp; (b) cadastro rápido ali mesmo, aprovado pelo ADM; (c) o pedido entra como "cliente novo" para o ADM completar o cadastro.

**10.2 Segurança da identificação**
2. Quem souber o telefone de um restaurante vê o nome e o endereço dele e pode pedir em nome dele. Basta mostrar o endereço parcialmente ("Rua Itu…, 12…"), ou é melhor confirmar com um código enviado pelo WhatsApp?

**10.3 Acompanhamento sem login**
3. Como o cliente acompanha o status, edita ou cancela (até quinta, 12h) e vê o histórico? Exemplo: digitar o telefone em "Meus pedidos", ou receber um link do pedido.
4. O app deve lembrar o telefone no aparelho para os próximos pedidos?

**10.4 SG e cadastro**
5. O "SG" é o próprio painel ADM deste projeto, ou um sistema de gestão que vocês já usam? Se for um sistema que já existe, há API para consultar clientes?
6. Cliente inativo pode pedir?
7. Login do ADM: telefone ou e-mail + senha? Mais de um usuário ADM?

**10.5 Pedido e avisos**
8. O mínimo é por produto, pelo total do pedido, ou os dois? O ADM pode aceitar um pedido abaixo do mínimo?
9. Um restaurante pode ter mais de um pedido na mesma semana?
10. Como o ADM fica sabendo de pedido novo, editado ou cancelado: só pelo painel, ou também por WhatsApp/e-mail?

**10.6 Pesagem e valores** **[pendente]**
11. Depois da pesagem, o ADM ajusta quantidades/valores? O cliente vê o valor final?
12. Existe faixa de preço por quantidade?

**10.7 Produtos e conteúdo**
13. O ADM precisa cadastrar produtos novos e editar mínimo e forma de venda, ou só preço, disponibilidade e selo?
14. A lista de compra precisa ser impressa ou exportada (PDF/planilha)?
15. Área atendida (bairros/cidades) ou taxa de entrega?
16. Peso dos sacos de laranja, limão e maracujá e conteúdo da caixa de morango.
17. Banana da terra: por unidade, dúzia ou cacho?
18. Fotos reais dos produtos? Dados de origem e variedade?
19. Verduras e folhas entram depois?
20. Número de WhatsApp da Morro Verde.

## 11. Decisões já tomadas

- Catálogo aberto; o cliente se identifica só pelo telefone no fim da compra, puxando o cadastro do SG.
- Só o ADM tem senha.
- Pedido sempre pelo app; WhatsApp é apoio. Sem lançamento manual de pedidos.
- Edição/cancelamento pelo cliente até quinta, 12h (mecanismo pendente).
- Preços, disponibilidade e selos gerenciados no painel, com publicação semanal.
- CNPJ e e-mail opcionais; um endereço por cliente.
- Ajuste de pesagem: pendente.
