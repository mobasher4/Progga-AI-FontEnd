// Thin, typed client for the Progga Node API (proxied at /api by next.config).

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
    public details?: Record<string, string[] | undefined>,
  ) {
    super(message);
  }
}

type Options = { method?: string; body?: unknown; form?: FormData; signal?: AbortSignal };

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const init: RequestInit = {
    method: opts.method ?? (opts.body || opts.form ? "POST" : "GET"),
    credentials: "include",
    signal: opts.signal,
    headers: opts.form ? undefined : { "Content-Type": "application/json" },
    body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  };

  let res: Response;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError(0, "Can't reach Progga right now. Check your internet and try again.", "network");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(res.status, err.message ?? "Something went wrong", err.code ?? "error", err.details);
  }
  return data as T;
}

/** SWR fetcher */
export const fetcher = <T,>(path: string) => api<T>(path);

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
