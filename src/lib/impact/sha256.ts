const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

function arrayBufferToHex(
  buffer: ArrayBuffer
): string {
  return Array.from(
    new Uint8Array(buffer)
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

export async function calculateFileSha256(
  file: File
): Promise<string> {
  if (
    typeof globalThis.crypto === "undefined" ||
    !globalThis.crypto.subtle
  ) {
    throw new Error(
      "El navegador no permite calcular SHA-256 en este contexto."
    );
  }

  const fileBuffer =
    await file.arrayBuffer();

  const hashBuffer =
    await globalThis.crypto.subtle.digest(
      "SHA-256",
      fileBuffer
    );

  const hexadecimalHash =
    arrayBufferToHex(hashBuffer);

  if (
    !SHA256_HEX_PATTERN.test(
      hexadecimalHash
    )
  ) {
    throw new Error(
      "El SHA-256 generado no tiene un formato válido."
    );
  }

  return hexadecimalHash;
}

export function isValidSha256(
  value: string
): boolean {
  return SHA256_HEX_PATTERN.test(
    value
  );
}

export function getSha256Preview(
  value: string,
  visibleCharacters = 12
): string {
  if (!isValidSha256(value)) {
    return "SHA-256 inválido";
  }

  const safeVisibleCharacters =
    Math.max(
      4,
      Math.min(
        visibleCharacters,
        24
      )
    );

  return `${value.slice(
    0,
    safeVisibleCharacters
  )}…${value.slice(
    -safeVisibleCharacters
  )}`;
}