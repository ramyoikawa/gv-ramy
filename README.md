# Gov.br Wallet

CONTAINER GERAL

div centralizada, max-width 430px, height 100vh, background white, overflow hidden, box-shadow lateral. Layout em flex-col com duas camadas: container de telas com flex-1 e position relative, e bottom nav fixo de 72px na base. Bottom nav não aparece na tela splash.

GERENCIAMENTO DE TELAS

Estado currentScreen do tipo string. Telas possíveis: splash, home, carteira, viewer, gerar-codigo, procuracao, agenda, caixa-postal, em-breve. Estado emBreveTitle para o título dinâmico da tela em-breve. As telas ficam com position absolute dentro do container. Ao navegar para frente, a tela atual sai pela esquerda com translateX de 0 para -100% e a nova entra pela direita com translateX de 100% para 0. Ao voltar, inverte. Duração 280ms com cubic-bezier(0.4, 0, 0.2, 1). Use useRef para controlar animações via classList sem re-renders.

TELA SPLASH

Imagem https://i.imgur.com/B58dPwJ.jpeg cobrindo 100% com object-fit cover e position absolute inset 0. Sobre ela na parte inferior com position absolute bottom 0 padding 24px: botão invisível background transparent color transparent border none width 100% padding 16px border-radius 50px que ao clicar navega para home. Parágrafo branco centralizado 13px com texto "Clique para criar ou acessar sua conta gov.br". Parágrafo branco centralizado "🛡️ Gerar código de acesso". Parágrafo branco centralizado "▦ Ler QR code". Parágrafo branco alinhado à direita 12px com texto "3.8.3".

TELA HOME

Dois blocos de imagem empilhados sem gap nem padding. Bloco 1: img src https://i.imgur.com/0JaeKBV.jpeg width 100% height auto display block, com position relative no container e botões invisíveis absolutamente posicionados left 5% width 90% height 60px background transparent border none z-index 10 nas seguintes posições: top 505px navega para gerar-codigo, top 575px navega para procuracao, top 645px navega para agenda, top 715px navega para caixa-postal, top 785px navega para carteira. Bloco 2: img src https://i.imgur.com/MU449ST.jpeg mesmas propriedades, com botões invisíveis nas posições top 20px navega para em-breve com título Certificados, top 90px navega para em-breve com título "Assinatura eletrônica", top 160px navega para em-breve com título "Minhas petições".

TELA CARTEIRA

Container height calc(100vh - 72px) position relative overflow hidden. Imagem src https://i.imgur.com/bfvUjgJ.jpeg width 100% height 100% object-fit contain object-position top display block. Botão invisível position absolute top 18% left 5% width 90% height 28% que abre a tela viewer. Botão invisível position absolute bottom 4% left 5% width 90% height 8% que abre o modal de adicionar documento.

TELA VIEWER

Estado currentSlide número de 0 a 3. Array de slides: índice 0 https://i.imgur.com/dqEzlZy.jpeg, índice 1 https://i.imgur.com/3SMcbOg.jpeg, índice 2 https://i.imgur.com/j4pCukh.jpeg, índice 3 https://i.imgur.com/ZaUCBDv.jpeg. Array de imagens de zoom: índice 0 https://i.imgur.com/0p8W36O.png, índice 1 https://i.imgur.com/F5Nx6Ag.jpeg, índice 2 https://i.imgur.com/S9mJYF4.png, índice 3 https://i.imgur.com/2jFEdpL.png.

Layout position relative width 100% height 100vh display flex flex-direction column overflow hidden. Imagem do slide atual width 100% flex 1 object-fit fill display block. Botão fechar invisível position absolute top 0 right 0 width 15% height 7% background transparent border none z-index 20 que navega para carteira. Botão ampliar invisível position absolute left 2% bottom 90px width 56px height 56px background transparent border none z-index 2 que abre o zoom overlay. Botão opções invisível position absolute right 2% bottom 90px width 56px height 56px background transparent border none z-index 2 que abre o options sheet. Botão anterior visível apenas se currentSlide maior que 0: position absolute left 22% bottom 90px width 44px height 56px background transparent border none z-index 3. Botão próximo visível apenas se currentSlide menor que 3: position absolute right 22% bottom 90px width 44px height 56px background transparent border none z-index 3.

Options sheet: estado showOptions. Overlay position absolute inset 0 background rgba(0,0,0,0.4) z-index 100 display flex align-items flex-end, clique fora fecha. Sheet branco border-top-left-radius 16px border-top-right-radius 16px padding 12px 0. Três botões: "Baixar documento" cor #1351B4 font-weight 600, "Compartilhar" cor #1351B4 font-weight 600 border-top 1px solid #eee, "Fechar" cor #666 font-weight 600 border-top 1px solid #eee. Baixar documento cria um elemento a com href da imagem atual e faz click. Compartilhar usa navigator.share se disponível ou navigator.clipboard.writeText.

Zoom overlay: estados zoomOpen boolean, zoomScale number iniciando em 1, panX e panY numbers iniciando em 0. Refs: imgRef para a imagem do zoom, pinchRef e dragRef para gestos. Ao abrir o zoom: zoomScale 1, panX 0, panY 0, carregar a imagem de zoom do índice atual. Position fixed inset 0 background black z-index 200 overflow hidden touch-action none. Imagem width 100% height 100vh object-fit contain display block, transform-origin sempre fixo em "0 0", transform sempre translate(panX px, panY px) scale(zoomScale), transition none durante gestos ativos. Botão fechar position fixed top 12px right 12px width 44px height 44px background rgba(0,0,0,0.5) border none border-radius 50% color white font-size 22px z-index 201 com texto ✕.

Lógica do zoom — função central applyZoom que recebe newScale, clientX e clientY: pegar getBoundingClientRect da imgRef, calcular px como clientX menos rect.left e py como clientY menos rect.top, calcular s como Math.min(4, Math.max(1, newScale)), calcular ratio como s dividido por zoomScale atual, se s igual a 1 forçar panX e panY para zero, caso contrário calcular novo panX como px menos a expressão px menos panX atual vezes ratio e novo panY como py menos a expressão py menos panY atual vezes ratio, atualizar zoomScale para s. Para wheel: chamar applyZoom com zoomScale mais 0.2 se deltaY negativo ou menos 0.2 se positivo, e e.clientX e e.clientY. Para pinch com dois dedos no touchstart: salvar em pinchRef a distância entre os dois toques como distInicial, o clientX médio entre os dois toques como midClientX, o clientY médio como midClientY, o zoomScale atual como scaleInicial, panX atual como panXInicial, panY atual como panYInicial. Para pinch no touchmove com dois toques: calcular distAtual, pegar rect da imgRef, calcular px como pinchRef.midClientX menos rect.left e py como pinchRef.midClientY menos rect.top, calcular s como Math.min(4, Math.max(1, pinchRef.scaleInicial vezes distAtual dividido por pinchRef.distInicial)), calcular ratio como s dividido por pinchRef.scaleInicial, aplicar panX como px menos a expressão px menos pinchRef.panXInicial vezes ratio, panY como py menos a expressão py menos pinchRef.panYInicial vezes ratio, zoomScale como s. Para pan com um dedo somente se zoomScale maior que 1 no touchstart: salvar em dragRef touchX, touchY, panXInicial, panYInicial. Pan no touchmove com um toque: aplicar panX como dragRef.panXInicial mais touch.clientX menos dragRef.touchX e panY como dragRef.panYInicial mais touch.clientY menos dragRef.touchY. No touchend: limpar pinchRef e dragRef. Quando zoomScale volta a 1 sempre forçar panX e panY para zero. A bottom nav some enquanto o zoom overlay estiver aberto.

MODAL ADICIONAR DOCUMENTO

Estado showAddDoc. Overlay position absolute inset 0 z-index 150 background rgba(0,0,0,0.4) backdrop-filter blur(4px) display flex align-items center justify-content center padding 24px. Card branco border-radius 16px padding 24px max-width 360px width 100%. Ícone Wallet da lucide em círculo 48px background #eff6ff centralizado margin-bottom 16px. Título "Adicionar documento" font-size 18px font-weight 700 color #111 text-align center margin-bottom 8px. Texto "Nenhum documento disponível para adicionar." color #6b7280 text-align center margin-bottom 24px. Botão "Fechar" width 100% background #1351B4 color white font-weight 700 padding 12px border-radius 50px border none cursor pointer.

BOTTOM NAV

Height 72px background white border-top 1px solid #f3f4f6 display flex justify-content space-around align-items flex-end padding-bottom 8px padding-top 4px z-index 50. Cinco itens: botão Início com ícone House da lucide navega para home, botão Dados com ícone Tag da lucide navega para em-breve com título Dados, div centralizado com botão circular 48px background #168821 border-radius 50% com ícone LayoutGrid branco da lucide e label QR Code 10px bold #9ca3af abaixo, botão Carteira com ícone Wallet da lucide navega para carteira, botão Menu com ícone Menu da lucide navega para em-breve com título Menu. Cor ativa #1351B4, cor inativa #9ca3af. Label 10px bold abaixo do ícone. Quando ativo mostrar ponto circular 4px background #1351B4 abaixo do label. Bottom nav não aparece na tela splash.

COMPONENTE INNERHEADER

Props onBack. Background white display flex align-items center padding 16px border-bottom 1px solid #f3f4f6. Botão com ícone ArrowLeft da lucide cor #1351B4 que chama onBack. Logo gov.br centralizado com flex 1 justify-content center margin-right 24px: cada letra em span separado com font-weight 700 letter-spacing -0.04em font-size 22px, -webkit-text-stroke 0.4px white em cada letra, filter drop-shadow(0 0 1px white) no container. Cores: g=#1351B4, o=#FFCD07, v=#168821, ponto=#1351B4, b=#1351B4, r=#FFCD07.

TELAS SECUNDÁRIAS

Todas usam InnerHeader com onBack navegando para home.

gerar-codigo: label "Identificador" font-size 13px font-weight 500 color #374151, input border 1px solid #d1d5db border-radius 8px padding 12px font-size 15px focus border-color #1351B4, botão "Gerar" background #1351B4 color white font-weight 700 padding 12px border-radius 50px border none width 100% margin-top 16px.

procuracao: texto "Nenhuma procuração encontrada." color #9ca3af text-align center padding-top 80px.

agenda: título "Agenda gov.br" color #1351B4 font-size 20px font-weight 700 margin-bottom 24px. Dois cards border 1px solid #f3f4f6 border-radius 12px padding 16px background #f9fafb margin-bottom 16px. Cada card tem ícone Calendar 18px color #1351B4 com título bold azul na mesma linha, data font-size 13px color #6b7280, local font-size 12px color #9ca3af margin-top 4px. Item 1: Renovação CNH, 15 Jun 09:00, Detran Sede. Item 2: Consulta Médica, 18 Jun 14:30, Posto Central.

caixa-postal: título "Caixa Postal" mesmos estilos. Lista de 3 itens com border-bottom 1px solid #f3f4f6 padding 16px 0. Cada item tem linha superior com remetente font-weight 700 color #1351B4 à esquerda e data font-size 12px color #9ca3af à direita, e assunto font-size 13px color #6b7280 abaixo. Itens: Receita Federal / Hoje / Sua declaração foi processada. Justiça Eleitoral / Ontem / Título de eleitor digital. Ministério da Saúde / 2 dias atrás / Campanha de Vacinação.

em-breve: título dinâmico vindo do estado emBreveTitle, color #1351B4 font-size 20px font-weight 700, texto "Em breve disponível." color #9ca3af, ambos centralizados com padding-top 80px.

FAVICON

link rel icon href https://i.imgur.com/R5htRcw.png

PROIBIÇÕES ABSOLUTAS

Não invente nenhuma tela, componente ou elemento não descrito acima. Não use shadcn, Radix, Headless UI ou qualquer outra biblioteca de componentes. Não adicione Toasts, Skeletons ou loading states. Não altere nenhuma URL de imagem. Não use React Router nem nenhum sistema de roteamento, use apenas useState. Entregue tudo em um único arquivo App.tsx.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gov-pocket-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e1ca8e16-6696-4b12-a2f0-76c59693c942).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
