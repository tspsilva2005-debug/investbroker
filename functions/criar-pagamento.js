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
    
    // A chave da FinX Pay deve ser configurada no Cloudflare como FINX_API_KEY
    const apiKey = env.FINX_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Chave da FinX Pay não configurada." }), { status: 500, headers });
    }

    const valorCentavos = Math.round(Number(amount) * 100);
    
    let emailFinal = customerEmail;
    if (!emailFinal || !emailFinal.includes('@')) {
        emailFinal = "cliente@investbroker.com";
    }

    // Payload genérico para criação de cobrança PIX
    const payload = {
      amount: valorCentavos,
      payment_method: "pix",
      customer: {
        name: customerName || "Cliente Teste",
        email: emailFinal,
        document: { type: "cpf", number: "52998224725" },
        phone: "11999999999"
      },
      items: [{ title: "Deposito", unit_price: valorCentavos, quantity: 1, tangible: false }],
      // URL do seu webhook no Cloudflare Pages
      postback_url: "https://investbrokerr.pages.dev/webhook"
    };

    // ATENÇÃO: Confirme na documentação da FinX Pay qual é o endpoint exato (ex: /v1/pix, /v1/charges, /v1/cobranca)
    const response = await fetch("https://api.finxpay.com/v1/pix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey // Autenticação conforme a imagem do painel
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

    // Tenta extrair o QR Code de diferentes locais possíveis na resposta
    const qrCode = data.qrCode || data.pix?.qr_code || data.point_of_interaction?.transaction_data?.qr_code || data.qr_code;
    
    if (!qrCode) {
      return new Response(JSON.stringify({ error: "Resposta da API não contém o QR Code esperado.", debug: data }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ qrCode: qrCode }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}
