export function convertToMoney(value: number | string = 0, isShowSign: boolean = true) {
  let formatted = Intl.NumberFormat('es-MX', {style: 'currency', currency: 'MXN'}).format(Number(value)).toString()

  // Elimina el símbolo de peso y espacios adicionales
  if (!isShowSign)
    formatted = formatted.replace(/\$\s?/g, '');
  return formatted
}
export function convertToMoneyEuro(value: number | string = 0, isShowSign: boolean = true) {
  let formatted = Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR'}).format(Number(value)).toString()

  // Elimina el símbolo de euro y espacios adicionales si isShowSign es false
  if (!isShowSign) {
    formatted = formatted.replace(/€\s?/g, '').trim()
  }

  return formatted
}


export function convertMoneyToNumber(value: string = ""): number {
  let numberString = value.replace(/[^0-9.-]+/g, "");
  return isNaN(parseFloat(numberString)) ? 0 : parseFloat(numberString)
}
