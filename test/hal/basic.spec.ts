/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {HalFormsResource} from '../../src/';
import {TestHalClient} from '../utils/test-hal-client';

const ordersExample = {
  _links: {
    self: {href: '/orders'},
    curies: [
      {
        name: 'ea',
        href: 'http://example.com/docs/rels/{rel}',
        templated: true,
      },
    ],
    next: {href: '/orders?page=2'},
    'ea:find': {
      href: '/orders{?id}',
      templated: 'true',
    },
    'ea:admin': [
      {
        href: '/admins/2',
        title: 'Fred',
      },
      {
        href: '/admins/5',
        title: 'Kate',
      },
    ],
  },
  currentlyProcessing: 14,
  shippedToday: 20,
  _embedded: {
    'ea:order': [
      {
        _links: {
          self: {href: '/orders/123'},
          'ea:basket': {href: '/baskets/98712'},
          'ea:customer': {href: '/customers/7809'},
        },
        total: 30.0,
        currency: 'USD',
        status: 'shipped',
      },
      {
        _links: {
          self: {href: '/orders/124'},
          'ea:basket': {href: '/baskets/97213'},
          'ea:customer': {href: '/customers/12369'},
        },
        total: 20.0,
        currency: 'USD',
        status: 'processing',
      },
    ],
  },
};

describe('HAL response processing using specification example', () => {
  it('should correctly parse content', async () => {
    const client = new TestHalClient('http://hal.test/', ordersExample);

    const response = await client.fetch();

    const halDocument: HalFormsResource<any> = await response.hal();
    expect(halDocument.content.currentlyProcessing).to.eql(14);
    expect(halDocument.content.shippedToday).to.eql(20);
    expect(halDocument.content._embedded).to.be.undefined;
    expect(halDocument.content._links).to.be.undefined;
  });

  it('should correctly parse links', async () => {
    const client = new TestHalClient('http://hal.test/', ordersExample);

    const response = await client.fetch();

    const halDocument: HalFormsResource<any> = await response.hal();

    expect(halDocument.link('self')?.href).to.eql('/orders');
    expect(halDocument.selfHref()).to.eql('http://hal.test/orders');
    await halDocument.link('self')?.follow();
    expect(client.sentRequest.url).to.eql('http://hal.test/orders');

    const curies = halDocument.links('curies');
    expect(curies).to.have.lengthOf(1);
    expect(curies?.[0].href).to.eql('http://example.com/docs/rels/{rel}');
    expect(curies?.[0].name).to.eql('ea');
    expect(curies?.[0].templated).to.be.true;
    await curies?.[0].follow({rel: 'find'});
    expect(client.sentRequest.url).to.eql('http://example.com/docs/rels/find');
    await curies?.[0].follow();
    expect(client.sentRequest.url).to.eql('http://example.com/docs/rels/');

    expect(halDocument.link('next')?.href).to.eql('/orders?page=2');

    expect(halDocument.link('ea:find')?.href).to.eql('/orders{?id}');
    expect(halDocument.link('ea:find')?.templated).to.be.true;
    await halDocument.link('ea:find')?.follow({id: '1234'});
    expect(client.sentRequest.url).to.eql('http://hal.test/orders?id=1234');

    const admins = halDocument.links('ea:admin');
    expect(admins).to.have.lengthOf(2);
    expect(admins?.[0].href).to.eql('/admins/2');
    expect(admins?.[0].title).to.eql('Fred');
    expect(admins?.[1].href).to.eql('/admins/5');
    expect(admins?.[1].title).to.eql('Kate');

    expect(() => halDocument.link('ea:admin')).to.throw();
    expect(() => halDocument.links('next')).to.throw();
  });

  it('should correctly parse embedded objects', async () => {
    const client = new TestHalClient('http://hal.test/', ordersExample);

    const response = await client.fetch();

    const halDocument: HalFormsResource<any> = await response.hal();

    expect(halDocument.embeddeds()).has.lengthOf(2);
    expect(halDocument.embeddeds('ea:order')).has.lengthOf(2);
    const orders: HalFormsResource<any>[] = halDocument.embeddeds('ea:order')!;

    expect(orders[0].content.total).to.eql(30.0);
    expect(orders[0].content.currency).to.eql('USD');
    expect(orders[0].content.status).to.eql('shipped');
    expect(orders[0].links()).has.lengthOf(3);
    expect(orders[0].link('self')?.href).to.eql('/orders/123');
    expect(orders[0].selfHref()).to.eql('http://hal.test/orders/123');
    expect(orders[0].link('ea:basket')?.href).to.eql('/baskets/98712');
    expect(orders[0].link('ea:customer')?.href).to.eql('/customers/7809');

    expect(orders[1].content.total).to.eql(20.0);
    expect(orders[1].content.currency).to.eql('USD');
    expect(orders[1].content.status).to.eql('processing');
    expect(orders[1].links()).has.lengthOf(3);
    expect(orders[1].link('self')?.href).to.eql('/orders/124');
    expect(orders[1].selfHref()).to.eql('http://hal.test/orders/124');
    expect(orders[1].link('ea:basket')?.href).to.eql('/baskets/97213');
    expect(orders[1].link('ea:customer')?.href).to.eql('/customers/12369');

    expect(() => halDocument.embedded('ea:order')).to.throw();
  });
});
