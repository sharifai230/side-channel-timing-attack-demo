
/**
 * Converts an ArrayBuffer to a hexadecimal string.
 */
export const bufferToHex = (buffer: ArrayBuffer): string => {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Converts a hexadecimal string to a Uint8Array.
 */
export const hexToBuffer = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

/**
 * Calculates a SHA-1 HMAC for the given key and data using the Web Crypto API.
 */
export const calculateHmac = async (key: string, data: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(data);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );

    return bufferToHex(signature);
  } catch (error) {
    console.error("HMAC calculation failed:", error);
    return '';
  }
};

/**
 * An intentionally vulnerable comparison function that introduces a delay
 * for each correctly matched byte, creating a timing side-channel.
 * @returns {Promise<boolean>} A promise that resolves to true if signatures match, false otherwise.
 */
export const vulnerableCompare = async (
  correctSignatureHex: string,
  userSignatureHex: string,
  delayPerByte: number
): Promise<boolean> => {
  const correctBytes = hexToBuffer(correctSignatureHex);
  const userBytes = hexToBuffer(userSignatureHex);

  if (correctBytes.length !== userBytes.length) {
    return false;
  }

  for (let i = 0; i < correctBytes.length; i++) {
    if (correctBytes[i] === userBytes[i]) {
      // Introduce a delay for each matching byte
      await new Promise(resolve => setTimeout(resolve, delayPerByte));
    } else {
      // Early exit on mismatch
      return false;
    }
  }

  // All bytes matched
  return true;
};
