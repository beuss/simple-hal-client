/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {HalResponse, HalFormsResource} from '../../src/';
import {TestHalClient} from '../utils/test-hal-client';

describe('HAL forms embedded processing', () => {
  it('should not fail on empty _embedded', async () => {
    const client = new TestHalClient('https://hal-links.test', {foo: 'bar'});
    const response: HalResponse = await client.fetch();
    const halDocument: HalFormsResource<any> = await response.hal();
    expect(halDocument.embeddeds()).to.be.undefined;
    expect(halDocument.content.foo).to.eql('bar');
  });

  it('should return undefined when no embedded with the given relationship exists', async () => {
    const client = new TestHalClient('https://hal-links.test', {
      _embedded: {
        foo: {_links: {self: {href: '/foo'}}, bar: 'baz'},
      },
    });
    const response: HalResponse = await client.fetch();
    const halDocument: HalFormsResource<any> = await response.hal();
    expect(halDocument.embedded('qux')).to.be.undefined;
    expect(halDocument.embeddeds('qux')).to.be.undefined;
  });

  it('should correctly parse first level _embedded', async () => {
    const client = new TestHalClient('https://hal-links.test', {
      _embedded: {
        baz: {_links: {self: {href: '/baz'}}, qux: 'quux'},
        corge: {_links: {self: {href: '/corge'}}, grault: 'garply'},
        waldo: [
          {_links: {self: {href: '/waldo1'}}, fred: 'plugh'},
          {_links: {self: {href: '/waldo2'}}, xyzzy: 'thud'},
        ],
      },
      foo: 'bar',
    });
    const response: HalResponse = await client.fetch();
    const halDocument: HalFormsResource<any> = await response.hal();

    expect(halDocument.embeddeds()).to.have.lengthOf(4);
    let embedded: HalFormsResource<any> = halDocument.embedded(
      'baz'
    ) as HalFormsResource<any>;
    expect(embedded.rel).to.eql('baz');
    expect(embedded.content.qux).to.eql('quux');
    expect(embedded.link('self')?.href).to.eql('/baz');
    expect(() => halDocument.embeddeds('baz')).to.throw();

    embedded = halDocument.embedded('corge') as HalFormsResource<any>;
    expect(embedded.rel).to.eql('corge');
    expect(embedded.content.grault).to.eql('garply');
    expect(embedded.link('self')?.href).to.eql('/corge');
    expect(() => halDocument.embeddeds('corge')).to.throw();

    const embeddeds = halDocument.embeddeds('waldo') as HalFormsResource<any>[];
    expect(embeddeds).to.have.a.lengthOf(2);
    embedded = embeddeds[0];
    expect(embedded.rel).to.eql('waldo');
    expect(embedded.content.fred).to.eql('plugh');
    expect(embedded.link('self')?.href).to.eql('/waldo1');
    embedded = embeddeds[1];
    expect(embedded.rel).to.eql('waldo');
    expect(embedded.content.xyzzy).to.eql('thud');
    expect(embedded.link('self')?.href).to.eql('/waldo2');
    expect(() => halDocument.embedded('waldo')).to.throw();
  });

  it('should correctly parse nested _embedded', async () => {
    const client = new TestHalClient('https://hal-links.test', {
      _embedded: {
        level_0_0: {
          prop: 'level0_0',
          _links: {self: {href: '/level0_0'}},
          _embedded: {
            level_1_0: {
              prop: 'level1_0',
              _links: {self: {href: '/level1_0'}},
            },
            level_1_1: [
              {
                prop: 'level1_1_0',
                _links: {self: {href: '/level1_1_0'}},
                _embedded: {
                  level_2_0: {
                    prop: 'level2_0',
                    _links: {self: {href: '/level2_0'}},
                  },
                  level_2_1: [
                    {
                      prop: 'level2_1_0',
                      _links: {self: {href: '/level2_1_0'}},
                    },
                    {
                      prop: 'level2_1_1',
                      _links: {self: {href: '/level2_1_1'}},
                    },
                  ],
                },
              },
              {
                prop: 'level1_1_1',
                _links: {self: {href: '/level1_1_1'}},
              },
            ],
          },
        },
        level_0_1: [
          {
            prop: 'level0_1_0',
            _links: {self: {href: '/level0_1_0'}},
          },
          {
            prop: 'level0_1_1',
            _links: {self: {href: '/level0_1_1'}},
          },
        ],
      },
      foo: 'bar',
    });
    const response: HalResponse = await client.fetch();
    const halDocument: HalFormsResource<any> = await response.hal();

    const level_0_0: HalFormsResource<any> = halDocument.embedded(
      'level_0_0'
    ) as HalFormsResource<any>;
    expect(level_0_0.content.prop).to.eql('level0_0');
    expect(level_0_0.link('self')?.href).to.eql('/level0_0');

    const level_1_0: HalFormsResource<any> = level_0_0.embedded(
      'level_1_0'
    ) as HalFormsResource<any>;
    expect(level_1_0.content.prop).to.eql('level1_0');
    expect(level_1_0.link('self')?.href).to.eql('/level1_0');

    const level_1_1: HalFormsResource<any>[] = level_0_0.embeddeds(
      'level_1_1'
    ) as HalFormsResource<any>[];
    expect(level_1_1).to.have.a.lengthOf(2);
    const level_1_1_0: HalFormsResource<any> = level_1_1[0];
    expect(level_1_1_0.content.prop).to.eql('level1_1_0');
    expect(level_1_1_0.link('self')?.href).to.eql('/level1_1_0');

    const level_2_0: HalFormsResource<any> = level_1_1_0.embedded(
      'level_2_0'
    ) as HalFormsResource<any>;
    expect(level_2_0.content.prop).to.eql('level2_0');
    expect(level_2_0.link('self')?.href).to.eql('/level2_0');

    const level_2_1: HalFormsResource<any>[] = level_1_1_0.embeddeds(
      'level_2_1'
    ) as HalFormsResource<any>[];
    expect(level_2_1).to.have.a.lengthOf(2);

    const level_2_1_0: HalFormsResource<any> = level_2_1[0];
    expect(level_2_1_0.content.prop).to.eql('level2_1_0');
    expect(level_2_1_0.link('self')?.href).to.eql('/level2_1_0');

    const level_2_1_1: HalFormsResource<any> = level_2_1[1];
    expect(level_2_1_1.content.prop).to.eql('level2_1_1');
    expect(level_2_1_1.link('self')?.href).to.eql('/level2_1_1');

    const level_1_1_1: HalFormsResource<any> = level_1_1[1];
    expect(level_1_1_1.content.prop).to.eql('level1_1_1');
    expect(level_1_1_1.link('self')?.href).to.eql('/level1_1_1');

    const level_0_1: HalFormsResource<any>[] = halDocument.embeddeds(
      'level_0_1'
    ) as HalFormsResource<any>[];
    expect(level_0_1).to.have.a.lengthOf(2);
    const level_0_1_0 = level_0_1[0];
    expect(level_0_1_0.content.prop).to.eql('level0_1_0');
    expect(level_0_1_0.link('self')?.href).to.eql('/level0_1_0');
    const level_0_1_1 = level_0_1[1];
    expect(level_0_1_1.content.prop).to.eql('level0_1_1');
    expect(level_0_1_1.link('self')?.href).to.eql('/level0_1_1');
  });
});
