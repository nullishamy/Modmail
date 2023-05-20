function reportInvalidConfig (key: string, value: unknown, expected: string): never {
  logger.error(`Config value ${key} was invalid, got ${value} expected ${expected}`)
  process.exit(1)
}

/**
 * Read a string from the environment.
 */
export function string (key: string): string {
  const value = process.env[key]

  if (!value) {
    reportInvalidConfig(key, value, 'a non empty string')
  }

  return value
}

/**
 * Read a number from the environment.
 */
export function number (key: string): number {
  const value = Number(string(key))

  if (isNaN(value)) {
    reportInvalidConfig(key, value, 'a number')
  }

  return value
}

/**
 * Read a boolean from the environment.
 */
export function boolean (key: string): boolean {
  const value = string(key)

  if (value !== 'true' && value !== 'false') {
    reportInvalidConfig(key, value, 'a boolean')
  }

  // Return true if the string is true, if not then it must be false
  return value === 'true'
}