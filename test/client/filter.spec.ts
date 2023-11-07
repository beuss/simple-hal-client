import {expect} from 'chai';
import {TestHalClient} from '../utils/test-hal-client';

describe('Client filter chain', () => {
  it('should add default accept when no header', async () => {
    const client = new TestHalClient('https://hal-forms.test');

    await client.fetch();

    const sentRequest: Request = client.sentRequest;

    expect(sentRequest.headers.has('accept')).to.be.true;
    expect(sentRequest.headers.get('accept')).to.eql(
      'application/prs.hal-forms+json;q=1, application/hal+json;q=0.9'
    );
  });

  it('should add default accept header when other headers', async () => {
    const client = new TestHalClient('https://hal-forms.test');

    await client.fetch(undefined, {
      headers: {prefer: 'return=minimal'},
    });

    const request: Request = client.sentRequest;

    expect(request.headers.has('accept')).to.be.true;
    expect(request.headers.get('accept')).to.eql(
      'application/prs.hal-forms+json;q=1, application/hal+json;q=0.9'
    );
  });

  it('should not override existing accept header', async () => {
    const client = new TestHalClient('https://hal-forms.test');

    await client.fetch(undefined, {
      headers: {accept: 'text/html;q=1.0'},
    });

    const request: Request = client.sentRequest;

    expect(request.headers.has('accept')).to.be.true;
    expect(request.headers.get('accept')).to.eql('text/html;q=1.0');
  });

  it('should process all filters in the order they were added', async () => {
    const client = new TestHalClient('https://hal-forms.test');
    let filterIndex = 0;
    client.appendFilter(params => {
      expect(filterIndex).to.eql(0);
      ++filterIndex;
      return params.next(params.request);
    });
    client.appendFilter(params => {
      expect(filterIndex).to.eql(1);
      ++filterIndex;
      return params.next(params.request);
    });
    client.appendFilter(params => {
      expect(filterIndex).to.eql(2);
      ++filterIndex;
      return params.next(params.request);
    });

    await client.fetch();

    expect(filterIndex).to.eql(3);
  });

  it('should transmit altered request along the chain', async () => {
    const client = new TestHalClient('https://hal-forms.test');
    client.appendFilter(params => {
      params.request.headers.append('X-Filter-Processed', 'true');
      return params.next(params.request);
    });

    await client.fetch();

    expect(client.sentRequest.headers.get('X-Filter-Processed')).to.be.eql(
      'true'
    );
  });

  it('should correctly insert filter at the begining of the chain', async () => {
    const client = new TestHalClient('https://hal-forms.test');
    client.prependFilter(params => {
      params.request.headers.append('X-Filters', 'Prepend1');
      return params.next(params.request);
    });
    client.appendFilter(params => {
      params.request.headers.append('X-Filters', 'Append1');
      return params.next(params.request);
    });
    client.prependFilter(params => {
      params.request.headers.set('X-Filters', 'Prepend2');
      return params.next(params.request);
    });

    await client.fetch();

    expect(client.sentRequest.headers.get('X-Filters')).to.be.eql(
      'Prepend2, Prepend1, Append1'
    );
  });

  it('should return back altered response', async () => {
    const client = new TestHalClient('https://hal-forms.test');
    client.appendFilter(async params => {
      await params.next(params.request);
      return Response.json({filterResponse: true});
    });

    const response = await client.fetch();
    const json = await response.json();
    expect(json.filterResponse).to.be.true;
  });

  it('should allow to replay whole chain', async () => {
    const client = new TestHalClient('https://hal-forms.test');
    client.appendFilter(async params => {
      await params.next(params.request);
      return await params.next(params.request);
    });

    let callsCount = 0;
    client.appendFilter(params => {
      ++callsCount;
      return params.next(params.request);
    });

    await client.fetch();
    expect(callsCount).to.eql(2);
  });
});
