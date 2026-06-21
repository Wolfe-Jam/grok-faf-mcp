/**
 * xAI Collections REST client (FRC · Phase III) — the ONE real Collections client.
 *
 * Kills the split-brain. The legacy `src/rag/xai-client.ts` only hits
 * `/chat/completions` with a STATIC prompt — it never touches Collections (the
 * collection id was cache-key salt). The real retrieval lived in Python
 * (`xai-faf-rag`, gRPC `xai-sdk`). This is the TS consolidation: one client that
 * talks to the real Collections REST API, runs local (Node) AND on the edge
 * (Workers) via `fetch`, no SDK (there is no official JS xai-sdk — the npm
 * `xai-sdk` is a 306-byte third-party stub).
 *
 * Dual base + dual key (mirrors the verified Python integrator):
 *   - SEARCH      → POST https://api.x.ai/v1/documents/search   (xAI API key)
 *   - MANAGEMENT  → https://management-api.x.ai/v1/collections  (Management API key)
 *
 * Built to the published REST contract (docs.x.ai/developers/rest-api-reference).
 * Request-shaping is unit-tested against that contract with an injected `fetch`;
 * live calls are GO-gated and need the operator's keys.
 */

export interface CollectionsClientConfig {
  /** xAI API key — search (api.x.ai). */
  apiKey: string;
  /** Management API key — create/list/upload (management-api.x.ai). Optional: search-only clients don't need it. */
  managementApiKey?: string;
  /** Override the search base (default https://api.x.ai). */
  searchBaseUrl?: string;
  /** Override the management base (default https://management-api.x.ai/v1). */
  managementBaseUrl?: string;
  /** Injectable fetch (tests / edge). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

/** One retrieved chunk (normalized to camelCase from the REST `matches[]` shape). */
export interface CollectionMatch {
  chunkContent: string;
  chunkId: string;
  fileId: string;
  collectionIds: string[];
  score: number;
  fields?: Record<string, unknown>;
  pageNumber?: number;
}

export interface SearchResult {
  matches: CollectionMatch[];
}

export interface SearchParams {
  query: string;
  collectionIds: string[];
  /** Chunks to return (REST default 10). */
  limit?: number;
  /**
   * Retrieval strategy. The REST `retrieval_mode` is an OBJECT whose exact shape
   * is under-documented (the Python SDK took a bare string). Omitted by default →
   * the API's own default applies. Only sent when explicitly provided.
   */
  retrievalMode?: 'hybrid' | 'semantic' | 'keyword';
  /** AIP-160 metadata filter (optional). */
  filter?: string;
}

export interface CollectionSummary {
  collectionId: string;
  collectionName: string;
  documentsCount?: number;
  raw: Record<string, unknown>;
}

export interface CreateCollectionParams {
  name: string;
  /** Embedding model. Only confirmed value: grok-embedding-small. */
  modelName?: string;
  description?: string;
}

const DEFAULT_SEARCH_BASE = 'https://api.x.ai';
const DEFAULT_MGMT_BASE = 'https://management-api.x.ai/v1';
const DEFAULT_EMBEDDING = 'grok-embedding-small';
const DEFAULT_LIMIT = 10;

interface RawMatch {
  chunk_content?: string;
  chunk_id?: string;
  file_id?: string;
  collection_ids?: string[];
  score?: number;
  fields?: Record<string, unknown>;
  page_number?: number;
}

function normalizeMatch(m: RawMatch): CollectionMatch {
  return {
    chunkContent: m.chunk_content ?? '',
    chunkId: m.chunk_id ?? '',
    fileId: m.file_id ?? '',
    collectionIds: m.collection_ids ?? [],
    score: typeof m.score === 'number' ? m.score : 0,
    ...(m.fields !== undefined ? { fields: m.fields } : {}),
    ...(m.page_number !== undefined ? { pageNumber: m.page_number } : {}),
  };
}

export class CollectionsClient {
  private readonly apiKey: string;
  private readonly managementApiKey?: string;
  private readonly searchBaseUrl: string;
  private readonly managementBaseUrl: string;
  private readonly doFetch: typeof fetch;

  constructor(config: CollectionsClientConfig) {
    this.apiKey = config.apiKey;
    this.managementApiKey = config.managementApiKey;
    this.searchBaseUrl = (config.searchBaseUrl ?? DEFAULT_SEARCH_BASE).replace(/\/$/, '');
    this.managementBaseUrl = (config.managementBaseUrl ?? DEFAULT_MGMT_BASE).replace(/\/$/, '');
    this.doFetch = config.fetchImpl ?? fetch;
  }

  /** Search has a usable key. */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /** Management ops have a usable key. */
  canManage(): boolean {
    return !!this.managementApiKey && this.managementApiKey.length > 0;
  }

  /**
   * Real Collections search — the deterministic retrieval the shim never did.
   * POST https://api.x.ai/v1/documents/search
   */
  async search(params: SearchParams): Promise<SearchResult> {
    if (!params.query || !params.query.trim()) {
      throw new Error('CollectionsClient.search: query is required');
    }
    if (!params.collectionIds || params.collectionIds.length === 0) {
      throw new Error('CollectionsClient.search: at least one collectionId is required');
    }

    const body: Record<string, unknown> = {
      query: params.query,
      source: { collection_ids: params.collectionIds },
      limit: params.limit ?? DEFAULT_LIMIT,
    };
    if (params.retrievalMode) body.retrieval_mode = { mode: params.retrievalMode };
    if (params.filter) body.filter = params.filter;

    const res = await this.doFetch(`${this.searchBaseUrl}/v1/documents/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`xAI Collections search error (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as { matches?: RawMatch[] };
    return { matches: (data.matches ?? []).map(normalizeMatch) };
  }

  /**
   * Create a collection.
   * POST https://management-api.x.ai/v1/collections  (Management API key)
   */
  async createCollection(params: CreateCollectionParams): Promise<CollectionSummary> {
    this.requireManagementKey('createCollection');

    const body: Record<string, unknown> = {
      collection_name: params.name,
      index_configuration: { model_name: params.modelName ?? DEFAULT_EMBEDDING },
    };
    if (params.description) body.collection_description = params.description;

    const res = await this.doFetch(`${this.managementBaseUrl}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.managementApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`xAI create collection error (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as Record<string, unknown>;
    return {
      collectionId: String(data.collection_id ?? ''),
      collectionName: String(data.collection_name ?? params.name),
      documentsCount: typeof data.documents_count === 'number' ? data.documents_count : undefined,
      raw: data,
    };
  }

  /**
   * List collections.
   * GET https://management-api.x.ai/v1/collections  (Management API key)
   * Handles both `{collections:[...]}` and `{data:[...]}` envelopes (the Python
   * SDK exposed `.collections`; tolerate `.data` defensively).
   */
  async listCollections(): Promise<CollectionSummary[]> {
    this.requireManagementKey('listCollections');

    const res = await this.doFetch(`${this.managementBaseUrl}/collections`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.managementApiKey}` },
    });

    if (!res.ok) {
      throw new Error(`xAI list collections error (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as {
      collections?: Array<Record<string, unknown>>;
      data?: Array<Record<string, unknown>>;
    };
    const rows = data.collections ?? data.data ?? [];
    return rows.map((c) => ({
      collectionId: String(c.collection_id ?? ''),
      collectionName: String(c.collection_name ?? ''),
      documentsCount: typeof c.documents_count === 'number' ? c.documents_count : undefined,
      raw: c,
    }));
  }

  /**
   * Upload a document — PARKED (follow-on brick), deliberately not implemented.
   *
   * The published REST contract is CONFLICTING and unverified-live:
   *   (a) single multipart POST  → /collections/{id}/documents  (name,data,content_type)
   *   (b) two-step               → upload file, then POST /collections/{id}/documents/{file_id}
   *
   * Per FAF-don't-lie, we do not ship a guessed/wrong upload path. Resolve the
   * live contract (operator keys, GO-gated) and implement the verified shape.
   */
  async uploadDocument(): Promise<never> {
    throw new Error(
      'CollectionsClient.uploadDocument: not implemented — upload contract is conflicting/unverified ' +
        '(single-multipart vs upload-then-associate). Live-verify before implementing (FRC follow-on brick).',
    );
  }

  private requireManagementKey(op: string): void {
    if (!this.canManage()) {
      throw new Error(
        `CollectionsClient.${op}: XAI_MANAGEMENT_API_KEY required for management operations`,
      );
    }
  }
}
