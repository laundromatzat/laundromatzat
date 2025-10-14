export const isChatResetPayload = (payload: unknown): boolean => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  const name = typeof candidate.name === 'string' ? candidate.name.toLowerCase() : '';
  const action = typeof candidate.action === 'string' ? candidate.action.toLowerCase() : '';

  if (name.includes('reset') || action.includes('reset')) {
    return true;
  }

  if (candidate.reset === true || candidate.type === 'reset') {
    return true;
  }

  return false;
};

export default isChatResetPayload;
