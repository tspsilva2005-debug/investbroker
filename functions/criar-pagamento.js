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
    
    const secretKey = env.BEEHIVE_SECRET_KEY;
    
    if (!secretKey) {
      return new Response(JSON.stringify({ error: "Chave secreta da Pay Be Hive não configurada." }), { status: 500, headers });
    }

    const valorCentavos = Math.round(Number(amount) * 100);
    
    let emailFinal = customerEmail;
    if (!emailFinal || !emailFinal.includes('@')) {
        emailFinal = "cliente@investbroker.com";
    }

    // Auth Basic: secretKey + ":" (a documentação manda usar Basic)
    const authString = btoa(`${secretKey}:`);

    const payload = {
      amount: valorCentavos,
      paymentMethod: "pix",
      customer: {
        name: customerName || "Cliente Teste",
        email: emailFinal,
        document: { type: "cpf", number: "52998224725" },
        phone: "11999999999"
      },
      items: [
        { title: "Deposito", unitPrice: valorCentavos, quantity: 1, tangible: false }
      ],
      postbackUrl: "https://investbrokerr.pages.dev/webhook" // Lembre-se de verificar seu link exato
    };

    const response = await fetch("https://api.conta.paybeehive.com.br/v1/transactions", {
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
      let mensagemErro = data.message || data.error || `A Pay Be Hive recusou a transação (Status: ${response.status}).`;
      return new Response(JSON.stringify({ error: mensagemErro }), { status: response.status, headers });
    }

    // Tenta extrair o QR Code de diferentes locais possíveis na resposta
    const qrCode = data.pix?.qrCode || data.qrCode || data.pix?.qrCodeImage || data.qrCodeImage;
    
    if (!qrCode) {
      return new Response(JSON.stringify({ error: "Resposta da API não contém o QR Code esperado.", debug: data }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ qrCode: qrCode }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}
