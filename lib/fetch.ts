// Types for progress event
interface UploadProgressEvent {
    loaded: number;
    total: number;
    lengthComputable: boolean;
    progress: number; // 0-1
    percentage: number; // 0-100
}

// Type for the onUploadProgress callback
export type OnUploadProgressCallback = (event: UploadProgressEvent) => void;

// Extend native RequestInit for our custom options
// We explicitly handle headers as Record<string, string> for XHR setRequestHeader simplicity.
// We also explicitly state that ReadableStream bodies are not supported.
type XhrBodyInit = Blob | BufferSource | FormData | URLSearchParams | string;

interface CustomFetchOptions extends Omit<RequestInit, 'headers' | 'body'> {
    headers?: Record<string, string>;
    body?: XhrBodyInit | null; // Exclude ReadableStream which XHR doesn't support
    onUploadProgress?: OnUploadProgressCallback;
    timeout?: number;
    responseType?: XMLHttpRequestResponseType; // For xhr.responseType
}

// Interface for our custom Response-like object
interface CustomResponse {
    ok: boolean;
    status: number;
    statusText: string;
    headers: Headers; // Use native Headers
    url: string;
    type: ResponseType; // Use native ResponseType
    redirected: boolean;
    bodyUsed: boolean; // Simplified, always false for this impl.

    text: () => Promise<string>;
    json: <T = any>() => Promise<T>; // Generic for JSON parsing
    blob: () => Promise<Blob>;
    arrayBuffer: () => Promise<ArrayBuffer>;
    // formData method is complex to implement correctly from general response and not included
}

// Custom Error with potential XHR response and status
interface HttpError extends Error {
    status?: number;
    response?: XMLHttpRequest; // For debugging or more detailed error info
}

/**
 * Custom fetch function with upload progress tracking, using XMLHttpRequest.
 *
 * @param url The URL to fetch.
 * @param options CustomFetchOptions, similar to native fetch options,
 *                plus `onUploadProgress`, `timeout`, and `responseType`.
 *                Note: `body` cannot be a `ReadableStream` for this XHR-based implementation.
 * @returns A Promise that resolves to a CustomResponse object.
 */
export function fetchWithUploadProgress(
    url: string,
    options: CustomFetchOptions = {}
): Promise<CustomResponse> {
    return new Promise<CustomResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        const method: string = (options.method || (options.body ? 'POST' : 'GET')).toUpperCase();
        const headers: Record<string, string> = options.headers || {};

        xhr.open(method, url, true);

        // Set request headers
        for (const headerName in headers) {
            if (Object.prototype.hasOwnProperty.call(headers, headerName)) {
                const headerValue = headers[headerName];
                // Don't set Content-Type if body is FormData; XHR does it automatically with boundary.
                if (headerName.toLowerCase() === 'content-type' && options.body instanceof FormData) {
                    continue;
                }
                xhr.setRequestHeader(headerName, headerValue!);
            }
        }

        // Upload progress
        if (options.onUploadProgress && xhr.upload) {
            xhr.upload.onprogress = (event: ProgressEvent) => { // event is of type ProgressEvent
                if (options.onUploadProgress) { // Re-check for type safety in callback
                    if (event.lengthComputable) {
                        const progress = event.loaded / event.total;
                        const percentage = Math.round(progress * 100);
                        options.onUploadProgress({
                            loaded: event.loaded,
                            total: event.total,
                            lengthComputable: true,
                            progress: progress,
                            percentage: percentage,
                        });
                    } else {
                        options.onUploadProgress({
                            loaded: event.loaded,
                            total: 0, // Total is unknown
                            lengthComputable: false,
                            progress: 0,
                            percentage: 0,
                        });
                    }
                }
            };
        }

        // Handle response
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const responseHeaders = new Headers();
                const headerString = xhr.getAllResponseHeaders();
                if (headerString) {
                    const H_REGEX = /^(.*?):[ \t]*([\s\S]*?)$/gm;
                    let match: RegExpExecArray | null;
                    while ((match = H_REGEX.exec(headerString))) {
                        responseHeaders.append(match[1]!, match[2]!);
                    }
                }

                const response: CustomResponse = {
                    ok: true,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    headers: responseHeaders,
                    url: xhr.responseURL || url, // xhr.responseURL might be empty if request fails very early
                    type: 'default', // Simplification, XHR doesn't map 1:1 to Fetch's ResponseType
                    redirected: xhr.responseURL !== url && xhr.responseURL !== '',
                    bodyUsed: false, // Simplified

                    text: () => Promise.resolve(xhr.responseText),
                    json: <T = any>(): Promise<T> => {
                        try {
                            return Promise.resolve(JSON.parse(xhr.responseText) as T);
                        } catch (e: any) {
                            return Promise.reject(new SyntaxError(`Failed to parse JSON: ${e.message}`));
                        }
                    },
                    blob: (): Promise<Blob> => {
                        if (xhr.responseType === 'blob' && xhr.response instanceof Blob) {
                            return Promise.resolve(xhr.response);
                        }
                        if (xhr.responseType === 'arraybuffer' && xhr.response instanceof ArrayBuffer) {
                            return Promise.resolve(new Blob([xhr.response]));
                        }
                        // For other types (text, json, default ""), create Blob from responseText.
                        return Promise.resolve(new Blob([xhr.responseText]));
                    },
                    arrayBuffer: (): Promise<ArrayBuffer> => {
                        if (xhr.responseType === 'arraybuffer' && xhr.response instanceof ArrayBuffer) {
                            return Promise.resolve(xhr.response);
                        }
                        if (xhr.responseType === 'blob' && xhr.response instanceof Blob) {
                            return (xhr.response as Blob).arrayBuffer(); // Blob.arrayBuffer() is async
                        }
                        // Otherwise, encode text response to ArrayBuffer.
                        const enc = new TextEncoder();
                        return Promise.resolve(enc.encode(xhr.responseText).buffer) as any;
                    },
                };
                resolve(response);
            } else {
                const error = new Error(
                    xhr.statusText || `Request failed with status ${xhr.status}`
                ) as HttpError;
                error.status = xhr.status;
                error.response = xhr;
                reject(error);
            }
        };

        // Handle network errors
        xhr.onerror = () => {
            const error = new Error('Network request failed') as HttpError;
            error.response = xhr;
            reject(error);
        };

        // Handle abort
        xhr.onabort = () => {
            const error = new Error('Request aborted') as HttpError;
            error.response = xhr;
            reject(error);
        };

        // Handle timeout
        if (options.timeout) {
            xhr.timeout = options.timeout;
            xhr.ontimeout = () => {
                const error = new Error('Request timed out') as HttpError;
                error.response = xhr;
                reject(error);
            };
        }

        // Set XHR's responseType if specified (e.g., for blob or arraybuffer)
        if (options.responseType) {
            xhr.responseType = options.responseType;
        }

        // Body: Note that ReadableStream is not supported by XHR.
        // CustomFetchOptions['body'] is typed as XhrBodyInit to reflect this.
        xhr.send(options.body || null);
    });
}