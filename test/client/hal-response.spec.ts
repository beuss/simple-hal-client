import {expect} from 'chai';
import {HalResponse} from '../../src';
import {TestHalClient} from '../utils/test-hal-client';

describe('HAL Response', () => {
  it('should correctly redirect all response methods and properties', async () => {
    let wrapped = Response.json({});
    let response = new HalResponse(
      wrapped,
      '/',
      new TestHalClient('https://simple-hal-client.test')
    );
    await response.arrayBuffer();
    expect(wrapped.bodyUsed).to.be.true;
    expect(response.bodyUsed).to.be.true;

    wrapped = Response.json({});
    response = new HalResponse(
      wrapped,
      '/',
      new TestHalClient('https://simple-hal-client.test')
    );
    await response.blob();
    expect(wrapped.bodyUsed).to.be.true;
    expect(response.bodyUsed).to.be.true;

    const formData: FormData = new FormData();
    formData.append('foo', 'bar');
    wrapped = new Response(formData);
    response = new HalResponse(
      wrapped,
      '/',
      new TestHalClient('https://simple-hal-client.test')
    );
    const responseFormData = await response.formData();
    expect(wrapped.bodyUsed).to.be.true;
    expect(response.bodyUsed).to.be.true;
    expect(responseFormData.get('foo')).to.eql('bar');

    wrapped = Response.json({});
    response = new HalResponse(
      wrapped,
      '/',
      new TestHalClient('https://simple-hal-client.test')
    );
    await response.hal();
    expect(wrapped.bodyUsed).to.be.true;
    expect(response.bodyUsed).to.be.true;

    wrapped = Response.json({});
    response = new HalResponse(
      wrapped,
      '/',
      new TestHalClient('https://simple-hal-client.test')
    );
    await response.json();
    expect(wrapped.bodyUsed).to.be.true;
    expect(response.bodyUsed).to.be.true;

    wrapped = Response.json({});
    response = new HalResponse(
      wrapped,
      '/',
      new TestHalClient('https://simple-hal-client.test')
    );
    await response.text();
    expect(wrapped.bodyUsed).to.be.true;
    expect(response.bodyUsed).to.be.true;

    wrapped = Response.json({});
    response = new HalResponse(
      wrapped,
      '/',
      new TestHalClient('https://simple-hal-client.test')
    );
    expect(response.body).to.eql(wrapped.body);
    expect(response.headers).to.eql(wrapped.headers);
    expect(response.ok).to.eql(wrapped.ok);
    expect(response.redirected).to.eql(wrapped.redirected);
    expect(response.status).to.eql(wrapped.status);
    expect(response.statusText).to.eql(wrapped.statusText);
    expect(response.type).to.eql(wrapped.type);
    expect(response.url).to.eql(wrapped.url);

    wrapped = Response.json({});
    response = new HalResponse(
      wrapped,
      '/',
      new TestHalClient('https://simple-hal-client.test')
    );
    const cloned = response.clone();
    await cloned.json();
    expect(wrapped.bodyUsed).to.be.false;
    expect(response.bodyUsed).to.be.false;
    expect(cloned.bodyUsed).to.be.true;
  });
});
