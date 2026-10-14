import crypto from 'crypto';

export function verifyWooCommerceWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  try {
    const computedHash = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(computedHash)
    );
  } catch (err) {
    return false;
  }
}
