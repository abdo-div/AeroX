import Moamalat from "moamalat";

const getMoamalat = () => {
  return new Moamalat({
    merchantId: process.env.MOAMALAT_MERCHANT_ID,
    terminalId: process.env.MOAMALAT_TERMINAL_ID,
    secureKey: process.env.MOAMALAT_SECURE_KEY,
    prod: process.env.MOAMALAT_PRODUCTION === "true",
  });
};

export const createCheckout = (
  amount,
  merchantReference,
  date = new Date(),
) => {
  const moamalat = getMoamalat();

  return moamalat.checkout(amount, merchantReference, date);
};

export const verifyTransaction = async (merchantReference) => {
  const moamalat = getMoamalat();

  return await moamalat.transactionApproved(merchantReference);
};

export const getTransaction = async (merchantReference) => {
  const moamalat = getMoamalat();

  return await moamalat.transactions(merchantReference);
};
