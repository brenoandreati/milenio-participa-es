#!/usr/bin/env python3
"""Monta a pasta dist/ com apenas os arquivos públicos do site.

Uso:  python3 scripts/montar-site.py https://endereco-do-site

- Copia as páginas e assets/ (sem originais, notas internas e scripts).
- Remove os comentários HTML (marcadores PENDENTE e anotações internas).
- Com o endereço informado, preenche canonical, og:url, og:image absoluta,
  url e logo no JSON-LD, e gera sitemap.xml.
"""

import re
import shutil
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DIST = RAIZ / "dist"
PAGINAS = {"index.html": "/", "privacidade.html": "/privacidade"}
PASTAS = ["assets/css", "assets/js", "assets/fonts", "assets/img"]

CABECALHOS = """/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY

/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/assets/img/*
  Cache-Control: public, max-age=604800
"""


def preparar_html(texto, endereco, caminho):
    texto = re.sub(r"[ \t]*<!--.*?-->[ \t]*\n?", "", texto, flags=re.S)
    if not endereco:
        return texto
    url = endereco + caminho
    texto = texto.replace(
        '<meta name="theme-color" content="#15171A">',
        '<meta name="theme-color" content="#15171A">\n'
        f'  <link rel="canonical" href="{url}">',
        1,
    )
    texto = texto.replace(
        '<meta property="og:image" content="assets/img/',
        f'<meta property="og:url" content="{url}">\n'
        f'  <meta property="og:image" content="{endereco}/assets/img/',
    )
    texto = texto.replace(
        '"sameAs": [',
        f'"url": "{endereco}/",\n'
        f'    "logo": "{endereco}/assets/img/icone-512.png",\n'
        f'    "image": "{endereco}/assets/img/compartilhamento.jpg",\n'
        '    "sameAs": [',
    )
    return texto


def main():
    endereco = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else ""
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    for pasta in PASTAS:
        shutil.copytree(RAIZ / pasta, DIST / pasta)
    for pagina, caminho in PAGINAS.items():
        texto = (RAIZ / pagina).read_text(encoding="utf-8")
        (DIST / pagina).write_text(preparar_html(texto, endereco, caminho), encoding="utf-8")

    (DIST / "_headers").write_text(CABECALHOS, encoding="utf-8")
    robots = "User-agent: *\nAllow: /\n"
    if endereco:
        robots += f"\nSitemap: {endereco}/sitemap.xml\n"
        urls = "".join(f"  <url><loc>{endereco}{c}</loc></url>\n" for c in PAGINAS.values())
        (DIST / "sitemap.xml").write_text(
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f"{urls}</urlset>\n",
            encoding="utf-8",
        )
    (DIST / "robots.txt").write_text(robots, encoding="utf-8")
    print(f"dist/ pronto{' para ' + endereco if endereco else ''}")


if __name__ == "__main__":
    main()
