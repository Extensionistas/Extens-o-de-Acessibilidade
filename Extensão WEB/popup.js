// Botões com filtros
document.querySelectorAll("button[data-filtro]").forEach((botao) => {
  botao.addEventListener("click", () => {
    const filtro = botao.getAttribute("data-filtro");

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        tipo: "aplicarFiltro",
        filtro: filtro,
      });
    });
  });
});

// Botão de reset
document.getElementById("reset").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      tipo: "resetarEstilos",
    });
  });
});

// Botão gerar descrição de imagens
document.getElementById("gerarDescricoes").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      tipo: "gerarDescricoes",
    });
  });
});
