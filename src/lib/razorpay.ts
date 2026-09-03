import Razorpay from 'razorpay';

// Lazy getter — throws only when checkout is actually called,
// not at module load time, so the app boots even without Razorpay keys.
export function getRazorpay(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.includes('YOUR_KEY')) {
    throw new Error(
      'Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local'
    );
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
