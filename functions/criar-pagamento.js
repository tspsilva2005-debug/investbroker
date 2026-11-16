export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    const { amount, customerName, customerEmail } = await request.json();
    
    const apiKey = env.FINX_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Chave da FinX Pay não configurada no Cloudflare." }), { status: 500, headers });
    }

    const valorCentavos = Math.round(Number(amount) * 100);
    let emailFinal = customerEmail;
    if (!emailFinal || !emailFinal.includes('@')) emailFinal = "cliente@investbroker.com";

    // Payload padrão para criação de cobrança PIX
    const payload = {
      amount: valorCentavos,
      paymentMethod: "PIX",
      customer: {
        name: customerName || "Cliente Teste",
        email: emailFinal,
        document: { type: "CPF", number: "52998224725" }
      },
      postbackUrl: "https://investbrokerr.pages.dev/webhook"
    };

    // ⚠️ ATENÇÃO: Confirme na documentação da FinX Pay qual é a rota exata.
    // Exemplos comuns: /v1/pix, /v1/transactions, /transactions/payment, /v1/charges
    const response = await fetch("https://finxpay.tech/v1/pix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data;
    try { data = JSON.parse(responseText); } catch (e) { data = {}; }

    if (!response.ok) {
      let mensagemErro = data.message || data.error || `A FinX Pay recusou a transação (Status: ${response.status}).`;
      return new Response(JSON.stringify({ error: mensagemErro }), { status: response.status, headers });
    }

    // Tenta extrair o código copia-e-cola de campos comuns na resposta
    const qrCode = data.pix?.qrCode || data.pix?.brCode || data.qrCode || data.brCode || data.point_of_interaction?.transaction_data?.qr_code;
    
    if (!qrCode) {
      return new Response(JSON.stringify({ error: "API não retornou o QR Code esperado. Verifique o formato da resposta.", debug: data }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ qrCode: qrCode }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}
