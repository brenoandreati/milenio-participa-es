/* Milênio Construção de Galpões — comportamento da página. Sem dependências. */
(function () {
  "use strict";

  const config = Object.assign(
    { whatsapp: "", instagram: "milenioparticipacoes", formulario: "" },
    window.MILENIO_CONFIG
  );
  const numeroWhatsApp = String(config.whatsapp || "").replace(/\D/g, "");
  const temWhatsApp = numeroWhatsApp.length >= 12;
  const temServidor = Boolean(config.formulario);
  const linkDirect = `https://ig.me/m/${config.instagram}`;
  const mensagemInicial = "Olá, Milênio! Gostaria de conversar sobre um projeto de galpão.";
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));

  function linkWhatsApp(texto) {
    return `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(texto)}`;
  }

  function formatarTelefone(digitos) {
    const d = digitos.slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  /* ---------- Medição ----------
     Envia eventos para o Google Tag Manager (dataLayer) ou gtag, se algum
     deles for instalado na página. Sem ferramenta configurada, nada é enviado. */
  function registrar(evento, dados = {}) {
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: evento, ...dados });
    if (typeof window.gtag === "function") window.gtag("event", evento, dados);
  }

  document.addEventListener("click", (e) => {
    const alvo = e.target.closest("[data-evento]");
    if (alvo) registrar(alvo.dataset.evento, { local: alvo.dataset.local || "" });
  });

  /* ---------- Canal de conversa ---------- */
  function configurarCanal() {
    $$("[data-link-conversa]").forEach((a) => {
      a.href = temWhatsApp ? linkWhatsApp(mensagemInicial) : linkDirect;
      a.dataset.evento = temWhatsApp ? "whatsapp_click" : "instagram_click";
    });

    const nota = $("[data-canal-nota]");
    const explicacao = $("[data-canal-explicacao]");
    const enviar = $("[data-enviar]");
    if (!nota || !explicacao || !enviar) return;

    if (temWhatsApp) {
      $$("[data-se-whatsapp]").forEach((el) => { el.hidden = false; });
      $$("[data-link-whatsapp]").forEach((a) => { a.href = linkWhatsApp(mensagemInicial); });
      $$("[data-whatsapp-numero]").forEach((el) => {
        el.textContent = formatarTelefone(numeroWhatsApp.slice(2));
      });
      nota.textContent = "A conversa abre no WhatsApp da Milênio.";
    }

    if (temServidor) {
      explicacao.textContent = "Ao enviar, a sua solicitação segue diretamente para a equipe da Milênio.";
      enviar.textContent = "Enviar solicitação";
    } else if (temWhatsApp) {
      explicacao.textContent = "Ao enviar, abrimos o WhatsApp com a sua mensagem pronta. A solicitação chega à equipe quando você tocar em enviar no aplicativo.";
      enviar.textContent = "Enviar pelo WhatsApp";
    } else {
      explicacao.textContent = "Ao enviar, preparamos a sua mensagem para o Direct do Instagram da Milênio. A solicitação chega à equipe quando você colar e enviar a mensagem no Instagram.";
      enviar.textContent = "Preparar mensagem para o Instagram";
    }
  }

  /* ---------- Cabeçalho ---------- */
  function configurarCabecalho() {
    const cabecalho = $("[data-cabecalho]");
    if (!cabecalho) return;
    const aoRolar = () => cabecalho.classList.toggle("rolado", window.scrollY > 8);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });

    // Marca no menu a seção que está no centro da tela.
    const links = new Map($$("[data-nav]").map((a) => [a.dataset.nav, a]));
    const secoes = $$("main > section[id]");
    if (!("IntersectionObserver" in window)) return;
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        links.forEach((a, chave) => {
          if (chave === entrada.target.id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secoes.forEach((s) => observador.observe(s));
  }

  /* ---------- Menu móvel ---------- */
  function configurarMenu() {
    const botao = $("[data-menu-botao]");
    const menu = $("[data-menu]");
    const rotulo = $("[data-menu-rotulo]");
    const cabecalho = $("[data-cabecalho]");
    const telaGrande = window.matchMedia("(min-width: 960px)");
    if (!botao || !menu) return;

    function alternar(abrir) {
      botao.setAttribute("aria-expanded", String(abrir));
      menu.classList.toggle("aberta", abrir);
      document.documentElement.classList.toggle("menu-aberto", abrir);
      rotulo.textContent = abrir ? "Fechar" : "Menu";
    }

    botao.addEventListener("click", () => alternar(botao.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) alternar(false); });
    telaGrande.addEventListener("change", (e) => { if (e.matches) alternar(false); });

    document.addEventListener("keydown", (e) => {
      if (!menu.classList.contains("aberta")) return;
      if (e.key === "Escape") {
        alternar(false);
        botao.focus();
      } else if (e.key === "Tab") {
        // Mantém o foco dentro do cabeçalho enquanto o menu está aberto.
        const focaveis = $$("a, button", cabecalho);
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
      }
    });
  }

  /* ---------- Entrada ao rolar ---------- */
  function configurarRevelacao() {
    const elementos = $$("[data-revelar]");
    if (reduzirMovimento || !("IntersectionObserver" in window)) {
      elementos.forEach((el) => el.classList.add("visivel"));
      return;
    }
    const observador = new IntersectionObserver((entradas) => {
      let atraso = 0;
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.style.transitionDelay = `${atraso}ms`;
        entrada.target.classList.add("visivel");
        observador.unobserve(entrada.target);
        atraso += 90;
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    elementos.forEach((el) => observador.observe(el));

    const projetos = $("[data-secao-projetos]");
    if (projetos) {
      const vista = new IntersectionObserver((entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          registrar("projetos_view");
          vista.disconnect();
        }
      }, { threshold: 0.25 });
      vista.observe(projetos);
    }
  }

  /* ---------- Galeria ---------- */
  function maiorFonte(srcset) {
    if (!srcset) return null;
    return srcset.split(",")
      .map((parte) => parte.trim().split(/\s+/))
      .map(([url, descritor]) => ({ url, largura: parseInt(descritor, 10) || 0 }))
      .sort((a, b) => b.largura - a.largura)[0];
  }

  function configurarGaleria() {
    const visor = $("[data-visor]");
    const imagem = $("[data-visor-imagem]");
    const legenda = $("[data-visor-legenda]");
    const contador = $("[data-visor-contador]");
    if (!visor || typeof visor.showModal !== "function") return;

    const itens = $$(".galeria__botao").map((botao) => {
      const img = $("img", botao);
      const fonte = maiorFonte($('source[type="image/webp"]', botao)?.getAttribute("srcset"));
      const razao = img.getAttribute("width") / img.getAttribute("height");
      const largura = fonte?.largura || Number(img.getAttribute("width"));
      return {
        botao,
        src: fonte?.url || img.getAttribute("src"),
        largura,
        altura: Math.round(largura / razao),
        alt: img.alt,
        legenda: botao.closest("figure").querySelector("figcaption").textContent,
      };
    });

    let atual = 0;
    let origem = null;

    function dimensionar() {
      const item = itens[atual];
      const razao = item.largura / item.altura;
      // Amplia até 2x o tamanho do arquivo, limitado pela tela.
      const larguraMax = Math.min(window.innerWidth - 40, item.largura * 2);
      const alturaMax = window.innerHeight - 170;
      imagem.style.width = `${Math.round(Math.min(larguraMax, alturaMax * razao))}px`;
    }

    function mostrar(indice) {
      atual = (indice + itens.length) % itens.length;
      const item = itens[atual];
      if (imagem.getAttribute("src") !== item.src) {
        imagem.classList.add("carregando");
        imagem.onload = () => imagem.classList.remove("carregando");
        imagem.src = item.src;
        if (imagem.complete) imagem.classList.remove("carregando");
      }
      imagem.alt = item.alt;
      imagem.width = item.largura;
      imagem.height = item.altura;
      legenda.textContent = item.legenda;
      const total = String(itens.length).padStart(2, "0");
      contador.textContent = `Foto ${String(atual + 1).padStart(2, "0")} / ${total}`;
      dimensionar();
    }

    itens.forEach((item, indice) => {
      item.botao.addEventListener("click", () => {
        origem = item.botao;
        mostrar(indice);
        visor.showModal();
        registrar("galeria_abrir", { foto: indice + 1 });
      });
    });

    $("[data-visor-fechar]").addEventListener("click", () => visor.close());
    $("[data-visor-anterior]").addEventListener("click", () => mostrar(atual - 1));
    $("[data-visor-proxima]").addEventListener("click", () => mostrar(atual + 1));

    visor.addEventListener("click", (e) => {
      if (e.target === visor || e.target.classList.contains("visor__figura")) visor.close();
    });
    visor.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") mostrar(atual - 1);
      if (e.key === "ArrowRight") mostrar(atual + 1);
    });
    visor.addEventListener("close", () => { if (origem) origem.focus(); });

    let inicioToque = null;
    visor.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") inicioToque = e.clientX;
    });
    visor.addEventListener("pointerup", (e) => {
      if (inicioToque === null) return;
      const distancia = e.clientX - inicioToque;
      inicioToque = null;
      if (Math.abs(distancia) > 50) mostrar(atual + (distancia < 0 ? 1 : -1));
    });

    window.addEventListener("resize", () => { if (visor.open) dimensionar(); });
  }

  /* ---------- Formulário ---------- */
  function configurarFormulario() {
    const form = $("[data-formulario]");
    if (!form) return;

    const mensagem = $("[data-mensagem]", form);
    const telefone = $("[data-telefone]", form);
    const areaIndefinida = $("[data-area-indefinida]", form);
    const area = form.elements.area;
    const retorno = $("[data-retorno]", form);
    const enviar = $("[data-enviar]", form);

    // Botões que levam ao formulário trazem um assunto para a mensagem.
    let assuntoAtual = "";
    document.addEventListener("click", (e) => {
      const link = e.target.closest("[data-assunto]");
      if (!link) return;
      if (!mensagem.value.trim() || mensagem.value === assuntoAtual) {
        mensagem.value = link.dataset.assunto;
        assuntoAtual = link.dataset.assunto;
      }
    });

    telefone.addEventListener("input", () => {
      telefone.value = formatarTelefone(telefone.value.replace(/\D/g, ""));
    });

    area.addEventListener("input", () => {
      area.value = area.value.replace(/[^\d.,]/g, "");
    });

    areaIndefinida.addEventListener("change", () => {
      area.disabled = areaIndefinida.checked;
      if (areaIndefinida.checked) area.value = "";
    });

    const regras = {
      nome: (v) => v.trim().length >= 2 || "Informe o seu nome.",
      telefone: (v) => {
        const digitos = v.replace(/\D/g, "").length;
        return (digitos >= 10 && digitos <= 11) || "Informe um telefone com DDD, como (27) 99999-9999.";
      },
      email: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
        || "Confira o e-mail. Ele precisa ter o formato nome@empresa.com.br.",
      cidade: (v) => v.trim().length >= 2 || "Informe a cidade e o estado do projeto.",
    };

    function validar(nome) {
      const campo = form.elements[nome];
      const resultado = regras[nome](campo.value);
      const valido = resultado === true;
      campo.setAttribute("aria-invalid", String(!valido));
      $(`#${campo.id}-erro`).textContent = valido ? "" : resultado;
      return valido;
    }

    Object.keys(regras).forEach((nome) => {
      const campo = form.elements[nome];
      campo.addEventListener("blur", () => { if (campo.value.trim()) validar(nome); });
      campo.addEventListener("input", () => {
        if (campo.getAttribute("aria-invalid") === "true") validar(nome);
      });
    });

    let iniciou = false;
    form.addEventListener("input", () => {
      if (iniciou) return;
      iniciou = true;
      registrar("form_start");
    });

    const rotulos = [
      ["nome", "Nome"],
      ["empresa", "Empresa"],
      ["telefone", "Telefone/WhatsApp"],
      ["email", "E-mail"],
      ["cidade", "Cidade e estado do projeto"],
      ["finalidade", "Finalidade do galpão"],
      ["situacao", "Situação atual"],
      ["area", "Área aproximada"],
    ];

    function coletar() {
      const dados = Object.fromEntries(new FormData(form));
      dados.area = areaIndefinida.checked ? "Ainda não definida" : (dados.area ? `${dados.area} m²` : "");
      delete dados.area_indefinida;
      Object.keys(dados).forEach((chave) => { dados[chave] = String(dados[chave]).trim(); });
      return dados;
    }

    function montarMensagem(dados) {
      const linhas = [mensagemInicial, ""];
      rotulos.forEach(([chave, rotulo]) => {
        if (dados[chave]) linhas.push(`${rotulo}: ${dados[chave]}`);
      });
      if (dados.mensagem) linhas.push("", dados.mensagem);
      return linhas.join("\n");
    }

    function criar(tag, classe, texto) {
      const el = document.createElement(tag);
      if (classe) el.className = classe;
      if (texto) el.textContent = texto;
      return el;
    }

    function linkAcao(rotulo, href, evento) {
      const a = criar("a", "botao botao--escuro", rotulo);
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      if (evento) { a.dataset.evento = evento; a.dataset.local = "formulario"; }
      return a;
    }

    function mostrarRetorno({ titulo, texto, erro = false, acoes = [], textoPronto = "" }) {
      retorno.replaceChildren();
      retorno.classList.toggle("retorno--erro", erro);
      retorno.append(criar("p", "retorno__titulo", titulo));
      if (texto) retorno.append(criar("p", "", texto));
      if (textoPronto) {
        const caixa = criar("textarea");
        caixa.readOnly = true;
        caixa.value = textoPronto;
        caixa.setAttribute("aria-label", "Mensagem pronta para enviar");
        retorno.append(caixa);
      }
      if (acoes.length) {
        const grupo = criar("div", "acoes");
        grupo.append(...acoes);
        retorno.append(grupo);
      }
      retorno.hidden = false;
      retorno.focus({ preventScroll: true });
      retorno.scrollIntoView({ block: "nearest", behavior: reduzirMovimento ? "auto" : "smooth" });
    }

    async function copiar(texto) {
      try {
        await navigator.clipboard.writeText(texto);
        return true;
      } catch (_) {
        return false;
      }
    }

    function viaWhatsApp(texto) {
      const url = linkWhatsApp(texto);
      window.open(url, "_blank", "noopener");
      registrar("form_handoff", { canal: "whatsapp" });
      mostrarRetorno({
        titulo: "Abrimos o WhatsApp com a sua mensagem.",
        texto: "Para concluir, toque em enviar no aplicativo. Se o WhatsApp não abriu, use o botão abaixo.",
        acoes: [linkAcao("Abrir o WhatsApp", url, "whatsapp_click")],
      });
    }

    async function viaInstagram(texto) {
      const copiado = await copiar(texto);
      registrar("form_handoff", { canal: "instagram" });
      const botaoCopiar = criar("button", "botao botao--contorno", "Copiar mensagem");
      botaoCopiar.type = "button";
      botaoCopiar.addEventListener("click", async () => {
        botaoCopiar.textContent = (await copiar(texto)) ? "Mensagem copiada" : "Selecione o texto e copie";
      });
      mostrarRetorno({
        titulo: copiado ? "Mensagem copiada." : "Sua mensagem está pronta.",
        texto: copiado
          ? "Abra o Direct da Milênio no Instagram, cole a mensagem e envie. A solicitação chega à equipe depois desse envio."
          : "Copie o texto abaixo, abra o Direct da Milênio no Instagram, cole a mensagem e envie.",
        textoPronto: texto,
        acoes: [linkAcao("Abrir o Direct da Milênio", linkDirect, "instagram_click"), botaoCopiar],
      });
    }

    async function viaServidor(dados, texto) {
      const rotuloOriginal = enviar.textContent;
      enviar.disabled = true;
      enviar.textContent = "Enviando…";
      try {
        const resposta = await fetch(config.formulario, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ...dados, resumo: texto }),
        });
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        registrar("form_submit", { canal: "formulario" });
        form.reset();
        area.disabled = false;
        mostrarRetorno({
          titulo: "Solicitação enviada.",
          texto: "Os seus dados foram recebidos pela equipe da Milênio.",
        });
      } catch (_) {
        const alternativa = temWhatsApp
          ? linkAcao("Falar pelo WhatsApp", linkWhatsApp(texto), "whatsapp_click")
          : linkAcao("Falar pelo Instagram", linkDirect, "instagram_click");
        mostrarRetorno({
          erro: true,
          titulo: "Não foi possível enviar a solicitação.",
          texto: "Os dados não chegaram à equipe. Verifique a sua conexão e tente de novo, ou fale com a Milênio por outro canal.",
          acoes: [alternativa],
        });
      } finally {
        enviar.disabled = false;
        enviar.textContent = rotuloOriginal;
      }
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const invalidos = Object.keys(regras).filter((nome) => !validar(nome));
      if (invalidos.length) {
        form.elements[invalidos[0]].focus();
        return;
      }
      const dados = coletar();
      const texto = montarMensagem(dados);
      if (temServidor) viaServidor(dados, texto);
      else if (temWhatsApp) viaWhatsApp(texto);
      else viaInstagram(texto);
    });
  }

  /* ---------- Início ---------- */
  configurarCanal();
  configurarCabecalho();
  configurarMenu();
  configurarRevelacao();
  configurarGaleria();
  configurarFormulario();
  $$("[data-ano]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  window.milenioPronto = true;
})();
