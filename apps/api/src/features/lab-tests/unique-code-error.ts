import { LibsqlError } from "@libsql/client";

const SQLITE_CONSTRAINT_UNIQUE = 2067;

export function isUniqueCodeError(cause: unknown) {
  let current = cause;
  while (current) {
    if (
      current instanceof LibsqlError &&
      (current.extendedCode === "SQLITE_CONSTRAINT_UNIQUE" ||
        current.code === "SQLITE_CONSTRAINT_UNIQUE" ||
        current.rawCode === SQLITE_CONSTRAINT_UNIQUE)
    ) {
      return true;
    }

    const message = current instanceof Error ? current.message : String(current);
    if (
      /UNIQUE constraint failed: lab_tests\.code/i.test(message) ||
      /lab_tests_code_unique/i.test(message)
    ) {
      return true;
    }

    current = current instanceof Error ? current.cause : undefined;
  }
  return false;
}
