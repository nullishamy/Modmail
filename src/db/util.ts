import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient()

/**
 * Run the given database query, catching and reporting any errors.
 * There is no option to supress errors here, as database errors are
 * indicative of critical application failure.
 */
export async function query<T> (fn: (db: PrismaClient) => T | Promise<T>): Promise<T> {
  try {
    return await fn(db)
  } catch (err) {
    logger.error(`Database returned an error: ${err}`)
    throw err
  }
}