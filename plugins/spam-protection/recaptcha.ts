import axios from 'axios';

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export async function verifyRecaptcha(token: string): Promise<number> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY not configured');
    // Return neutral score if not configured (for development)
    return 0.5;
  }

  try {
    const response = await axios.post<RecaptchaResponse>(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: token,
        },
      }
    );

    if (response.data.success && response.data.score !== undefined) {
      return response.data.score;
    }

    console.error('reCAPTCHA verification failed:', response.data['error-codes']);
    return 0;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return 0;
  }
}

export function isSpamScore(score: number): boolean {
  const threshold = parseFloat(process.env.RECAPTCHA_THRESHOLD || '0.7');
  return score < threshold;
}