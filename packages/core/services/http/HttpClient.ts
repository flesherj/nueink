/**
 * HTTP Client Interface
 *
 * Abstraction over HTTP clients (axios, fetch, etc.) to enable:
 * - Dependency injection for testability
 * - Easy mocking in unit tests
 * - Swappable implementations if needed
 */

export interface HttpRequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface HttpClient {
  /**
   * Perform HTTP POST request
   *
   * @param url - The URL to post to
   * @param data - The request body (any format)
   * @param config - Optional request configuration
   * @returns Response with parsed data
   * @throws Error if request fails (non-2xx status)
   */
  post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>;

  /**
   * Perform HTTP GET request
   *
   * @param url - The URL to fetch
   * @param config - Optional request configuration
   * @returns Response with parsed data
   * @throws Error if request fails (non-2xx status)
   */
  get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
}
