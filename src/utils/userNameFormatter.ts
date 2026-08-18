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

  // 1. Check known users mapping by exact email
  if (cleanEmail && KNOWN_USERS_MAP[cleanEmail]) {
    return KNOWN_USERS_MAP[cleanEmail];
  }

  // 2. Check known aliases based on email substring
  if (cleanEmail.includes('lucas')) return 'Lucas Rodrigues';
  if (cleanEmail.includes('jairo')) return 'Jairo Queiroz';
  if (cleanEmail.includes('cauan')) {
    // If a custom name with surname was provided, keep and capitalize it
    if (name && name.toLowerCase().includes('cauan') && name.trim().split(' ').length > 1) {
      return capitalizeWords(name);
    }
    return 'Cauan';
  }
  if (cleanEmail.includes('nilton')) {
    if (name && name.toLowerCase().includes('nilton') && name.trim().split(' ').length > 1) {
      return capitalizeWords(name);
    }
    return 'Nilton';
  }
  if (cleanEmail.includes('thayan') || cleanEmail.includes('thaya')) {
    if (name && name.toLowerCase().includes('thay') && name.trim().split(' ').length > 1) {
      return capitalizeWords(name);
    }
    return 'Thayan';
  }
  if (cleanEmail.includes('vitor')) {
    if (name && name.toLowerCase().includes('vitor') && name.trim().split(' ').length > 1) {
      return capitalizeWords(name);
    }
    return 'Vitor';
  }
  if (cleanEmail.includes('paulo')) {
    if (name && name.toLowerCase().includes('paulo') && name.trim().split(' ').length > 1) {
      return capitalizeWords(name);
    }
    return 'Paulo';
  }

  // 3. Clean and check provided name
  if (name && typeof name === 'string') {
    let cleanName = name.trim();
    // Remove cargo in parentheses if appended like "Lucas Rodrigues (Analista de Marketing)"
    cleanName = cleanName.replace(/\s*\([^)]*\)/g, '').trim();

    // If the name is an email address, extract clean name from it
    if (cleanName.includes('@')) {
      return extractNameFromEmail(cleanName);
    }

    if (cleanName) {
      const lowerName = cleanName.toLowerCase();
      if (lowerName === 'lucas' || lowerName.includes('lucas rodrigues')) return 'Lucas Rodrigues';
      if (lowerName === 'jairo' || lowerName.includes('jairo queiroz')) return 'Jairo Queiroz';
      return capitalizeWords(cleanName);
    }
  }

  // 4. Fallback to extracting from email
  if (cleanEmail) {
    const fromEmail = extractNameFromEmail(cleanEmail);
    if (fromEmail) return fromEmail;
  }

  return 'Colaborador';
}
