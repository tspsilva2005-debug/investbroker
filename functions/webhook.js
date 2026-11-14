exports.handler = async (event) => {
  console.log("Webhook recebido da FreePay:", event.body);
  return { 
    statusCode: 200, 
    body: "OK" 
  };
};