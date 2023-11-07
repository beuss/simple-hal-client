import {HalFormsResource} from '../hal/hal-forms-resource';
import {parseHal} from '../hal/hal-parser';
import {SimpleHalClient} from './simple-hal-client';

/**
 * Response subclass returned by SimpleHalClient#fetch. This can be used
 * as a standard response with an additional method #hal() that will try
 * to process the response as an HAL document. This allows seamless integration
 * with existing code base and keeping all standard feature of a response
 * (status check, other content types handling)
 */
export class HalResponse extends Response {
  constructor(
    source: Response,
    private readonly base: string,
    private readonly client: SimpleHalClient
  ) {
    super(source.body, {
      headers: source.headers,
      status: source.status,
      statusText: source.statusText,
    });
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
      });
    }

    const json = await this.json();
    return parseHal(this.base, json, this.client) as HalFormsResource<T>;
  }
}
