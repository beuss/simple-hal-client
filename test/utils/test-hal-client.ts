/* eslint-disable @typescript-eslint/no-explicit-any */
import {SimpleHalClient, HalResponse} from '../../src';
import {NoFetchFilter} from './no-fetch-filter';

export class TestHalClient extends SimpleHalClient {
  private readonly filter: NoFetchFilter;
  private filterAppended = false;

  public constructor(
    baseHref: string,
    halDocument?: any,
    responseInit?: ResponseInit
  ) {
    super(baseHref);
    this.filter = new NoFetchFilter(halDocument, responseInit);
  }

  fetch(
    input?: RequestInfo | undefined,
    init?: RequestInit
  ): Promise<HalResponse> {
    if (!this.filterAppended) {
      this.appendFilter(this.filter.filter);
      this.filterAppended = true;
    }
    return super.fetch(input, init);
  }

  public get sentRequest(): Request {
    return this.filter.sentRequest;
  }
}
