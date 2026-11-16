export async function onRequestPost(context) {
  const { request } = context;
  try {
    const bodyText = await request.text();
    console.log("===== WEBHOOK FINX PAY =====");
    console.log("Body:", bodyText);
    // Opcional: validar a assinatura HMAC usando o header 'x-finx-signature' ou similar
    return new Response("OK", { status: 200 });
  } catch (error) {
    return new Response("OK", { status: 200 });
  }
}

export async function onRequestGet() {
  return new Response("Webhook FinX Pay ativo ✅", { status: 200 });
}
