/**
 * Utility functions for user name identification and capitalization.
 * Ensures first name and surname always start with uppercase letters.
 */

// Known system users and full names
export const KNOWN_USERS_MAP: Record<string, string> = {
  'lucasrodrigues@bahiaprev.com.br': 'Lucas Rodrigues',
  'marketing@bahiaprev.com.br': 'Lucas Rodrigues',
  'jairoqueiroz@bahiaprev.com.br': 'Jairo Queiroz',
  'cauan@bahiaprev.com.br': 'Cauan',
  'nilton@bahiaprev.com.br': 'Nilton',
  'thayan@bahiaprev.com.br': 'Thayan',
  'vitor@bahiaprev.com.br': 'Vitor',
  'paulo@bahiaprev.com.br': 'Paulo',
};

/**
 * Capitalizes the first letter of each word (name and surname).
 * Preserves compound names, handles accents, and trims excess spacing.
 */
export function capitalizeWords(text: string): string {
  if (!text || typeof text !== 'string') return '';

  // Particles that can stay lowercase unless at the very start
  const lowercaseParticles = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

  const words = text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ');

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && lowercaseParticles.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Extracts and formats name and surname from an email address
 * e.g., 'joao.silva@bahiaprev.com.br' -> 'Joao Silva'
 * e.g., 'carlos_eduardo@...' -> 'Carlos Eduardo'
 */
export function extractNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return '';
  const localPart = email.split('@')[0];
  const cleaned = localPart.replace(/[._\-+]/g, ' ');
  return capitalizeWords(cleaned);
}

/**
 * Formats a user name given an optional name and email.
 * Guarantees proper identification, full name/surname capitalization.
 */
export function formatUserName(name?: string | null, email?: string | null): string {
  const cleanEmail = (email || '').trim().toLowerCase();

  // 1. Clean and check explicitly provided name first
  if (name && typeof name === 'string') {
    let cleanName = name.trim();
    // Remove cargo in parentheses if appended like "Lucas Rodrigues (Analista de Marketing)"
    cleanName = cleanName.replace(/\s*\([^)]*\)/g, '').trim();

    // If the name is an email address, extract clean name from it
    if (cleanName.includes('@')) {
      cleanName = extractNameFromEmail(cleanName);
    }

    if (cleanName && cleanName.toLowerCase() !== 'colaborador') {
      return capitalizeWords(cleanName);
    }
  }

  // 2. Check known users mapping by exact email as fallback
  if (cleanEmail && KNOWN_USERS_MAP[cleanEmail]) {
    return KNOWN_USERS_MAP[cleanEmail];
  }

  // 3. Check known aliases based on email substring as fallback
  if (cleanEmail.includes('lucas')) return 'Lucas Rodrigues';
  if (cleanEmail.includes('jairo')) return 'Jairo Queiroz';
  if (cleanEmail.includes('cauan')) return 'Cauan';
  if (cleanEmail.includes('nilton')) return 'Nilton';
  if (cleanEmail.includes('thayan') || cleanEmail.includes('thaya')) return 'Thayan';
  if (cleanEmail.includes('vitor')) return 'Vitor';
  if (cleanEmail.includes('paulo')) return 'Paulo';

  // 4. Fallback to extracting from email
  if (cleanEmail) {
    const fromEmail = extractNameFromEmail(cleanEmail);
    if (fromEmail) return fromEmail;
  }

  return 'Colaborador';
}
