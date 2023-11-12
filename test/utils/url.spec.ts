import {expect} from 'chai';
import {absolutize} from '../../src/utils/url';

describe('Absolute URL generation utility', () => {
  it('should correctly handle absolute base and relative URL', () => {
    let absolutized = absolutize(
      '/test',
      'https://simple-hal-client.test/hello/'
    );
    expect(absolutized).to.eql('https://simple-hal-client.test/test');
    absolutized = absolutize('test', 'https://simple-hal-client.test/hello/');
    expect(absolutized).to.eql('https://simple-hal-client.test/hello/test');
    absolutized = absolutize('test', 'https://simple-hal-client.test/hello');
    expect(absolutized).to.eql('https://simple-hal-client.test/test');
  });
  it('should correctly handle absolute base and absolute URL', () => {
    const absolutized = absolutize(
      'https://subdomain.simple-hal-client.test/test',
      'https://simple-hal-client.test/hello/'
    );
    expect(absolutized).to.eql('https://subdomain.simple-hal-client.test/test');
  });
  it('should correctly handle relative base and relative URL', () => {
    let absolutized = absolutize('/test', '/hello/');
    expect(absolutized).to.eql('/test');
    absolutized = absolutize('/test', '/hello');
    expect(absolutized).to.eql('/test');
    absolutized = absolutize('test', '/hello/');
    expect(absolutized).to.eql('/hello/test');
    absolutized = absolutize('test', '/hello');
    expect(absolutized).to.eql('/test');
  });
  it('should correctly handle undefined based and relative URL', () => {
    let absolutized = absolutize('/test', undefined);
    expect(absolutized).to.eql('/test');
    absolutized = absolutize('test', undefined);
    expect(absolutized).to.eql('/test');
    absolutized = absolutize('test/hello', undefined);
    expect(absolutized).to.eql('/test/hello');
    absolutized = absolutize('/test/hello', undefined);
    expect(absolutized).to.eql('/test/hello');
  });
});
