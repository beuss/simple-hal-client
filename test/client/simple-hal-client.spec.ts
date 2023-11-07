import {expect} from 'chai';
import {TestHalClient} from '../utils/test-hal-client';

describe('HAL client', () => {
  it('should return an empty document on 204', async () => {
    const client = new TestHalClient('https://hal-forms.test', undefined, {
      status: 204,
    });

    const response = await client.fetch();
    const halDocument = await response.hal();

    expect(halDocument.content).to.be.undefined;
    expect(halDocument.links()).to.be.undefined;
    expect(halDocument.embeddeds()).to.be.undefined;
  });

  it('should resolve relative URI with baseHref', async () => {
    const client = new TestHalClient('https://hal-forms.test/api/v1/');

    await client.fetch('customer');

    expect(client.sentRequest.url).to.be.eql(
      'https://hal-forms.test/api/v1/customer'
    );
  });

  it('should accept RequestInfo as fetch paramter', async () => {
    const client = new TestHalClient('https://hal-forms.test');
    const request = new Request('https://hal-forms.test/api/');

    await client.fetch(request);

    expect(client.sentRequest.url).to.be.eql('https://hal-forms.test/api/');
  });
});
