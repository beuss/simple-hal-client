/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {HalFormsResource, HalFormsTemplate, HalResponse} from '../../src';
import {TestHalClient} from '../utils/test-hal-client';
import {HalFormsPropertyInit} from '../../src/hal/hal-forms-template';

describe('HAL-FORMS template processing', () => {
  it("shouldn't fail on missing _template", async () => {
    const client = new TestHalClient('https://hal-forms-templates.test', {
      foo: 'bar',
    });
    const response: HalResponse = await client.fetch();
    const halDocument: HalFormsResource<any> = await response.hal();
    expect(halDocument.templates()).to.be.undefined;
    expect(halDocument.content.foo).to.eql('bar');
  });

  it('should parse simple templates', async () => {
    const client = new TestHalClient('https://hal-forms-templates.test', {
      foo: 'bar',
      _links: {
        self: {href: '/foo/54320'},
      },
      _templates: {
        default: {},
        update: {
          method: 'PUT',
          contentType: 'application/x-www-form-urlencoded',
          target: 'https://hal-forms-templates.test/foo',
          title: 'Update Foo',
        },
        delete: undefined,
      },
    });
    const response: HalResponse = await client.fetch();
    const halDocument: HalFormsResource<any> = await response.hal();
    expect(halDocument.templates()).to.have.a.lengthOf(2);
    expect(halDocument.content.foo).to.eql('bar');
    expect(halDocument.template('delete')).to.be.undefined;
    expect(halDocument.template('unknown')).to.be.undefined;

    let template = halDocument.template('default') as HalFormsTemplate;
    expect(template.rel).to.eql('default');
    expect(template.key).to.eql('default');
    expect(template.contentType).to.eql('application/json');
    expect(template.method).to.eql('GET');
    expect(template.resolvedUrl).to.eql(
      'https://hal-forms-templates.test/foo/54320'
    );
    expect(template.target).to.be.undefined;
    expect(template.title).to.be.undefined;
    expect(template.properties).to.have.a.lengthOf(0);

    template = halDocument.template('update') as HalFormsTemplate;
    expect(template.rel).to.eql('update');
    expect(template.key).to.eql('update');
    expect(template.contentType).to.eql('application/x-www-form-urlencoded');
    expect(template.method).to.eql('PUT');
    expect(template.resolvedUrl).to.eql('https://hal-forms-templates.test/foo');
    expect(template.target).to.eql('https://hal-forms-templates.test/foo');
    expect(template.title).to.eql('Update Foo');
    expect(template.properties).to.have.a.lengthOf(0);
  });

  it('should parse various properties', async () => {
    const client = new TestHalClient('https://hal-forms-templates.test', {
      foo: 'bar',
      _links: {
        self: {href: '/foo/54320'},
      },
      _templates: {
        default: {
          properties: [
            {
              name: 'basicProperty',
            },
            {
              key: 'ignored',
            },
            {
              name: 'readonlyProperty',
              readOnly: true,
            },
            {
              name: 'anotherReadonlyProperty',
              readOnly: 'true',
            },
            {
              name: 'requiredProperty',
              required: true,
            },
            {
              name: 'anotherRequiredProperty',
              required: 'true',
            },
            {
              name: 'regexProperty',
              regex: '^\\d{13}$',
            },
            {
              name: 'invalidRegexProperty',
              regex: '^($',
            },
            {
              name: 'numberProperty',
              type: 'number',
              value: 19,
            },
            {
              name: 'templatedProperty',
              type: 'url',
              prompt: 'If anyone understands how it is supposed to work…',
              templated: true,
              value: 'https://hal-forms-templates.text/property/{id}',
            },
          ],
        },
      },
    });

    const response: HalResponse = await client.fetch();
    const halDocument: HalFormsResource<any> = await response.hal();
    const template = halDocument.template('default') as HalFormsTemplate;
    expect(template.properties).to.have.a.lengthOf(9);

    let property = template.property('basicProperty') as HalFormsPropertyInit;
    expect(property.name).to.be.eql('basicProperty');
    expect(property.type).to.be.eql('text');
    expect(property.prompt).to.be.eql('basicProperty');
    expect(property.readOnly).to.be.false;
    expect(property.required).to.be.false;
    expect(property.templated).to.be.false;
    expect(property.regex).to.be.undefined;
    expect(property.value).to.be.undefined;

    expect(template.property('ignored')).to.be.undefined;

    property = template.property('readonlyProperty') as HalFormsPropertyInit;
    expect(property.name).to.be.eql('readonlyProperty');
    expect(property.type).to.be.eql('text');
    expect(property.prompt).to.be.eql('readonlyProperty');
    expect(property.readOnly).to.be.true;
    expect(property.required).to.be.false;
    expect(property.templated).to.be.false;
    expect(property.regex).to.be.undefined;
    expect(property.value).to.be.undefined;

    property = template.property(
      'anotherReadonlyProperty'
    ) as HalFormsPropertyInit;
    expect(property.name).to.be.eql('anotherReadonlyProperty');
    expect(property.type).to.be.eql('text');
    expect(property.prompt).to.be.eql('anotherReadonlyProperty');
    expect(property.readOnly).to.be.true;
    expect(property.required).to.be.false;
    expect(property.templated).to.be.false;
    expect(property.regex).to.be.undefined;
    expect(property.value).to.be.undefined;

    property = template.property('requiredProperty') as HalFormsPropertyInit;
    expect(property.name).to.be.eql('requiredProperty');
    expect(property.type).to.be.eql('text');
    expect(property.prompt).to.be.eql('requiredProperty');
    expect(property.readOnly).to.be.false;
    expect(property.required).to.be.true;
    expect(property.templated).to.be.false;
    expect(property.regex).to.be.undefined;
    expect(property.value).to.be.undefined;

    property = template.property(
      'anotherRequiredProperty'
    ) as HalFormsPropertyInit;
    expect(property.name).to.be.eql('anotherRequiredProperty');
    expect(property.type).to.be.eql('text');
    expect(property.prompt).to.be.eql('anotherRequiredProperty');
    expect(property.readOnly).to.be.false;
    expect(property.required).to.be.true;
    expect(property.templated).to.be.false;
    expect(property.regex).to.be.undefined;
    expect(property.value).to.be.undefined;

    property = template.property('regexProperty') as HalFormsPropertyInit;
    expect(property.name).to.be.eql('regexProperty');
    expect(property.type).to.be.eql('text');
    expect(property.prompt).to.be.eql('regexProperty');
    expect(property.readOnly).to.be.false;
    expect(property.required).to.be.false;
    expect(property.templated).to.be.false;
    expect(property.regex).not.to.be.undefined;
    expect(property.regex!.source).to.eql('^\\d{13}$');
    expect(property.value).to.be.undefined;

    property = template.property(
      'invalidRegexProperty'
    ) as HalFormsPropertyInit;
    expect(property.name).to.be.eql('invalidRegexProperty');
    expect(property.type).to.be.eql('text');
    expect(property.prompt).to.be.eql('invalidRegexProperty');
    expect(property.readOnly).to.be.false;
    expect(property.required).to.be.false;
    expect(property.templated).to.be.false;
    expect(property.regex).to.be.undefined;
    expect(property.value).to.be.undefined;

    property = template.property('numberProperty') as HalFormsPropertyInit;
    expect(property.name).to.be.eql('numberProperty');
    expect(property.type).to.be.eql('number');
    expect(property.prompt).to.be.eql('numberProperty');
    expect(property.readOnly).to.be.false;
    expect(property.required).to.be.false;
    expect(property.templated).to.be.false;
    expect(property.regex).to.be.undefined;
    expect(property.value).to.be.eql(19);

    property = template.property('templatedProperty') as HalFormsPropertyInit;
    expect(property.name).to.be.eql('templatedProperty');
    expect(property.type).to.be.eql('url');
    expect(property.prompt).to.be.eql(
      'If anyone understands how it is supposed to work…'
    );
    expect(property.readOnly).to.be.false;
    expect(property.required).to.be.false;
    expect(property.templated).to.be.true;
    expect(property.regex).to.be.undefined;
    expect(property.value).to.be.eql(
      'https://hal-forms-templates.text/property/{id}'
    );
  });

  it('should apply template characteristics to invoked url', async () => {
    const client = new TestHalClient('https://hal-forms-templates.test', {
      foo: 'bar',
      _links: {
        self: {href: '/foo/54320'},
      },
      _templates: {
        default: {},
        update: {
          method: 'PUT',
          contentType: 'application/x-www-form-urlencoded',
          target: 'https://hal-forms-templates.test/foo',
        },
      },
    });
    const response: HalResponse = await client.fetch();
    const halDocument: HalFormsResource<any> = await response.hal();

    let template = halDocument.template('default') as HalFormsTemplate;
    await template.invoke();
    expect(client.sentRequest.url).to.eql(
      'https://hal-forms-templates.test/foo/54320'
    );
    expect(client.sentRequest.method).to.eql('GET');
    expect(client.sentRequest.headers.get('content-type')).to.eql(
      'application/json'
    );
    template = halDocument.template('update') as HalFormsTemplate;
    await template.invoke();
    expect(client.sentRequest.url).to.eql(
      'https://hal-forms-templates.test/foo'
    );
    expect(client.sentRequest.method).to.eql('PUT');
    expect(client.sentRequest.headers.get('content-type')).to.eql(
      'application/x-www-form-urlencoded'
    );
  });

  it('should invoke using custom client', async () => {
    const client = new TestHalClient('https://hal-forms-templates.test', {
      foo: 'bar',
      _links: {
        self: {href: '/foo/54320'},
      },
      _templates: {
        default: {},
      },
    });

    const response: HalResponse = await client.fetch();
    const halDocument: HalFormsResource<any> = await response.hal();

    const template = halDocument.template('default') as HalFormsTemplate;
    const invokingClient = new TestHalClient(
      'https://hal-forms-templates.test',
      {},
      {status: 204}
    );
    await template.invoke(undefined, invokingClient);
    expect(client.sentRequest.url).to.eql('https://hal-forms-templates.test/');
    expect(invokingClient.sentRequest.url).to.eql(
      'https://hal-forms-templates.test/foo/54320'
    );
  });

  it('should parse embedded templates', async () => {
    const client = new TestHalClient('https://hal-forms-templates.test', {
      foo: 'bar',
      _links: {
        self: {href: '/foo/54320'},
      },
      _embedded: {
        child: {
          _links: {self: {href: 'child/5225'}},
          _templates: {
            default: {},
          },
        },
      },
    });
    const response: HalResponse = await client.fetch();
    const halDocument: HalFormsResource<any> = await response.hal();
    const embedded = halDocument.embedded('child') as HalFormsResource<any>;
    const template = embedded.template('default') as HalFormsTemplate;

    expect(template).not.to.be.undefined;
    expect(template.rel).to.eql('default');
    expect(template.key).to.eql('default');
    expect(template.contentType).to.eql('application/json');
    expect(template.method).to.eql('GET');
    expect(template.resolvedUrl).to.eql(
      'https://hal-forms-templates.test/foo/child/5225'
    );
    expect(template.target).to.be.undefined;
    expect(template.title).to.be.undefined;
    expect(template.properties).to.have.a.lengthOf(0);
  });

  it('should resolve target against links', async () => {
    const client = new TestHalClient('https://hal-forms-templates.test', {
      foo: 'bar',
      _links: {
        self: {href: '/foo/54320'},
        'http://hal-forms-template.test/update': {
          href: '/foo/update',
        },
      },
      _templates: {
        default: {target: 'http://hal-forms-template.test/update'},
      },
    });

    const response: HalResponse = await client.fetch();
    const halDocument: HalFormsResource<any> = await response.hal();

    const template = halDocument.template('default') as HalFormsTemplate;
    expect(template).not.to.be.undefined;
    expect(template.rel).to.eql('default');
    expect(template.key).to.eql('default');
    expect(template.contentType).to.eql('application/json');
    expect(template.method).to.eql('GET');
    expect(template.resolvedUrl).to.eql(
      'https://hal-forms-templates.test/foo/update'
    );
    expect(template.target).to.eql('http://hal-forms-template.test/update');
    expect(template.title).to.be.undefined;
    expect(template.properties).to.have.a.lengthOf(0);
  });

  it("shouldn't add content-type for multipart queries", async () => {
    const client = new TestHalClient('https://hal-forms-templates.test', {
      _templates: {
        default: {
          target: 'http://hal-forms-template.test/update',
          contentType: 'multipart/form-data',
        },
      },
    });

    const resource = await client.fetchHal();
    const template = resource.template('default') as HalFormsTemplate;
    await template.invoke();
    expect(client.sentRequest.headers.has('content-type')).to.be.false;
  });

  it('should automatically serialize JSON', async () => {
    const client = new TestHalClient('https://hal-forms-templates.test', {
      _templates: {
        default: {
          target: 'http://hal-forms-template.test/update',
          method: 'POST',
        },
      },
    });

    const resource = await client.fetchHal();
    const template = resource.template('default') as HalFormsTemplate;
    await template.invoke({foo: 'bar'});
    expect(true).to.be.true;
  });
});
