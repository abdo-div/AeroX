import Moamalat from "moamalat";

const merchantId = process.env.MOAMALAT_MID || process.env.MOAMALAT_MERCHANT_ID;
const terminalId = process.env.MOAMALAT_TID || process.env.MOAMALAT_TERMINAL_ID;

const moamalat = new Moamalat({
  merchantId,
  terminalId,
  secureKey: process.env.MOAMALAT_SECURE_KEY,
  prod: process.env.MOAMALAT_PRODUCTION === "true",
});

export default moamalat;
