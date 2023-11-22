import {SimpleHalClient} from './simple-hal-client';

export type NextFilter = (request: Request) => Promise<Response>;

/**
 * Params passed to a filter when processing
 */
export type FilterParams = {
  /**
   * Client currently running the chain
   */
  client: SimpleHalClient;
  /**
   * Request being processed
   */
  request: Request;
  /**
   * Next filter in the chain, simply call params.next(request) to continue processing
   * (or don't call it)
   */
  next: NextFilter;
};

/**
 * Filter to be added to a chain in order to alter request or resposne
 */
export type Filter = (params: FilterParams) => Promise<Response>;

type FilterNode = {
  filter: Filter;
  next?: FilterNode;
};

/**
 * Filter chain run by HAL client
 */
export class DefaultFilterChain {
  private filters?: FilterNode;

  /**
   * Triggers the processing of this chain's filters
   * @param client Client asking for the chain to be run
   * @param request Request set up by the client to run through the chain
   * @returns The response (potentially altered) to the (potentially altered) request once
   * all filters have been run (or not, depending on filters behavior)
   */
  process(client: SimpleHalClient, request: Request): Promise<Response> {
    return this.doFilter(client, request, this.filters);
  }

  private doFilter(
    client: SimpleHalClient,
    request: Request,
    filter?: FilterNode
  ): Promise<Response> {
    /* istanbul ignore next */
    if (filter === undefined) {
      return fetch(request);
    }
    return filter.filter({
      client,
      request,
      next: (processedRequest: Request): Promise<Response> =>
        this.doFilter(client, processedRequest, filter.next),
    });
  }

  /**
   * Adds a filter at the end of the chain
   * @param filter Filter to add
   */
  public appendFilter(filter: Filter): void {
    if (this.filters === undefined) {
      this.filters = {filter};
      return;
    }
    let previousFilter = this.filters;
    while (previousFilter.next !== undefined) {
      previousFilter = previousFilter.next;
    }
    previousFilter.next = {filter};
  }

  /**
   * Inserts a filter at the begining of the chain
   * @param filter Filter to add
   */
  public prependFilter(filter: Filter): void {
    if (this.filters === undefined) {
      this.filters = {filter};
      return;
    }
    this.filters = {
      filter,
      next: this.filters,
    };
  }
}
