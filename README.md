# Simple HAL client

This is a simple implementation of HAL-FORMS client. It is mostly tested against
[Spring HATEOS](https://spring.io/projects/spring-hateoas).

## Basic usage

Simply create a client and start fetching resources from your remote backend. The starting point of
every interaction is `fetch`, which you should use to get the root of the API, supposed to provide
links to every part of it.

```typescript
const client = new SimpleHalClient('http://my-server.example/api');
const response = await client.fetch();
```

Response can be used as a regular `fetch` response. It just provides an additional `hal()` method
whose goal is to parse the returned document as HAL(-FORMS). If the document cannot be parsed, the
method will throw (as well as if the returned response is not valid json). Otherwise, you get back
an `HalFormsResource` instance allowing you to navigate through links and relationships.

## Accessing to resource properties

Except for `_links`, `_embedded` and `_templates`, all properties of the resources are accessible
through the property `data` of an `HalFormsResource`. The class is parametrized to describe the type
of the data. e.g.:
```typescript
interface People {
	lastName: string;
	firstName: string;
}

…

const resource: HalFormsResource<People> = await response.hal();
const people = resource.data; // people: People
```

## Navigating links

One of the benefits of using HAL is to attach links to resources (through the `_links` property of
each HAL resource. Using SimpleHalClient, fetching and following a link is as simple as:

```typescript
let resource: HalFormsResource<any>;
…

const ancestorLink: HalLink = resource.link('ancestor')!;
const ancestorResource = await ancestorLink.follow('ancestor');

const childrenLinks: HalLink[] = resource.links('children')!;
const childrenResource = childrenLinks.map(l => l.follow());
```

Links can be mono or multivalued. Trying to get multivalued link through `link` will throw and
so will trying to get a monovalued link through `links`.

You can fetch all links for a given resource using `links()` (without argument). The relationship
between the link and its resource is then accessible through the `rel` property.

## Using embedded

Another feature of HAL is to embedded resources in an enclosing resource. The goal is, among others,
to prevent multiple fetches or to give a consistent view of a resource (think about database
transaction). Each embedded element can be the canonical representation of the embedded resource, a
partial representation or something having nothing to do with this canonical representation. If the
embedded resource has a link with `self` key, you should be able to fetch its canonical representation
by following it.

Getting an embedded resource is as simple as:

```typescript
let resource: HalFormsResource<any>;
…

const ancestorResource = resource.embedded('ancestor')!;
const childrenResource = resource.embeddeds('children')!;
```
Note that, as for the links, attempting to get a multivalued embedded with `embedded` will throw
and so will fetching a monovalued embedded through `embedded`.

An embedded resource is a full HAL-FORMS resource, it can in turn have links, embedded and
templates.

## Using templates

Templates is an HAL-FORMS feature. They describe actions that can be performed on a resource. Each
template has an identifying name and may describe the needed properties to send in the request.

Using templates with this lib looks like:

```typescript
let resource: HalFormsResource<any>;
…

const addChildTemplate = resource.template('addChild')!;
const childResource = addChildTemplate.invoke(JSON.stringify({ name: 'Foo', age: 28 }));
```

The spec does not specify (sic) whether templates names are unique. This library assumes they are.

## Filters

You can add filters to the client, in order to pre-process request or post-process response. This
can be useful for e.g. authentication handling (if server answer 401, you may want to renew an
access token or redirect user to login) or object creation.

Here is an example of filter that turns 204 (no content) responses into the resource pointed by
the returned `location` header (you can test it with Spring
[HATEOAS examples](https://github.com/spring-projects/spring-hateoas-examples):

```typescript
const client = new SimpleHalClient('https://simple-hal-client.example/employees');
this.client.appendFilter(async (params: FilterParams) => {
  const response = await params.next(params.request);
  if(response.status === 204 && response.headers.has('location')) {
    const body: ReadableStream = response.body as ReadableStream;
    return params.client.fetch(response.headers.get('location')!);
  }
  return response;
});

…


const response = await client.fetch();
const employees = await response.hal();
const template = employees.template('default')!;
const newEmployeeResource = await template.invoke(JSON.stringify({lastName: 'Foo'})).hal();
```

