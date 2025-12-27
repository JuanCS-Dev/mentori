# Guia de Configuracao - Kiwify + Hotmart + Netlify

> **Produto:** Mentori - Plataforma de Estudos com IA para Concursos
> **Modelo:** Assinatura Mensal
> **Preco Sugerido:** R$ 47/mes
> **Deploy:** Netlify

---

## SUMARIO

1. [Informacoes do Produto](#1-informacoes-do-produto)
2. [Deploy no Netlify](#2-deploy-no-netlify)
3. [Configuracao Kiwify](#3-configuracao-kiwify)
4. [Configuracao Hotmart](#4-configuracao-hotmart)
5. [Textos de Copy Prontos](#5-textos-de-copy-prontos)
6. [Checklist Final](#6-checklist-final)

---

## 1. INFORMACOES DO PRODUTO

### Dados Basicos

| Campo | Valor |
|-------|-------|
| **Nome do Produto** | Mentori - Estudos com IA |
| **Nome Completo** | Mentori - Plataforma de Estudos Inteligente para Concursos Publicos |
| **Categoria** | Educacao > Concursos Publicos |
| **Tipo** | Assinatura (Recorrente) |
| **Preco Mensal** | R$ 47,00 |
| **Preco Anual** | R$ 397,00 (30% desconto) |
| **Garantia** | 7 dias incondicional |
| **Suporte** | juan@vertice-maximus.com |

### Descricao Curta (ate 150 caracteres)
```
Estude 3x mais rapido com IA. Plano personalizado, 700+ questoes reais e mentor 24/7.
```

### Descricao Completa
```
O Mentori e a primeira plataforma de estudos para concursos que usa Inteligencia Artificial de verdade.

FUNCIONALIDADES:
- Analise automatica do seu edital
- Plano de estudos personalizado baseado em neurociencia
- Banco com 700+ questoes reais de concursos (CEBRASPE, FGV)
- Sistema de revisao espacada (nunca mais esqueca o que estudou)
- Mentor IA 24/7 para tirar duvidas
- Simulados no formato oficial das provas
- Gamificacao com XP, niveis e conquistas
- Dashboard de progresso detalhado

PARA QUEM E:
- Concurseiros que querem otimizar o tempo de estudo
- Quem esta comecando e nao sabe por onde iniciar
- Estudantes que esquecem o que ja estudaram
- Candidatos que querem feedback personalizado

GARANTIA DE 7 DIAS:
Se voce nao gostar, devolvemos 100% do seu dinheiro. Sem perguntas.

Comece hoje e transforme sua preparacao!
```

### Palavras-chave (SEO)
```
concursos publicos, estudar para concurso, plano de estudos, questoes de concurso,
CEBRASPE, FGV, edital, revisao espacada, IA para estudos, mentor virtual,
preparatorio concurso, como passar em concurso, aprovacao concurso
```

### Imagens Necessarias

| Tipo | Dimensoes | Uso |
|------|-----------|-----|
| Logo | 500x500px | Icone do produto |
| Banner | 1920x1080px | Capa nas plataformas |
| Thumbnail | 800x600px | Miniaturas |
| Screenshots | 1280x720px | Demonstracao do app |

---

## 2. DEPLOY NO NETLIFY

### 2.1 Criar Conta

1. Acesse https://netlify.com
2. Clique em **Sign up**
3. Conecte com GitHub (recomendado)

### 2.2 Fazer Deploy

**Opcao A: Deploy via GitHub (Recomendado)**

1. Suba o codigo para um repositorio GitHub
2. No Netlify, clique em **Add new site** > **Import an existing project**
3. Selecione **GitHub**
4. Escolha o repositorio `concursoai`
5. Configure:
   ```
   Branch to deploy: main
   Build command: npm run build
   Publish directory: dist
   ```
6. Clique em **Deploy site**

**Opcao B: Deploy Manual**

```bash
# No terminal, na pasta do projeto:
npm run build

# Instale o CLI do Netlify
npm install -g netlify-cli

# Faca login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### 2.3 Configurar Dominio Personalizado

1. No painel do Netlify, va em **Domain settings**
2. Clique em **Add custom domain**
3. Digite: `mentori.app` (ou seu dominio)
4. Configure os DNS:

```
Tipo: A
Nome: @
Valor: 75.2.60.5

Tipo: CNAME
Nome: www
Valor: [seu-site].netlify.app
```

5. Ative HTTPS (automatico apos DNS propagar)

### 2.4 Variaveis de Ambiente

No Netlify, va em **Site settings** > **Environment variables**:

```
VITE_GEMINI_API_KEY=sua_api_key_aqui
VITE_MENTOR_CHAT_URL=https://us-central1-seu-projeto.cloudfunctions.net/mentorChat
```

### 2.5 URL Final

Apos deploy, sua URL sera algo como:
- Temporaria: `https://amazing-name-123456.netlify.app`
- Personalizada: `https://mentori.app`

**ANOTE ESTA URL - voce vai precisar para Kiwify e Hotmart!**

---

## 3. CONFIGURACAO KIWIFY

### 3.1 Criar Conta de Produtor

1. Acesse https://dashboard.kiwify.com.br/signup
2. Preencha seus dados:
   - Nome completo
   - E-mail
   - CPF
   - Telefone
3. Confirme o e-mail
4. Complete o cadastro bancario para receber pagamentos

### 3.2 Cadastrar o Produto

1. No dashboard, clique em **Produtos** > **Criar produto**

2. **Informacoes Basicas:**
   ```
   Nome: Mentori - Estudos com IA

   Descricao curta: Estude 3x mais rapido com IA. Plano personalizado,
   700+ questoes reais e mentor 24/7 para concursos publicos.
   ```

3. **Tipo de Produto:**
   - Selecione: **Assinatura**
   - Periodo: **Mensal**

4. **Preco:**
   ```
   Valor mensal: R$ 47,00
   Moeda: BRL
   ```

5. **Garantia:**
   ```
   Tipo: Garantia incondicional
   Prazo: 7 dias
   ```

### 3.3 Configurar Entrega

1. Va em **Entrega do produto**
2. Selecione: **Area de membros externa**
3. Configure:
   ```
   URL de acesso: https://mentori.app (ou sua URL do Netlify)

   Instrucoes de acesso:
   "Apos a confirmacao do pagamento, acesse a plataforma em mentori.app
   usando o mesmo e-mail da compra. Seu acesso sera liberado automaticamente."
   ```

### 3.4 Configurar Checkout

1. Va em **Checkout** > **Personalizar**

2. **Campos do formulario:**
   - [x] Nome completo (obrigatorio)
   - [x] E-mail (obrigatorio)
   - [x] CPF (obrigatorio)
   - [ ] Telefone (opcional)

3. **Bump de pedido (opcional):**
   ```
   Produto bump: Acesso Anual com 30% OFF
   Preco bump: R$ 350,00 (ao inves de R$ 564/ano)
   Descricao: "Garanta 1 ano de acesso com desconto especial!"
   ```

4. **Pixels de rastreamento:**
   ```
   Facebook Pixel ID: [seu_pixel_id]
   Google Analytics: [seu_ga_id]
   ```

### 3.5 Configurar Webhook (Opcional)

Para integracao avancada:

1. Va em **Integracoes** > **Webhooks**
2. Adicione:
   ```
   URL: https://sua-api.com/webhooks/kiwify
   Eventos:
   - [x] Compra aprovada
   - [x] Assinatura cancelada
   - [x] Reembolso solicitado
   ```

### 3.6 Configurar E-mails

1. Va em **E-mails** > **Templates**

2. **E-mail de boas-vindas:**
   ```
   Assunto: Bem-vindo ao Mentori! Seu acesso esta liberado

   Corpo:
   Ola, {nome}!

   Sua assinatura do Mentori foi confirmada com sucesso!

   ACESSE AGORA: https://mentori.app

   Use o e-mail {email} para entrar na plataforma.

   Dicas para comecar:
   1. Faca upload do seu edital para analise automatica
   2. Responda o quiz de perfil para personalizar seu plano
   3. Comece pelas questoes do Ciclo de Estudos

   Qualquer duvida, responda este e-mail ou acesse o chat do Mentor IA.

   Bons estudos!
   Equipe Mentori
   ```

### 3.7 Publicar Produto

1. Revise todas as configuracoes
2. Clique em **Publicar produto**
3. Copie o link de checkout:
   ```
   https://pay.kiwify.com.br/XXXXXX
   ```

### 3.8 Taxas Kiwify

| Tipo | Taxa |
|------|------|
| Por venda | 8,99% + R$ 2,49 |
| Saque | Gratis (PIX) |
| Minimo saque | R$ 20,00 |

**Exemplo:** Venda de R$ 47,00
- Taxa: R$ 4,23 + R$ 2,49 = R$ 6,72
- Voce recebe: R$ 40,28

---

## 4. CONFIGURACAO HOTMART

### 4.1 Criar Conta de Produtor

1. Acesse https://www.hotmart.com/pt-br
2. Clique em **Comecar gratis**
3. Selecione **Quero vender**
4. Preencha:
   - Nome completo
   - E-mail
   - Senha
5. Confirme o e-mail
6. Complete:
   - CPF/CNPJ
   - Dados bancarios
   - Endereco

### 4.2 Cadastrar o Produto

1. No dashboard, clique em **Produtos** > **Criar produto**

2. **Categoria:**
   ```
   Categoria principal: Educacao
   Subcategoria: Concursos Publicos
   ```

3. **Informacoes do produto:**
   ```
   Nome: Mentori - Estudos com IA para Concursos

   Idioma: Portugues

   Descricao: [Cole a descricao completa da secao 1]
   ```

4. **Tipo de cobranca:**
   - Selecione: **Assinatura**

5. **Configurar plano:**
   ```
   Nome do plano: Mensal
   Valor: R$ 47,00
   Periodo: Mensal
   Ciclos: Indefinido (ate cancelar)
   ```

### 4.3 Configurar Entrega

1. Va em **Produto** > **Entrega**
2. Selecione: **Site/Ferramenta externa**
3. Configure:
   ```
   URL do produto: https://mentori.app

   Mensagem de entrega:
   "Acesse a plataforma em mentori.app usando o e-mail da compra.
   Seu acesso foi liberado automaticamente!"
   ```

### 4.4 Configurar Checkout

1. Va em **Checkout** > **Configuracoes**

2. **Aparencia:**
   - Cor principal: #3B82F6 (azul)
   - Logo: Upload do logo Mentori

3. **Campos:**
   - [x] Nome (obrigatorio)
   - [x] E-mail (obrigatorio)
   - [x] Documento (obrigatorio)
   - [ ] Telefone (opcional)

4. **Order bump:**
   ```
   Oferta: Upgrade Anual
   Valor: +R$ 350,00 (acesso anual)
   Texto: "Economize R$ 214 com o plano anual!"
   ```

### 4.5 Configurar Garantia

1. Va em **Produto** > **Garantia**
2. Configure:
   ```
   Tipo: Garantia incondicional
   Prazo: 7 dias

   Texto: "Se voce nao ficar satisfeito nos primeiros 7 dias,
   devolvemos 100% do seu dinheiro. Sem perguntas."
   ```

### 4.6 Configurar Afiliados (Opcional)

1. Va em **Afiliados** > **Configuracoes**
2. Configure:
   ```
   Comissao: 30%
   Tipo: Primeira venda + recorrencias
   Cookie: 60 dias
   ```

### 4.7 Configurar Webhook

1. Va em **Ferramentas** > **Webhooks**
2. Clique em **Adicionar webhook**
3. Configure:
   ```
   URL: https://sua-api.com/webhooks/hotmart

   Eventos:
   - [x] PURCHASE_COMPLETE (compra aprovada)
   - [x] SUBSCRIPTION_CANCELLATION (cancelamento)
   - [x] REFUND (reembolso)
   ```

### 4.8 Configurar Pixels

1. Va em **Ferramentas** > **Pixels**
2. Adicione:
   ```
   Facebook Pixel: [seu_pixel_id]
   Google Analytics: [seu_ga_id]
   Google Ads: [seu_conversion_id]
   ```

### 4.9 Publicar Produto

1. Revise todas as configuracoes
2. Va em **Produto** > **Status**
3. Clique em **Ativar produto**
4. Copie o link do checkout:
   ```
   https://pay.hotmart.com/XXXXXX
   ```

### 4.10 Taxas Hotmart

| Tipo | Taxa |
|------|------|
| Por venda | 9,90% + R$ 1,00 |
| Saque | Gratis |
| Minimo saque | R$ 20,00 |

**Exemplo:** Venda de R$ 47,00
- Taxa: R$ 4,65 + R$ 1,00 = R$ 5,65
- Voce recebe: R$ 41,35

---

## 5. TEXTOS DE COPY PRONTOS

### 5.1 Titulo Principal (Headline)
```
Estude 3x Mais Rapido com Inteligencia Artificial
```

### 5.2 Subtitulo
```
A primeira plataforma de estudos para concursos que usa IA de verdade
para criar seu plano personalizado e garantir sua aprovacao.
```

### 5.3 Bullet Points (Beneficios)
```
- Analise automatica do edital em segundos
- Plano de estudos baseado em neurociencia
- 700+ questoes reais de CEBRASPE e FGV
- Sistema de revisao que impede esquecimento
- Mentor IA 24/7 para tirar qualquer duvida
- Simulados no formato oficial das provas
- Gamificacao que mantem a motivacao
- Dashboard completo de progresso
```

### 5.4 Prova Social
```
"Ja sao mais de X concurseiros usando o Mentori para otimizar seus estudos"

"97% dos usuarios relatam melhora significativa na retencao de conteudo"

"Metodo baseado em pesquisas de Harvard sobre aprendizado acelerado"
```

### 5.5 Urgencia/Escassez
```
"Preco promocional de lancamento: R$ 47/mes (em breve R$ 97)"

"Primeiros 100 assinantes ganham acesso vitalicio ao preco atual"

"Garantia de 7 dias: se nao gostar, devolvemos tudo"
```

### 5.6 CTA (Call to Action)
```
Principal: "COMECAR AGORA"
Secundario: "Testar por 7 dias"
Checkout: "GARANTIR MINHA VAGA"
```

### 5.7 E-mail de Carrinho Abandonado
```
Assunto: Voce esqueceu algo importante...

Ola!

Vi que voce estava prestes a comecar sua jornada de aprovacao com o Mentori,
mas nao finalizou.

Aconteceu algum problema? Posso ajudar?

Lembre-se: voce tem 7 DIAS DE GARANTIA. Se nao gostar, devolvemos tudo.

>> Finalizar minha inscricao: [LINK]

Cada dia sem um metodo eficiente e um dia perdido na sua preparacao.

Te vejo la dentro!
Equipe Mentori
```

### 5.8 FAQ para Checkout
```
P: Como funciona a garantia?
R: Voce tem 7 dias para testar. Se nao gostar, basta solicitar o reembolso
   que devolvemos 100% do valor, sem perguntas.

P: Preciso instalar algum aplicativo?
R: Nao! O Mentori funciona 100% no navegador. Basta acessar mentori.app.

P: Funciona para qualquer concurso?
R: Sim! A IA analisa qualquer edital e cria um plano personalizado.

P: Posso cancelar quando quiser?
R: Sim, sem multas. Voce continua com acesso ate o fim do periodo pago.

P: Qual a diferenca para outros cursinhos?
R: Nos usamos IA de verdade para personalizar 100% da sua experiencia.
   Nao e um cursinho gravado - e uma plataforma inteligente que se adapta a voce.
```

---

## 6. CHECKLIST FINAL

### Pre-Lancamento

- [ ] Deploy no Netlify funcionando
- [ ] Dominio configurado e com HTTPS
- [ ] Variaveis de ambiente configuradas
- [ ] App funcionando sem erros

### Kiwify

- [ ] Conta criada e verificada
- [ ] Dados bancarios cadastrados
- [ ] Produto cadastrado
- [ ] Preco configurado (R$ 47)
- [ ] Garantia de 7 dias ativa
- [ ] URL de entrega configurada
- [ ] E-mails personalizados
- [ ] Checkout testado
- [ ] Link de checkout salvo

### Hotmart

- [ ] Conta criada e verificada
- [ ] Dados bancarios cadastrados
- [ ] Produto cadastrado
- [ ] Plano de assinatura configurado
- [ ] Garantia de 7 dias ativa
- [ ] URL de entrega configurada
- [ ] Checkout testado
- [ ] Link de checkout salvo

### Marketing

- [ ] Facebook Pixel instalado
- [ ] Google Analytics configurado
- [ ] Imagens do produto prontas
- [ ] Copy de vendas revisada
- [ ] E-mails automaticos configurados

### Teste Final

- [ ] Fazer compra teste no Kiwify
- [ ] Fazer compra teste no Hotmart
- [ ] Verificar recebimento de e-mails
- [ ] Verificar acesso ao app
- [ ] Testar reembolso

---

## LINKS UTEIS

| Plataforma | URL |
|------------|-----|
| Kiwify Dashboard | https://dashboard.kiwify.com.br |
| Hotmart Dashboard | https://app.hotmart.com |
| Netlify Dashboard | https://app.netlify.com |
| Suporte Kiwify | https://ajuda.kiwify.com.br |
| Suporte Hotmart | https://help.hotmart.com |

---

## COMPARATIVO DE TAXAS

| Plataforma | Taxa por Venda (R$ 47) | Voce Recebe |
|------------|------------------------|-------------|
| Kiwify | R$ 6,72 (14,3%) | R$ 40,28 |
| Hotmart | R$ 5,65 (12,0%) | R$ 41,35 |

**Recomendacao:** Comece com Hotmart (taxa menor) e adicione Kiwify para alcance extra.

---

## PROJECAO DE RECEITA

| Assinantes | MRR | Apos Taxas (~13%) | Lucro Anual |
|------------|-----|-------------------|-------------|
| 10 | R$ 470 | R$ 409 | R$ 4.908 |
| 50 | R$ 2.350 | R$ 2.045 | R$ 24.540 |
| 100 | R$ 4.700 | R$ 4.089 | R$ 49.068 |
| 300 | R$ 14.100 | R$ 12.267 | R$ 147.204 |
| 500 | R$ 23.500 | R$ 20.445 | R$ 245.340 |

**Meta Mac Studio (R$ 25.000):** ~300 assinantes por 2 meses OU ~100 assinantes por 6 meses

---

*Documento criado em: Dezembro 2025*
*Versao: 1.0*
