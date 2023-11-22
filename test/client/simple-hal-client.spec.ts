import {expect} from 'chai';
import {TestHalClient} from '../utils/test-hal-client';

describe('HAL client', () => {
  it('should resolve relative URI with baseHref', async () => {
    const client = new TestHalClient('https://hal-forms.test/api/v1/');

    await client.fetch('customer');

    expect(client.sentRequest.url).to.be.eql(
      'https://hal-forms.test/api/v1/customer'
    );
  });

  it('should accept RequestInfo as fetch parameter', async () => {
    const client = new TestHalClient('https://hal-forms.test');
    const request = new Request('https://hal-forms.test/api/');

    await client.fetch(request);

    expect(client.sentRequest.url).to.be.eql('https://hal-forms.test/api/');
  });

  it('should correctly handle null body statuses', async () => {
    const statuses = [
      // There're also 101 & 103 but Response constructor expects
      // status to be [200;599]
      {status: 204, statusText: 'No content'},
      {status: 205, statusText: 'Reset content'},
      {status: 304, statusText: 'Not modified'},
    ];

    for (const {status, statusText} of statuses) {
      const client = new TestHalClient('https://hal-forms.test');
      client.appendFilter(
        async () => new NoContentResponse(status, statusText)
      );
      await client.fetch();
    }

    expect(true).to.be.true;
  });

  it('should allow to directly fetch HAL', async () => {
    const client = new TestHalClient('https://hal-forms.test/', {
      _links: {self: {href: '/customer/421'}},
    });

    const customer = await client.fetchHal('/customer/421');
    expect(customer.link('self')?.href).to.eql('/customer/421');
  });
});

class NoContentResponse implements Response {
  // In chromium (at least), body for e.g. 204 is a ReadableStream,
  // causing an error if HalResponse attemps to create a custom
  // Response with this code.
  public readonly body = new ReadableStream();
  public readonly headers = new Headers();
  public readonly ok = true;
  public readonly redirected = false;
  public readonly type: ResponseType = 'basic';
  public readonly url = 'https://hal-forms.test';
  public bodyUsed = false;

  constructor(
    public readonly status: number,
    public readonly statusText: string
  ) {}
  clone(): Response {
    throw new Error('Not supported');
  }
  arrayBuffer() {
    return Promise.reject(new Error('Not supported'));
  }
  formData() {
    return Promise.reject(new Error('Not supported'));
  }
  blob() {
    return Promise.reject(new Error('Not supported'));
  }
  json() {
    return Promise.reject(new Error('Not supported'));
  }
  text() {
    return Promise.reject(new Error('Not supported'));
  }
}
