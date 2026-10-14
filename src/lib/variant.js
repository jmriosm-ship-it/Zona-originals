// Tipo de modelo 3D según el nombre: Pro (3 cámaras) o estándar (2), y tamaño Max/Plus.
export const variantOf = (name = '') => {
  const pro = /pro/i.test(name)
  if (/max|plus/i.test(name)) return pro ? 'max-pro' : 'max-base'
  return pro ? 'pro' : 'base'
}
