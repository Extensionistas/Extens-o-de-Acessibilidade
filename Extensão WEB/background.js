chrome.runtime.onMessage.addListener((mensagem, sender, sendResponse) => {
  if (mensagem.tipo === "descreverImagem") {
    console.log("[Background] Mensagem recebida:", mensagem);

    (async () => {
      try {
        // Faz a requisição inicial para criar a predição
        const resposta = await fetch(
          "https://api.replicate.com/v1/predictions",
          {
            method: "POST",
            headers: {
              Authorization: `Token ${mensagem.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              version:
                "2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
              input: {
                task: "image_captioning",
                image: mensagem.imageUrl,
              },
            }),
          }
        );

        const resultado = await resposta.json();
        console.log("[Background] Resposta inicial da API:", resultado);

        if (resultado.error) {
          console.log("[Background] API retornou erro:", resultado.error);
          sendResponse({ erro: resultado.error });
          return;
        }

        if (!resultado.urls || !resultado.urls.get) {
          console.log(
            "[Background] Resposta da API incompleta, falta urls.get"
          );
          sendResponse({ erro: "Resposta incompleta da API" });
          return;
        }

        const predictionUrl = resultado.urls.get;
        let status = resultado.status || "starting";
        let output = null;
        let dadosFinais = null;

        // Faz polling para obter o resultado final da predição
        while (status !== "succeeded" && status !== "failed") {
          const poll = await fetch(predictionUrl, {
            headers: {
              Authorization: `Token ${mensagem.token}`,
            },
          });
          const dados = await poll.json();
          console.log("[Background] Resposta do polling:", dados); // LOG de cada polling
          status = dados.status;
          output = dados.output;
          dadosFinais = dados;
          await new Promise((r) => setTimeout(r, 1000));
        }

        console.log(
          "[Background] Resposta final da API (último polling):",
          dadosFinais
        );

        if (status === "succeeded" && output) {
          console.log("[Background] Enviando output para content.js:", output);
          sendResponse({ output });
        } else {
          console.log("[Background] Predição falhou ou output vazio");
          sendResponse({ erro: "Falha ao gerar descrição" });
        }
      } catch (e) {
        console.log("[Background] Erro no try/catch:", e);
        sendResponse({ erro: e.message });
      }
    })();

    return true;
  }
});
