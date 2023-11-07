import {HalFormsResource} from './hal-forms-resource';
import {HalLink} from './hal-link';
import {SimpleHalClient} from '../client/simple-hal-client';
import {absolutize} from '../utils/url';

export function parseHal(
  base: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  document: any,
  client: SimpleHalClient
): HalFormsResource<unknown> {
  return parseResource(base, 'self', document, client);
}

function parseResource(
  base: string,
  rel: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any,
  client: SimpleHalClient
): HalFormsResource<unknown> {
  const links = body._links ?? {};
  const embedded = body._embedded ?? {};
  let selfHref = base;
  if (links.self?.href !== undefined) {
    selfHref = absolutize(links.self.href, base);
  }
  delete body._links;
  delete body._embedded;
  return new HalFormsResource({
    rel,
    content: body,
    embedded: parseEmbedded(selfHref, embedded, client),
    links: parseLinks(base, selfHref, links, client),
  });
}

function parseLinks(
  base: string,
  selfHref: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  links: any,
  client: SimpleHalClient
): Record<string, HalLink | HalLink[]> {
  const result: Record<string, HalLink | HalLink[]> = {};
  // There is absolutely nothing about relative links in the spec, so we have the following assumption:
  // self link is resolved as relative to the enclosing resource (or query URL for root resource),
  // other links are resolved as relative to the self href of the current resource
  Object.entries(links).forEach(([rel, link]) => {
    const effectiveBase = rel === 'self' ? base : selfHref;
    if (Array.isArray(link)) {
      result[rel] = link
        .map(item => convertLink(rel, effectiveBase, item, client))
        .filter(item => item !== undefined) as HalLink[];
      return;
    }
    const halLink = convertLink(rel, effectiveBase, link, client);
    if (halLink !== undefined) {
      result[rel] = halLink;
    }
  });
  return result;
}

function convertLink(
  rel: string,
  base: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  link: any,
  client: SimpleHalClient
): HalLink | undefined {
  if (!link.href) {
    console.warn(`Ignoring link with rel ${rel} since it has no href`);
    return undefined;
  }
  return new HalLink(client, {
    href: link.href,
    rel,
    base,
    deprecation: link.deprecation,
    hreflang: link.hreflang,
    name: link.name,
    profile: link.profile,
    // “SHOULD be considered false if it is undefined or any other value than true.”
    templated: link.templated === true || link.templated === 'true',
    title: link.title,
    type: link.type,
  });
}

function parseEmbedded(
  base: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  embedded: any,
  client: SimpleHalClient
): Record<string, HalFormsResource<unknown> | HalFormsResource<unknown>[]> {
  const result: Record<
    string,
    HalFormsResource<unknown> | HalFormsResource<unknown>[]
  > = {};
  Object.entries(embedded).forEach(([rel, body]) => {
    if (Array.isArray(body)) {
      result[rel] = body.map(item => parseResource(base, rel, item, client));
    } else {
      result[rel] = parseResource(base, rel, body, client);
    }
  });
  return result;
}
