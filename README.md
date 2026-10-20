# Milênio Construção de Galpões — site institucional

Site institucional da Milenio Participações Ltda. (Milênio Construção de Galpões), em HTML, CSS e JavaScript puros. Não depende de framework nem de etapa de build. Basta publicar os arquivos em qualquer hospedagem estática.

## Estrutura

```
index.html              página principal
privacidade.html        política de privacidade
robots.txt
assets/css/site.css     estilos (cores e tipografia definidas em :root)
assets/js/config.js     WhatsApp, Instagram e envio do formulário
assets/js/site.js       menu, galeria, formulário e medição
assets/fonts/           Archivo (variável, licença OFL), servida pelo próprio site
assets/img/             imagens otimizadas (geradas pelo script)
assets/originais/       arquivos-fonte: logotipo e fotografias
scripts/otimizar-imagens.py
scripts/montar-site.py  monta dist/ para publicação
PENDENCIAS.md           informações que a Milênio precisa confirmar
```

## Rodar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Configuração (`assets/js/config.js`)

| Campo | Efeito |
| --- | --- |
| `whatsapp` | Número com DDI e DDD, só dígitos (ex.: `55279XXXXXXXX`). Quando preenchido, o botão "Falar com a Milênio" e o formulário passam a usar o WhatsApp, e o número aparece no contato, no rodapé e nas perguntas frequentes. |
| `instagram` | Perfil oficial, sem `@`. Enquanto não houver WhatsApp, o formulário prepara a mensagem para o Direct do Instagram. |
| `formulario` | Opcional. URL que recebe o formulário por `POST` em JSON (serviço de formulários ou backend próprio). A confirmação só aparece se o servidor responder com sucesso. Ao ativar, atualize a seção "Como os dados são enviados" em `privacidade.html`. |

O formulário não simula envio. Sem servidor configurado, ele monta a mensagem no navegador do visitante e a encaminha pelo WhatsApp ou pelo Instagram, e o texto da página diz isso.

## Fotografias

As fotos recebidas têm 480 px de largura. Por isso, no desktop elas aparecem com alguma perda de nitidez. Para trocar pelas originais em alta resolução:

1. Substitua os arquivos em `assets/originais/` mantendo os nomes (`galpao-esquina`, `galpao-duas-portas`, `galpao-implantacao`, `galpao-alongado`). Pode ser `.png` ou `.jpg`.
2. Rode `python3 scripts/otimizar-imagens.py` (requer `pip install pillow`).
3. O script gera AVIF, WebP e JPEG em 480, 800, 1200, 1600 e 2400 px, nunca maiores que o original, e imprime o `srcset` de cada foto.
4. Atualize no `index.html` os atributos `srcset` e os `width`/`height` das imagens.

Para incluir novas fotos (por exemplo, ambientes internos), salve o arquivo como `assets/originais/galpao-<nome>.jpg` e rode o script.

O mesmo script recorta o logotipo, gera as versões branca e grafite com fundo transparente, os favicons e a imagem de compartilhamento (`compartilhamento.jpg`).

## Medição

`site.js` envia eventos para `window.dataLayer` (Google Tag Manager) ou `gtag`, se algum deles estiver instalado. Nenhuma ferramenta vem configurada. Eventos:

| Evento | Quando |
| --- | --- |
| `cta_click` | clique em "Solicitar atendimento", "Solicitar uma avaliação", "Entenda como funciona" ou "Solicitar informações" (`local` indica a seção) |
| `cta_projetos` | clique em "Conhecer nossos projetos" |
| `whatsapp_click` / `instagram_click` | clique em links de conversa |
| `projetos_view` | seção de projetos aparece na tela |
| `galeria_abrir` | foto ampliada |
| `form_start` | primeiro campo preenchido |
| `form_handoff` | mensagem encaminhada ao WhatsApp ou Instagram (`canal`) |
| `form_submit` | envio aceito pelo servidor configurado em `formulario` |

Ao instalar uma ferramenta de medição, atualize a seção de cookies da política de privacidade.

## Publicação (Cloudflare Pages)

O site está publicado no projeto `milenio-participacoes` da Cloudflare Pages, em https://milenio-participacoes.pages.dev, por envio direto (sem ligação com o repositório). Para publicar uma nova versão:

```bash
python3 scripts/montar-site.py https://milenio-participacoes.pages.dev
cd dist
npx wrangler pages deploy . --project-name milenio-participacoes --branch main
```

`montar-site.py` gera `dist/` só com os arquivos públicos (sem `assets/originais/`, notas e scripts), remove os comentários `PENDENTE` do HTML e, a partir do endereço informado, preenche `canonical`, `og:url`, `og:image` absoluta, `url` e `logo` no JSON-LD, `sitemap.xml` e `robots.txt`. Também cria `_headers` com cabeçalhos de segurança e cache. Se um domínio próprio for ligado ao projeto, rode o script com o novo endereço e publique de novo.

## SEO

O site tem título e descrição, um único `h1`, Open Graph, dados estruturados (`GeneralContractor`), textos alternativos nas imagens e sitemap (gerado na publicação).

## Conteúdo pendente

Os pontos que dependem de confirmação da Milênio estão marcados no código com comentários `PENDENTE` e listados em [PENDENCIAS.md](PENDENCIAS.md).
