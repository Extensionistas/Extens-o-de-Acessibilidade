const REPLICATE_TOKEN = "SEU_TOKEN_AQUI!"; // Token da API
const LIMITE_IMAGENS = 3;

console.log("Extensão ativa nesta página!");

// Coleta todas as imagens válidas (URL pública + extensões permitida)
const imagens = Array.from(document.images)
  .map((img) => img.src)
  .filter((url) => url.startsWith("http") && /\.(jpe?g|png|webp)$/i.test(url));

console.log("Imagens encontradas na página:");
console.log(imagens);

function exibirDescricoes(descricoes) {
  console.log("Descrições para exibir:", descricoes);
  let container = document.getElementById("descricao-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "descricao-container";
    container.style.position = "fixed";
    container.style.bottom = "10px";
    container.style.right = "10px";
    container.style.background = "#fff";
    container.style.border = "1px solid #ccc";
    container.style.padding = "10px";
    container.style.zIndex = 99999;
    container.style.maxHeight = "300px";
    container.style.overflowY = "auto";
    container.style.fontSize = "14px";
    container.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
    document.body.appendChild(container);
  }

  container.innerHTML =
    "<strong>Descrições geradas:</strong><br><ul>" +
    descricoes.map((d) => `<li>${d}</li>`).join("") +
    "</ul>";
}

// Função que chama o BackGround com a requisição para a API
function descreverImagem(imageUrl) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        tipo: "descreverImagem",
        token: REPLICATE_TOKEN,
        imageUrl: imageUrl,
      },
      (resposta) => {
        if (!resposta) return reject("Erro: resposta vazia do background.js");
        if (resposta.erro) return reject(resposta.erro);
        if (resposta.output) {
          const textoLimpo =
            resposta.output.split("Caption: ")[1] || resposta.output;
          return resolve(textoLimpo);
        }
        reject("Resposta inesperada da IA");
      }
    );
  });
}

// A descrição demora um pouquinho para chegar, então tem essa função de carregamento
function mostrarCarregando(ativo) {
  let existente = document.getElementById("loading-descricoes");
  if (ativo && !existente) {
    const loader = document.createElement("div");
    loader.id = "loading-descricoes";
    loader.style.position = "fixed";
    loader.style.bottom = "10px";
    loader.style.right = "10px";
    loader.style.background = "#fff";
    loader.style.padding = "10px";
    loader.style.border = "1px solid #ccc";
    loader.style.zIndex = 99999;
    loader.innerText = "Gerando descrições...";
    document.body.appendChild(loader);
  } else if (!ativo && existente) {
    existente.remove();
  }
}

// Função de aplicar filtros
function aplicarFiltro(filtro) {
  const estilo = document.body.style;

  if (filtro === "contraste") {
    document.body.style.backgroundColor = "#000";
    document.body.style.color = "#FFF";

    const todosElementos = document.querySelectorAll("*");

    todosElementos.forEach((el) => {
      el.style.backgroundColor = "#000"; // fundo escuro
      el.style.color = "#FFF"; // texto claro
      el.style.borderColor = "#FFF";
      el.style.fontFamily = "Arial, sans-serif";
      el.style.fontSize = "16px";
      el.style.lineHeight = "1.6";
      el.style.letterSpacing = "0.05em";

      // Links em destaque
      if (el.tagName === "A") {
        el.style.color = "#00FFFF"; // Ciano
        el.style.textDecoration = "underline";
      }

      // Botões e inputs com destaque
      if (["BUTTON", "INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
        el.style.backgroundColor = "#222"; // levemente diferente do fundo
        el.style.color = "#FFF";
        el.style.border = "1px solid #FFF";
      }
    });
  }

  if (filtro === "dislexia") {
    // Tenta carregar a fonte OpenDyslexic se disponível
    const linkFonte = document.createElement("link");
    linkFonte.href =
      "https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.0/open-dyslexic.css";
    linkFonte.rel = "stylesheet";
    document.head.appendChild(linkFonte);

    const todosElementos = document.querySelectorAll("*");
    todosElementos.forEach((el) => {
      el.style.fontFamily =
        "'OpenDyslexic', 'Comic Sans MS', Arial, sans-serif";
      el.style.backgroundColor = "#fdf6e3";
      el.style.color = "#111";
      el.style.fontSize = "18px";
      el.style.lineHeight = "1.8";
      el.style.letterSpacing = "0.1em";
    });
  }

  if (filtro === "zoom") {
    const todosElementos = document.querySelectorAll("*");

    todosElementos.forEach((el) => {
      el.style.fontSize = "22px";
      el.style.lineHeight = "2";
      el.style.letterSpacing = "0.1em";

      // Melhorar botões, inputs e interações
      if (
        ["BUTTON", "INPUT", "TEXTAREA", "SELECT", "LABEL"].includes(el.tagName)
      ) {
        el.style.padding = "10px";
        el.style.fontSize = "20px";
      }
    });
  }
}

// Função de resetar filtros
function resetarEstilos() {
  // Reset no body
  const estilo = document.body.style;
  estilo.backgroundColor = "";
  estilo.color = "";
  estilo.fontFamily = "";
  estilo.fontSize = "";
  estilo.lineHeight = "";
  estilo.letterSpacing = "";

  // Reset em todos os elementos
  const todosElementos = document.querySelectorAll("*");

  todosElementos.forEach((el) => {
    el.style.backgroundColor = "";
    el.style.color = "";
    el.style.borderColor = "";
    el.style.border = "";
    el.style.fontFamily = "";
    el.style.fontSize = "";
    el.style.lineHeight = "";
    el.style.letterSpacing = "";
    el.style.textDecoration = "";
  });
}

// Função que fica escutando as ações do popup
chrome.runtime.onMessage.addListener(function (mensagem, sender, sendResponse) {
  if (mensagem.tipo === "gerarDescricoes") {
    const imagensValidas = imagens.slice(0, LIMITE_IMAGENS);
    const descricoes = [];
    mostrarCarregando(true);

    (async () => {
      for (const url of imagensValidas) {
        try {
          const descricao = await descreverImagem(url);
          descricoes.push(descricao);
        } catch (e) {
          console.warn("Erro ao descrever imagem:", e);
          descricoes.push("❌ Erro ao descrever imagem.");
        }
      }

      mostrarCarregando(false);
      exibirDescricoes(descricoes);
    })();
  }

  if (mensagem.tipo === "aplicarFiltro") {
    aplicarFiltro(mensagem.filtro);
  }

  if (mensagem.tipo === "resetarEstilos") {
    resetarEstilos();
  }
});
