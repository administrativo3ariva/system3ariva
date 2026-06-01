export type PasswordStrength = 'weak' | 'medium' | 'strong';

export function getPasswordStrength(password: string): { level: PasswordStrength; score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 'weak', score, label: 'Fraca' };
  if (score <= 3) return { level: 'medium', score, label: 'Média' };
  return { level: 'strong', score, label: 'Forte' };
}
