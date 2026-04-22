const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export default function deepMerge<
  T extends Record<string, any>,
  S extends Record<string, any>,
>(target: T, source: S): T & S {
  const output: Record<string, any> = { ...target }

  if (!isObject(target) || !isObject(source)) return output as T & S

  for (const key of Object.keys(source)) {
    const srcVal = (source as Record<string, any>)[key]
    const tgtVal = (output as Record<string, any>)[key]

    if (isObject(srcVal)) {
      output[key] = isObject(tgtVal) ? deepMerge(tgtVal, srcVal) : srcVal
    } else {
      output[key] = srcVal
    }
  }

  return output as T & S
}
