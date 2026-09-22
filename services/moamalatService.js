import Moamalat from "moamalat";

const getMoamalat = () => {
  const requiredSettings = [
    "MOAMALAT_MERCHANT_ID",
    "MOAMALAT_TERMINAL_ID",
    "MOAMALAT_SECURE_KEY",
  ];

  const missingSettings = requiredSettings.filter((setting) => !process.env[setting]);
  if (missingSettings.length > 0) {
    throw new Error(`Missing Moamalat configuration: ${missingSettings.join(", ")}`);
  }

  return new Moamalat({
    merchantId: process.env.MOAMALAT_MERCHANT_ID,
    terminalId: process.env.MOAMALAT_TERMINAL_ID,
    secureKey: process.env.MOAMALAT_SECURE_KEY,
    prod: process.env.MOAMALAT_PRODUCTION === "true",
  });
};

export const getHostedCheckoutBaseUrl = () =>
  process.env.MOAMALAT_PRODUCTION === "true"
    ? "https://npg.moamalat.net"
    : "https://tnpg.moamalat.net:6006";

export const createCheckout = (
  amountInLYD,
  merchantReference,
  date = new Date()
) => {
  const moamalat = getMoamalat();
  return moamalat.checkout(Number(amountInLYD), merchantReference, date);
};

export const verifyTransaction = async (merchantReference) => {
  const moamalat = getMoamalat();
  return await moamalat.transactionApproved(merchantReference);
};

export const getTransaction = async (merchantReference) => {
  const moamalat = getMoamalat();
  return await moamalat.transactions(merchantReference);
};