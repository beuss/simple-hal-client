import {HalFormsResource} from '../hal/hal-forms-resource';
import {parseHal} from '../hal/hal-parser';
import {SimpleHalClient} from './simple-hal-client';

/**
 * Response implementation returned by SimpleHalClient#fetch. This can be used
 * as a standard response with an additional method #hal() that will try
 * to process the response as an HAL document. This allows seamless integration
 * with existing code base and keeping all standard feature of a response
 * (status check, other content types handling)
 */
export class HalResponse implements Response {
  constructor(
    private readonly wrapped: Response,
    private readonly base: string,
    private readonly client: SimpleHalClient
  ) {}

  get body(): ReadableStream<Uint8Array> | null {
    return this.wrapped.body;
  }

  get bodyUsed(): boolean {
    return this.wrapped.bodyUsed;
  }

  get headers(): Headers {
    return this.wrapped.headers;
  }

  get ok(): boolean {
    return this.wrapped.ok;
  }

  get redirected(): boolean {
    return this.wrapped.redirected;
  }

  get status(): number {
    return this.wrapped.status;
  }

  get statusText(): string {
    return this.wrapped.statusText;
  }

  get type(): ResponseType {
    return this.wrapped.type;
  }

  get url(): string {
    return this.wrapped.url;
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return this.wrapped.arrayBuffer();
  }

  blob(): Promise<Blob> {
    return this.wrapped.blob();
  }

  clone(): Response {
    return new HalResponse(this.wrapped.clone(), this.base, this.client);
  }

  formData(): Promise<FormData> {
    return this.wrapped.formData();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json(): Promise<any> {
    return this.wrapped.json();
  }

  text(): Promise<string> {
    return this.wrapped.text();
  }

  /**
   * Attempts to process this response as an HAL-FORMS document and returns it
   * @returns The processed document. In case of a "no content" answer, this will
   * be an empty HalFormsResource
   * @throws Error if the response is not a valid JSON document
   */
  public async hal<T>(): Promise<HalFormsResource<T>> {
    if (this.status === 204) {
      return new HalFormsResource<T>({
        rel: 'self',
        embedded: {},
        links: {},
        templates: {},
      });
    }

    const json = await this.json();
    return parseHal(this.base, json, this.client) as HalFormsResource<T>;
  }
}
