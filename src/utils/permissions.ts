export function checkFunerariaAccess(
  profile?: { role?: string; email?: string; name?: string } | null,
  userEmail?: string | null
): boolean {
  if (!profile && !userEmail) return false;

  const email = (profile?.email || userEmail || '').toLowerCase().trim();
  const role = (profile?.role || '').toLowerCase().trim();

  // Known admin / director / marketing emails always have access
  if (
    email === 'marketing@bahiaprev.com.br' ||
    email === 'lucasrodrigues@bahiaprev.com.br' ||
    email === 'jairoqueiroz@bahiaprev.com.br' ||
    email === 'institutojairoqueiroz@gmail.com' ||
    email.includes('lucas') ||
    email.includes('jairo')
  ) {
    return true;
  }

  // Allowed roles check:
  // - Atendimento e Recepção
  // - Diretor e Presidente
  // - Gerente Funerário
  // - Analista de Marketing
  // - Agente Funerário
  const hasAllowedRole =
    role.includes('atendimento') ||
    role.includes('recepção') ||
    role.includes('recepcao') ||
    role.includes('diretor') ||
    role.includes('presidente') ||
    role.includes('administrador') ||
    role.includes('gerente funerário') ||
    role.includes('gerente funerario') ||
    role.includes('analista de marketing') ||
    role.includes('marketing') ||
    role.includes('agente funerário') ||
    role.includes('agente funerario');

  return hasAllowedRole;
}
