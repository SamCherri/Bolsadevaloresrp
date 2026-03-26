type BuyValidationInput = {
  availableSupply: number;
  quantity: number;
  walletBalance: number;
  unitPrice: number;
};

type SellValidationInput = {
  holdingQuantity: number;
  quantity: number;
  circulatingSupply: number;
};

export function getCurrentMinuteBucket(date = new Date()) {
  return new Date(Math.floor(date.getTime() / 60000) * 60000);
}

export function calculateOrderTotals(input: { quantity: number; unitPrice: number; reservePercent: number }) {
  const totalValue = Number((input.quantity * input.unitPrice).toFixed(4));
  const reserveAmount = Number((totalValue * (input.reservePercent / 100)).toFixed(4));
  return { totalValue, reserveAmount };
}

export function validateBuyOrder(input: BuyValidationInput) {
  if (input.availableSupply < input.quantity) {
    return { error: 'Sem supply disponível para compra.' };
  }

  const totalValue = input.quantity * input.unitPrice;
  if (input.walletBalance < totalValue) {
    return { error: 'Saldo insuficiente.' };
  }

  return { ok: true as const };
}

export function validateSellOrder(input: SellValidationInput) {
  if (input.holdingQuantity < input.quantity) {
    return { error: 'Holding insuficiente para venda.' };
  }

  if (input.circulatingSupply < input.quantity) {
    return { error: 'Inconsistência de supply detectada. Contate o suporte.' };
  }

  return { ok: true as const };
}
