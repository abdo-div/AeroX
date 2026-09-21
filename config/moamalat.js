import Moamalat from "moamalat";

const moamalat = new Moamalat({
  merchantId: process.env.MOAMALAT_MERCHANT_ID,
  terminalId: process.env.MOAMALAT_TERMINAL_ID,
  secureKey: process.env.MOAMALAT_SECURE_KEY,
  prod: process.env.MOAMALAT_PRODUCTION === "true",
});

export default moamalat;
