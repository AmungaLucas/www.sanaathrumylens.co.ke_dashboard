// Simple in-memory rate limiter
const rateLimits = new Map();

export function rateLimit(ip, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / windowMs)}`;

  const current = rateLimits.get(key) || 0;
  if (current >= limit) {
    return { success: false, retryAfter: Math.ceil((windowMs - (now % windowMs)) / 1000) };
  }

  rateLimits.set(key, current + 1);

  // Cleanup old entries periodically
  if (rateLimits.size > 10000) {
    const cutoff = now - windowMs;
    for (const [k, _v] of rateLimits) {
      const timestamp = parseInt(k.split(':')[1]) * windowMs;
      if (timestamp < cutoff) rateLimits.delete(k);
    }
  }

  return { success: true, remaining: limit - current - 1 };
}

// Helper to get client IP from request
export function getClientIp(request) {
  // Prefer direct connection IP, then fall back to x-forwarded-for
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Use only the first IP in the chain (set by the nearest proxy)
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  return 'unknown';
}
