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

const offline = () => new ApiError(0, "Can't reach Progga right now. Check your internet and try again.", "network");

async function send(path: string, opts: Options, accept?: string): Promise<Response> {
  const headers: Record<string, string> = opts.form ? {} : { "Content-Type": "application/json" };
  if (accept) headers.Accept = accept;
  try {
    return await fetch(`/api${path}`, {
      method: opts.method ?? (opts.body || opts.form ? "POST" : "GET"),
      credentials: "include",
      signal: opts.signal,
      headers,
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    });
  } catch {
    throw offline();
  }
}

async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(res.status, err.message ?? "Something went wrong", err.code ?? "error", err.details);
  }
  return data as T;
}

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  return readJson<T>(await send(path, opts));
}

/**
 * Like `api`, but lets the server stream: `onPreview` receives each live update
 * (Progga's words as the AI writes them), and the promise resolves with the same
 * final body `api` would return.
 */
export async function apiStream<T, P>(path: string, opts: Options, onPreview: (preview: P) => void): Promise<T> {
  const res = await send(path, opts, "text/event-stream");
  if (!res.ok || !res.body || !res.headers.get("content-type")?.includes("text/event-stream")) return readJson<T>(res);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let end: number;
      while ((end = buffer.indexOf("\n\n")) >= 0) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        let event = "message";
        let data = "";
        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) data += line.slice(5).trim();
        }
        if (!data) continue; // keep-alive ping
        const body = JSON.parse(data);
        if (event === "preview") onPreview(body as P);
        else if (event === "done") return body as T;
        else if (event === "error") throw new ApiError(body.status ?? 500, body.message ?? "Something went wrong", body.code ?? "error", body.details);
      }
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw offline();
  } finally {
    reader.releaseLock();
  }
  throw new ApiError(0, "Progga lost the connection mid-sentence. Please try again.", "network");
}

/** SWR fetcher */
export const fetcher = <T,>(path: string) => api<T>(path);

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
