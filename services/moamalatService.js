import Moamalat from "moamalat";

const getMoamalat = () => {
  const requiredSettings = [
    "MOAMALAT_MID",
    "MOAMALAT_TID",
    "MOAMALAT_SECURE_KEY",
  ];

  const MID = process.env.MOAMALAT_MID || process.env.MOAMALAT_MERCHANT_ID;
  const TID = process.env.MOAMALAT_TID || process.env.MOAMALAT_TERMINAL_ID;
  const missingSettings = [
    !MID && requiredSettings[0],
    !TID && requiredSettings[1],
    !process.env.MOAMALAT_SECURE_KEY && requiredSettings[2],
  ].filter(Boolean);
  if (missingSettings.length > 0) {
    throw new Error(`Missing Moamalat configuration: ${missingSettings.join(", ")}`);
  }

  return new Moamalat({
    merchantId: MID,
    terminalId: TID,
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