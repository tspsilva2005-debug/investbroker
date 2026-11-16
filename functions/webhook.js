export async function onRequestPost(context) {
  const { request } = context;
  try {
    const bodyText = await request.text();
    console.log("===== WEBHOOK PAY BE HIVE =====");
    console.log("Body:", bodyText);
    return new Response("OK", { status: 200 });
  } catch (error) {
    return new Response("OK", { status: 200 });
  }
}

export async function onRequestGet() {
  return new Response("Webhook Pay Be Hive ativo ✅", { status: 200 });
}
