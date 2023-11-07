/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {HalFormsResource, HalLink, HalResponse} from '../../src/';
import {TestHalClient} from '../utils/test-hal-client';
import sinon = require('sinon');
import {afterEach} from 'mocha';

describe('HAL forms link processing', () => {
  it("shouldn't fail on empty _links", async () => {
    const client = new TestHalClient('https://hal-links.test', {foo: 'bar'});
    const response: HalResponse = await client.fetch();
    const halDocument: HalFormsResource<any> = await response.hal();
    expect(halDocument.links()).to.be.undefined;
    expect(halDocument.content.foo).to.eql('bar');
  });

  it('should follow using custom client', async () => {
    const mainClient = new TestHalClient('https://hal-links.test', {
      _links: {self: {href: '/test'}},
    });
    const response: HalResponse = await mainClient.fetch();
    const halDocument: HalFormsResource<any> = await response.hal();
    const link = halDocument.link('self') as HalLink;
    const secondaryClient = new TestHalClient(
      'https://another.hal-links.test/'
    );
    link.follow(undefined, secondaryClient);
    expect(secondaryClient.sentRequest.url).to.be.eql(
      'https://hal-links.test/test'
    );
  });

  it('should parse various first-level links', async () => {
    const client = new TestHalClient('https://hal-links.test', {
      _links: {
        self: {
          href: '/podcast/712',
          type: 'application/prs.hal-forms+json',
          name: 'self-link',
          profile: 'https://www.apple.com/itunes/podcasts/specs.html',
          title: 'This is the resource you asked for',
          hreflang: 'en-US',
        },
        'v1:artist': {
          href: '/artist/324',
          templated: 'invalid',
          type: 'application/prs.hal-forms+json',
          deprecation: 'https://hal-links.test/deprecation/v1-artist',
          title: 'Wonderful artist',
        },
        search: {
          href: '/podcast{?title;keyword*}',
          templated: true,
          type: 'application/prs.hal-forms+json',
        },
        songs: [
          {
            href: '/podcast/song/3189',
            type: 'application/prs.hal-forms+json',
            title: 'One of her best songs',
          },
          {
            href: '/podcast/song/3498',
            type: 'application/prs.hal-forms+json',
            title: 'Another of her best songs',
          },
        ],
      },
    });
    const response = await client.fetch();

    const halDocument: HalFormsResource<any> = await response.hal();

    expect(halDocument.links()).has.a.lengthOf(5);

    let link = halDocument.link('self') as HalLink;
    expect(link.rel).to.eql('self');
    expect(link.href).to.eql('/podcast/712');
    expect(link.type).to.eql('application/prs.hal-forms+json');
    expect(link.name).to.eql('self-link');
    expect(link.profile).to.eql(
      'https://www.apple.com/itunes/podcasts/specs.html'
    );
    expect(link.title).to.eql('This is the resource you asked for');
    expect(link.hreflang).to.eql('en-US');

    link = halDocument.link('v1:artist') as HalLink;
    expect(link.rel).to.eql('v1:artist');
    expect(link.href).to.eql('/artist/324');
    expect(link.templated).to.eql(false);
    expect(link.type).to.eql('application/prs.hal-forms+json');
    expect(link.deprecation).to.eql(
      'https://hal-links.test/deprecation/v1-artist'
    );
    expect(link.title).to.eql('Wonderful artist');

    link = halDocument.link('search') as HalLink;
    expect(link.rel).to.eql('search');
    expect(link.href).to.eql('/podcast{?title;keyword*}');
    expect(link.templated).to.eql(true);
    expect(link.type).to.eql('application/prs.hal-forms+json');

    const links = halDocument.links('songs') as HalLink[];

    expect(links[0].rel).to.eql('songs');
    expect(links[0].href).to.eql('/podcast/song/3189');
    expect(links[0].type).to.eql('application/prs.hal-forms+json');
    expect(links[0].title).to.eql('One of her best songs');
    expect(links[1].rel).to.eql('songs');
    expect(links[1].href).to.eql('/podcast/song/3498');
    expect(links[1].type).to.eql('application/prs.hal-forms+json');
    expect(links[1].title).to.eql('Another of her best songs');
  });

  it('should not consider links without href', async () => {
    const client = new TestHalClient('https://hal-links.test', {
      _links: {
        self: {
          href: '/podcast/712',
          type: 'application/prs.hal-forms+json',
          name: 'self-link',
          profile: 'https://www.apple.com/itunes/podcasts/specs.html',
          title: 'This is the resource you asked for',
          hreflang: 'en-US',
        },
        'no-href': {
          type: 'application/prs.hal-forms+json',
          title: 'Forgot something',
        },
      },
    });

    const response = await client.fetch();

    const halDocument: HalFormsResource<any> = await response.hal();
    expect(halDocument.links()).to.have.a.lengthOf(1);
    expect(halDocument.link('self')).not.to.be.undefined;
    expect(halDocument.link('no-href')).to.be.undefined;
  });

  it('should use nearest parent for relative links', async () => {
    const client = new TestHalClient('https://hal-links.test', {
      _links: {
        self: {
          href: '/first/712',
        },
      },
      _embedded: {
        e1: {
          _links: {
            self: {href: 'e1/12'},
            other: {href: 'other/42'}, // should be resolved relative to self
          },
        },
        e2: {
          _links: {
            self: {href: 'https://elsewhere.test/e2/41'},
          },
          _embedded: {
            e3: {
              _links: {
                self: {href: 'e3/321'},
              },
            },
            e4: {
              _links: {
                self: {href: '/e4/4289'},
              },
            },
          },
        },
      },
    });

    const response = await client.fetch();

    const halDocument: HalFormsResource<any> = await response.hal();

    await halDocument.link('self')?.follow();
    expect(client.sentRequest.url).to.eql('https://hal-links.test/first/712');

    const e1 = halDocument.embedded('e1');
    await e1?.link('self')?.follow();
    expect(client.sentRequest.url).to.eql('https://hal-links.test/first/e1/12');
    await e1?.link('other')?.follow();
    expect(client.sentRequest.url).to.eql(
      'https://hal-links.test/first/e1/other/42'
    );

    const e2 = halDocument.embedded('e2');
    await e2?.link('self')?.follow();
    expect(client.sentRequest.url).to.eql('https://elsewhere.test/e2/41');

    const e3 = e2?.embedded('e3');
    await e3?.link('self')?.follow();
    expect(client.sentRequest.url).to.eql('https://elsewhere.test/e2/e3/321');

    const e4 = e2?.embedded('e4');
    await e4?.link('self')?.follow();
    expect(client.sentRequest.url).to.eql('https://elsewhere.test/e4/4289');
  });

  it('should allow use name as a secondary key to find link(s)', async () => {
    const client = new TestHalClient('https://hal-links.test', {
      _links: {
        'family:members': [
          {
            href: '/person/320',
            name: 'father',
          },
          {
            href: '/person/429',
            name: 'mother',
          },
          {
            href: '/person/914',
            name: 'daughter',
          },
          {
            href: '/person/1592',
            name: 'daughter',
          },
        ],
      },
    });
    const response = await client.fetch();

    const halDocument: HalFormsResource<any> = await response.hal();

    expect(halDocument.link('family:members', 'father')?.href).to.eql(
      '/person/320'
    );
    expect(halDocument.link('family:members', 'mother')?.href).to.eql(
      '/person/429'
    );
    expect(() => halDocument.link('family:members', 'daughter')).to.throw();
    expect(halDocument.links('family:members', 'daughter')).to.have.a.lengthOf(
      2
    );
  });

  it('should return undefined when no name match exists', async () => {
    const client = new TestHalClient('https://hal-links.test', {
      _links: {
        'family:members': [
          {
            href: '/person/320',
            name: 'father',
          },
          {
            href: '/person/429',
            name: 'mother',
          },
        ],
        'family:address': {
          href: '/address/4305',
          name: 'home',
        },
      },
    });

    const response = await client.fetch();

    const halDocument: HalFormsResource<any> = await response.hal();

    expect(halDocument.link('family:members', 'daughter')).to.be.undefined;
    expect(halDocument.links('family:members', 'daughter')).to.be.undefined;
    expect(halDocument.link('family:address', 'flat')).to.be.undefined;
  });

  it('should return undefined when no link with the given relationship exists', async () => {
    const client = new TestHalClient('https://hal-links.test', {
      _links: {
        'family:members': [
          {
            href: '/person/320',
            name: 'father',
          },
          {
            href: '/person/429',
            name: 'mother',
          },
        ],
      },
    });

    const response = await client.fetch();

    const halDocument: HalFormsResource<any> = await response.hal();

    expect(halDocument.link('family:assets')).to.be.undefined;
    expect(halDocument.links('family:assets')).to.be.undefined;
  });

  it('should log a warning when following a deprecated link', async () => {
    const consoleStub = sinon.stub(console, 'warn');
    const client = new TestHalClient('https://hal-links.test', {
      _links: {
        self: {
          href: '/podcast/712',
        },
        'v1:artist': {
          href: '/artist/324',
          deprecation: 'https://hal-links.test/deprecation/v1-artist',
        },
      },
    });

    const response = await client.fetch();

    const halDocument: HalFormsResource<any> = await response.hal();

    halDocument.link('v1:artist')?.follow();
    expect(consoleStub.calledOnce).to.be.true;
    expect(consoleStub.firstCall.firstArg).to.have.string('v1:artist');
  });
});

afterEach(() => {
  sinon.restore();
});
