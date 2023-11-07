import {Filter} from '../../src/';

export class NoFetchFilter {
  private _sentRequest?: Request;
  private response: Response;

  public constructor(result: object = {}, responseInit?: ResponseInit) {
    if (responseInit?.status === 204) {
      this.response = new Response(null, responseInit);
      return;
    }
    this.response = Response.json(result, {
      status: 200,
      headers: {'content-type': 'application/prs.hal-forms+json'},
      ...responseInit,
    });
  }

  public get sentRequest(): Request {
    if (this._sentRequest === undefined) {
      throw new Error('No request has been made');
    }
    return this._sentRequest;
  }

  public get filter(): Filter {
    return params => {
      this._sentRequest = params.request;
      return Promise.resolve(this.response.clone());
    };
  }
}
