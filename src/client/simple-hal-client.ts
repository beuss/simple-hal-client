import {HalFormsResource} from '../hal/hal-forms-resource';
import {absolutize} from '../utils/url';
import {Filter, DefaultFilterChain} from './filter';
import {HalResponse} from './hal-response';

/**
 * Main class of the library, allows to perform request against an
 * HAL-FORMS capable backend. The client supports a filter system
 * for e.g. credentials handling or other special cases.
 */
export class SimpleHalClient {
  private static readonly ACCEPTED_CONTENT_TYPES = [
    'application/prs.hal-forms+json',
    'application/hal+json',
  ];
  protected filterChain = new DefaultFilterChain();

  /**
   * Creates a new HAL-FORMS client
   * @param baseHref Base URL of subsequent queries, used to absolutize
   * URL when non canonical ones are used.
   */
  constructor(private readonly baseHref: string) {}

  /**
   * Adds a filter at the end of the filter chain (will be processed
   * after currently registered filters).
   * @param filter Filter to add
   */
  appendFilter(filter: Filter) {
    this.filterChain.appendFilter(filter);
  }

  /**
   * Inserts a filter at the begining of the filter chain (will be
   * processed before currently registered filters)
   * @param filter Filter to add
   */
  prependFilter(filter: Filter) {
    this.filterChain.prependFilter(filter);
  }

  /**
   * Fetches a resource from a remote backend, works almost exactly
   * the same as fetch()
   * @param input Target URL to fetch, will be absolutized using baseHref
   * provided during construction. If omitted, baseHref will be fetched
   * @param init Additional parameters for the request
   * @returns A promise that will be resolved when remote end answers (or not).
   * @see fetch()
   */
  async fetch(
    input?: RequestInfo,
    init: RequestInit = {}
  ): Promise<HalResponse> {
    if (input === undefined) {
      input = this.baseHref;
    } else if (typeof input === 'string') {
      input = absolutize(input, this.baseHref);
    }

    const request: Request = new Request(input, init);
    if (request.headers.has('accept') === false) {
      request.headers.set('accept', this.buildAcceptHeader());
    }

    const response: Response = await this.filterChain.process(this, request);

    return new HalResponse(response, request.url, this);
  }

  /**
   * Shortcut to fetch a resource that we know is an HAL-FORMS document.
   * Avoids multiple awaits in caller when an HALResponse is expected for
   * the supplied URL
   * @param input Target URL to fetch, will be absolutized using baseHref
   * provided during construction. If omitted, baseHref will be fetched
   * @param init Additional parameters for the request
   * @returns A promise that will be resolved when remote end answers (or not)
   * and HAL parsing succeeds
   * @see SimpleHalClient.fetch
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fetchHal<T = any>(
    input?: RequestInfo,
    init: RequestInit = {}
  ): Promise<HalFormsResource<T>> {
    const response = await this.fetch(input, init);
    return response.hal();
  }

  private buildAcceptHeader() {
    let pref = 1.0;
    return SimpleHalClient.ACCEPTED_CONTENT_TYPES.map(ct => {
      const part = `${ct};q=${pref}`;
      pref -= 0.1;
      return part;
    }).join(', ');
  }
}
