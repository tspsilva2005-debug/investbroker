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
    
    const publicKey = env.FREEPAY_PUBLIC_KEY;
    const secretKey = env.FREEPAY_SECRET_KEY;
    
    if (!publicKey || !secretKey) {
      return new Response(JSON.stringify({ error: "Chaves de API não configuradas." }), { status: 500, headers });
    }

    // Usa btoa para codificar em Base64 (nativo do Cloudflare)
    const authString = btoa(`${publicKey}:${secretKey}`);
    const valorCentavos = Math.round(Number(amount) * 100);

    let emailFinal = customerEmail;
    if (!emailFinal || !emailFinal.includes('@')) {
        emailFinal = "cliente@investbroker.com";
    }

    const payload = {
      amount: valorCentavos,
      payment_method: "pix",
      postback_url: "https://seu-projeto.pages.dev/api/webhook", // Lembre-se de trocar "seu-projeto" depois!
      customer: {
        name: customerName || "Cliente Teste",
        email: emailFinal,
        document: { type: "cpf", number: "52998224725" },
        phone: "11999999999" 
      },
      items: [{ title: "Deposito", unit_price: valorCentavos, quantity: 1, tangible: false }],
      pix: { expires_in_days: 1 }
    };

    const response = await fetch("https://api.freepaybrasil.com/v1/payment-transaction/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data;
    try { data = JSON.parse(responseText); } catch (e) { data = {}; }

    if (!response.ok) {
      let mensagemErro = data.error_messages?.[0]?.message || data.title || data.message || "A FreePay recusou a transação.";
      if (data.errors) {
          const detalhes = Object.entries(data.errors).map(([campo, msgs]) => {
              const msgStr = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
              return `${campo}: ${msgStr}`;
          }).join(' | ');
          if (detalhes) mensagemErro = `Erro: ${detalhes}`;
      }
      return new Response(JSON.stringify({ error: mensagemErro }), { status: response.status, headers });
    }

    const qrCode = data.data?.pix?.qr_code || data.pix?.qr_code;
    return new Response(JSON.stringify({ qrCode: qrCode }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}