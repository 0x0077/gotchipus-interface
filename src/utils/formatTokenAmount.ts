
export function formatTokenAmount(amount: number): string {
  if (!isFinite(amount) || amount === 0) return "0";
  const abs = Math.abs(amount);
  if (abs >= 1) {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  if (abs >= 0.001) return amount.toFixed(4);     
  if (abs >= 0.00001) return amount.toFixed(6);   
  if (abs >= 0.0000001) return amount.toFixed(8); 
  return amount.toExponential(2);                 
}
