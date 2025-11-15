/**
 * Axios implementation of HttpClient interface
 *
 * Wraps axios to conform to our HttpClient interface.
 * This allows easy swapping of HTTP implementations and better testability.
 */

import axios, { AxiosInstance } from 'axios';
import type { HttpClient, HttpRequestConfig, HttpResponse } from './HttpClient';

export class AxiosHttpClient implements HttpClient {
  private axiosInstance: AxiosInstance;

  constructor(axiosInstance?: AxiosInstance) {
    this.axiosInstance = axiosInstance || axios.create();
  }

  public post = async <T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> => {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  };

  public get = async <T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> => {
    const response = await this.axiosInstance.get<T>(url, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  };
}
