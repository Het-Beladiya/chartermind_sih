import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Custom API error containing HTTP status and response payload
 */
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Retrieve current bearer token from Firebase client SDK or local storage fallback
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken(true);
    }
  } catch (err) {
    console.warn('[API] Could not retrieve Firebase ID token:', err);
  }

  // Fallback for local development or demo user sessions
  try {
    const savedToken = localStorage.getItem('chartermind_token');
    if (savedToken) return savedToken;

    const savedUser = localStorage.getItem('chartermind_auth_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const emailPrefix = parsed.email ? parsed.email.split('@')[0] : 'charterer';
      return `demo-${emailPrefix}`;
    }
  } catch {
    // Ignore storage errors
  }

  return 'demo-charterer';
}

/**
 * Central authenticated fetch wrapper
 */
export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const detailMsg = typeof data === 'object' && data?.detail ? data.detail : response.statusText;
      const errorMsg = `API Error [${response.status}] ${endpoint}: ${detailMsg}`;
      console.error(`[API Error ${response.status}]`, data);
      throw new ApiError(errorMsg, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors (backend down)
    console.warn(`[API Network Notice] Backend at ${url} is unreachable. Operating in local computation mode.`);
    throw new ApiError(error?.message || 'Network error connecting to freight API', 0, null);
  }
}

/**
 * Typed HTTP methods object
 */
export const api = {
  get: <T = any>(path: string) => apiFetch<T>(path, { method: 'GET' }),
  post: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};

// ============================================================================
// Typed Maritime Domain API Endpoint Functions
// ============================================================================

/**
 * 1. Authentication Endpoints
 */
export async function verifyFirebaseToken(
  idToken: string,
  profile?: { name?: string; company?: string; role?: string; email?: string }
) {
  return api.post('/auth/verify-token', {
    id_token: idToken,
    ...(profile || {}),
  });
}

export async function getMyProfile() {
  return api.get('/auth/me');
}

/**
 * 2. Cargo Demand Management
 */
export interface CargoRequestCreate {
  cargo_type: string;
  cargo_quantity_mt: number;
  origin_country: string;
  destination_port: string;
  required_delivery_date?: string | null;
  loading_window_start?: string | null;
  loading_window_end?: string | null;
  discharge_window_start?: string | null;
  discharge_window_end?: string | null;
  preferred_vessel_type?: string | null;
  max_acceptable_freight?: number | null;
  number_of_voyages?: number;
  contract_duration?: string;
  priority?: string;
}

export async function createCargoRequest(data: CargoRequestCreate) {
  return api.post('/cargo', data);
}

export async function getCargoRequests() {
  return api.get('/cargo');
}

/**
 * 3. Vessel Intelligence & Recommendation
 */
export async function getVesselSpecs() {
  return api.get('/vessel/specs');
}

export async function recommendVessels(cargoRequestId: string, overrides?: any) {
  return api.post('/vessel/recommend', {
    cargo_request_id: cargoRequestId,
    simulator_overrides: overrides,
  });
}

/**
 * 4. Port Intelligence & Congestion
 */
export async function getPorts() {
  return api.get('/port');
}

export async function getPortSnapshot(portId: string) {
  return api.get(`/port/${portId}/snapshot`);
}

/**
 * 5. Voyage Planning & Simulation
 */
export interface VoyagePlanRequestPayload {
  cargo_request_id: string;
  simulator_overrides?: any;
  final_vessel_class?: string | null;
}

export async function generateVoyagePlan(data: VoyagePlanRequestPayload) {
  return api.post('/voyage/plan', data);
}

export async function getVoyagePlans() {
  return api.get('/voyage/plans');
}

export async function runSimulation(cargoRequestId: string, overrides: any) {
  return api.post('/simulator/run', {
    cargo_request_id: cargoRequestId,
    simulator_overrides: overrides,
  });
}

/**
 * 6. Freight Forecasting & Risk
 */
export async function generateForecast(cargoRequestId: string, horizonDays: number, overrides?: any) {
  return api.post('/forecast/generate', {
    cargo_request_id: cargoRequestId,
    horizon_days: horizonDays,
    simulator_overrides: overrides,
  });
}

export async function getRiskScore(cargoRequestId: string, overrides?: any) {
  return api.post('/risk/score', {
    cargo_request_id: cargoRequestId,
    simulator_overrides: overrides,
  });
}

/**
 * 7. Contract Advisory
 */
export async function compareContracts(cargoRequestId: string, overrides?: any) {
  return api.post('/contract/compare', {
    cargo_request_id: cargoRequestId,
    simulator_overrides: overrides,
  });
}

/**
 * 8. Operational Alerts
 */
export async function getAlerts() {
  return api.get('/alerts');
}

export async function dismissAlert(alertId: string) {
  return api.post(`/alerts/${alertId}/dismiss`);
}

/**
 * 9. Reports & Dossiers
 */
export async function generateReport(voyagePlanId: string, reportType: string = 'voyage_cost', title: string) {
  return api.post('/reports/generate', {
    voyage_plan_id: voyagePlanId,
    report_type: reportType,
    title,
  });
}

export async function getReports() {
  return api.get('/reports');
}

// ============================================================================
// State Persistence & Refresh Restoration Helpers
// ============================================================================

export function mapPriorityToBackend(priority?: string): string {
  if (!priority) return 'medium';
  const p = priority.toLowerCase();
  if (p.includes('cost')) return 'low';
  if (p.includes('fast') || p.includes('delivery')) return 'high';
  if (p.includes('risk')) return 'critical';
  if (p.includes('balanced')) return 'medium';
  if (['low', 'medium', 'high', 'critical'].includes(p)) return p;
  return 'medium';
}

export function mapBackendPriorityToFrontend(priority?: string): any {
  if (!priority) return 'Balanced';
  const p = priority.toLowerCase();
  if (p === 'low') return 'Lowest cost';
  if (p === 'high') return 'Fastest delivery';
  if (p === 'critical') return 'Lowest risk';
  return 'Balanced';
}

/**
 * Persist cargo request parcel to PostgreSQL database
 * Silently handles backend failure and returns null if unreachable
 */
export async function saveCargoRequest(data: any): Promise<any> {
  try {
    const payload: CargoRequestCreate = {
      cargo_type: data.cargoType || data.cargo_type || 'Coal',
      cargo_quantity_mt: Number(data.cargoQuantity ?? data.cargo_quantity_mt ?? 75000),
      origin_country: data.origin || data.origin_country || 'Indonesia',
      destination_port: data.destinationPort || data.destination_port || 'Paradip',
      required_delivery_date: data.requiredDeliveryDate || data.required_delivery_date || null,
      loading_window_start: data.loadingWindowStart || data.loading_window_start || null,
      loading_window_end: data.loadingWindowEnd || data.loading_window_end || null,
      discharge_window_start: data.dischargeWindowStart || data.discharge_window_start || null,
      discharge_window_end: data.dischargeWindowEnd || data.discharge_window_end || null,
      preferred_vessel_type:
        data.preferredVesselType && data.preferredVesselType !== 'Let AI decide'
          ? (data.preferredVesselType.charAt(0).toUpperCase() + data.preferredVesselType.slice(1).toLowerCase())
          : (data.preferred_vessel_type && data.preferred_vessel_type !== 'Let AI decide' ? data.preferred_vessel_type : null),
      max_acceptable_freight: data.maxAcceptableFreight ?? data.max_acceptable_freight ?? null,
      number_of_voyages: Number(data.numberOfVoyages ?? data.number_of_voyages ?? 1),
      contract_duration: data.contractDuration || data.contract_duration || 'Spot',
      priority: mapPriorityToBackend(data.priority),
    };

    const res = await createCargoRequest(payload);
    return res;
  } catch (err) {
    console.warn('[API] saveCargoRequest failed or backend unreachable, continuing with local state:', err);
    return null;
  }
}

/**
 * Fetch a specific cargo request by UUID from PostgreSQL
 */
export async function fetchCargoRequest(id: string): Promise<any> {
  try {
    const res = await api.get(`/cargo/${id}`);
    return res;
  } catch (err) {
    console.warn(`[API] fetchCargoRequest(${id}) failed or unreachable:`, err);
    return null;
  }
}

/**
 * Save an optimized voyage plan to PostgreSQL
 */
export async function saveVoyagePlan(data: VoyagePlanRequestPayload): Promise<any> {
  try {
    const res = await generateVoyagePlan(data);
    return res;
  } catch (err) {
    console.warn('[API] saveVoyagePlan failed or backend unreachable, continuing with local state:', err);
    return null;
  }
}

/**
 * Fetch latest saved voyage plan for the current user (first result from /voyage/plans)
 */
export async function fetchLatestVoyagePlan(): Promise<any> {
  try {
    const plans = await getVoyagePlans();
    if (Array.isArray(plans) && plans.length > 0) {
      return plans[0];
    }
    return null;
  } catch (err) {
    console.warn('[API] fetchLatestVoyagePlan failed or backend unreachable:', err);
    return null;
  }
}

/**
 * Fetch current authenticated user profile to validate session with backend
 * Throws on 401 Unauthorized so auth handlers can clear expired tokens
 */
export async function fetchUserProfile(): Promise<any> {
  try {
    const user = await getMyProfile();
    return user;
  } catch (err: any) {
    if (err?.status === 401) {
      throw err;
    }
    console.warn('[API] fetchUserProfile backend unreachable, falling back to cached user:', err);
    return null;
  }
}
