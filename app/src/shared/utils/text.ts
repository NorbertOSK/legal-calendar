export function toUppercaseName(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase()
}

export function toCapitalizedName(value: string | null | undefined): string {
  const normalized = (value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLocaleLowerCase('es')
      return lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1)
    })
    .join(' ')

  return normalized
}
