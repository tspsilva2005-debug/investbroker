export async function onRequestPost(context) {
  const { request } = context;

  try {
    const bodyText = await request.text();
    console.log("===== WEBHOOK RECEBIDO DA FREEPAY =====");
    console.log("Body:", bodyText);

    let payload;
    try { payload = JSON.parse(bodyText); } catch (e) {}

    if (payload) {
        const status = payload?.data?.status || payload?.status;
        if (status === "paid" || status === "approved" || status === "completed") {
            console.log("✅ PAGAMENTO CONFIRMADO!");
        }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return new Response("OK", { status: 200 });
  }
}

export async function onRequestGet() {
  return new Response("Webhook InvestBroker ativo ✅", { status: 200 });
}
