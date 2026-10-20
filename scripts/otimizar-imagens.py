#!/usr/bin/env python3
"""Gera as imagens otimizadas do site a partir de assets/originais/.

Uso:  python3 scripts/otimizar-imagens.py

- Fotografias (galpao-*.png|jpg): gera AVIF, WebP e JPEG nas larguras de
  LARGURAS que forem menores ou iguais à largura do original. Nunca amplia.
- Logotipo (logo-milenio.png): recorta, gera versões grafite e branca com
  fundo transparente, a marca "M" isolada, favicons e a imagem de
  compartilhamento (Open Graph).

Ao final, imprime os atributos srcset de cada foto para colar no HTML.
Requer Pillow com suporte a AVIF (pip install pillow).
"""

from pathlib import Path

from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
ORIGINAIS = RAIZ / "assets" / "originais"
SAIDA = RAIZ / "assets" / "img"

LARGURAS = [480, 800, 1200, 1600, 2400]
GRAFITE = (21, 23, 26)
BRANCO = (255, 255, 255)


def salvar_variantes(img, nome):
    img = ImageOps.exif_transpose(img).convert("RGB")
    larguras = [w for w in LARGURAS if w <= img.width] or [img.width]
    if img.width not in larguras and img.width < LARGURAS[-1]:
        larguras.append(img.width)
    larguras = sorted(set(larguras))
    for w in larguras:
        h = round(img.height * w / img.width)
        v = img if w == img.width else img.resize((w, h), Image.LANCZOS)
        v.save(SAIDA / f"{nome}-{w}.avif", quality=60)
        v.save(SAIDA / f"{nome}-{w}.webp", quality=82, method=6)
        v.save(SAIDA / f"{nome}-{w}.jpg", quality=84, optimize=True, progressive=True)
    srcset = ", ".join(f"assets/img/{nome}-{w}.webp {w}w" for w in larguras)
    print(f"{nome}: {img.width}x{img.height}\n  webp srcset=\"{srcset}\"")


def mascara_logo(cinza):
    # Fundo branco vira transparente; traço escuro vira opaco, preservando os
    # tons intermediários da marca.
    claro, escuro = 242, 30
    return cinza.point(lambda v: max(0, min(255, round((claro - v) * 255 / (claro - escuro)))))


def colorir(mascara, cor):
    camada = Image.new("RGBA", mascara.size, cor + (0,))
    camada.putalpha(mascara)
    return camada


def processar_logo(caminho):
    cinza = Image.open(caminho).convert("L")
    caixa = cinza.point(lambda v: 255 if v < 200 else 0).getbbox()
    cinza = cinza.crop(caixa)
    mascara = mascara_logo(cinza)

    # Logotipo completo em duas versões.
    for sufixo, cor in (("grafite", GRAFITE), ("branco", BRANCO)):
        logo = colorir(mascara, cor)
        logo = logo.resize((640, round(logo.height * 640 / logo.width)), Image.LANCZOS)
        logo.save(SAIDA / f"logo-milenio-{sufixo}.png", optimize=True)

    # Marca "M": tudo à esquerda da barra vertical que separa o símbolo do nome.
    pixels = cinza.load()
    barra = next(
        x for x in range(cinza.width)
        if sum(1 for y in range(cinza.height) if pixels[x, y] < 128) > cinza.height * 0.8
    )
    marca = mascara.crop((0, 0, barra - 4, mascara.height))
    marca = marca.crop(marca.point(lambda v: 255 if v > 60 else 0).getbbox())

    def icone(tamanho, margem):
        tela = Image.new("RGBA", (tamanho, tamanho), GRAFITE + (255,))
        lado = round(tamanho * (1 - 2 * margem))
        escala = lado / max(marca.size)
        m = marca.resize((round(marca.width * escala), round(marca.height * escala)), Image.LANCZOS)
        branca = colorir(m, BRANCO)
        tela.alpha_composite(branca, ((tamanho - m.width) // 2, (tamanho - m.height) // 2))
        return tela

    icone(32, 0.14).save(SAIDA / "favicon-32.png", optimize=True)
    icone(180, 0.2).convert("RGB").save(SAIDA / "apple-touch-icon.png", optimize=True)
    icone(512, 0.2).save(SAIDA / "icone-512.png", optimize=True)

    return colorir(mascara, BRANCO)


def imagem_compartilhamento(logo_branco, foto):
    largura, altura = 1200, 630
    tela = Image.new("RGB", (largura, altura), GRAFITE)
    foto = ImageOps.exif_transpose(foto).convert("RGB")
    foto = ImageOps.fit(foto, (560, altura), Image.LANCZOS, centering=(0.5, 0.5))
    tela.paste(foto, (largura - 560, 0))
    logo = logo_branco.resize((540, round(logo_branco.height * 540 / logo_branco.width)), Image.LANCZOS)
    tela.paste(logo, (60, (altura - logo.height) // 2), logo)
    tela.save(SAIDA / "compartilhamento.jpg", quality=86, optimize=True, progressive=True)


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    logo_branco = processar_logo(ORIGINAIS / "logo-milenio.png")
    fotos = sorted(p for p in ORIGINAIS.iterdir() if p.name.startswith("galpao-"))
    for p in fotos:
        salvar_variantes(Image.open(p), p.stem)
    imagem_compartilhamento(logo_branco, Image.open(ORIGINAIS / "galpao-esquina.png"))


if __name__ == "__main__":
    main()
