// Solo letras, espacios y acentos/ñ. Sin números ni símbolos raros.
// 👉 Vive aquí (y no repetida en cada vista) porque tanto CatalogView.vue
// como PackagesView.vue filtran nombres de la misma manera.
export const NAME_ALLOWED = /[^a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]/g

export function filterName(raw: string): string {
  return raw.replace(NAME_ALLOWED, '')
}