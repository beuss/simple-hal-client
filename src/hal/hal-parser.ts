import {HalFormsResource} from './hal-forms-resource';
import {HalLink} from './hal-link';
import {SimpleHalClient} from '../client/simple-hal-client';
import {absolutize} from '../utils/url';
import {
  HalFormsPropertyInit,
  HalFormsTemplate,
  isPropertyType,
} from './hal-forms-template';

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
  // Spec says that a document without _templates property should be
  // ignored. Looks pretty silly as it would break compatibility with
  // regular HAL
  const templates = body._templates ?? {};
  let selfHref = base;
  if (links.self?.href !== undefined) {
    selfHref = absolutize(links.self.href, base);
  }
  delete body._links;
  delete body._embedded;
  delete body._templates;
  const halLinks = parseLinks(base, selfHref, links, client);
  return new HalFormsResource({
    rel,
    content: body,
    embedded: parseEmbedded(selfHref, embedded, client),
    links: halLinks,
    templates: parseTemplates(selfHref, halLinks, templates, client),
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

function parseTemplates(
  selfHref: string,
  links: Record<string, HalLink | HalLink[]>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  templates: any,
  client: SimpleHalClient
): Record<string, HalFormsTemplate> {
  const result: Record<string, HalFormsTemplate> = {};
  Object.entries(templates).forEach(([rel, template]) => {
    const halTemplate = convertTemplate(rel, selfHref, links, template, client);
    result[rel] = halTemplate;
  });
  return result;
}

function convertTemplate(
  rel: string,
  base: string,
  links: Record<string, HalLink | HalLink[]>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: any,
  client: SimpleHalClient
): HalFormsTemplate {
  // The spec is almost ununderstandable on the "target" attribute:
  // “Contains the identifier of the target URL for the client to use when
  // submitting the completed HAL-FORMS template”
  // When looking at the (rare and very partial) examples it looks like it
  // means target should be a link identifier in the _links attribute (there
  // is a sample in §5.1 describing an HAL response and an HAL-FORMS response,
  // no information is provided wrt the relationship between the two elements).
  // Since some implementations directly use an URL, we try to support this too.
  // Also, no information is provided about where the request should go if no
  // target is specified… in that case we use enclosing self href.
  let resolvedUrl = template.target;
  const link = links[template.target];
  if (resolvedUrl === undefined) {
    resolvedUrl = base;
  } else if (link instanceof HalLink) {
    resolvedUrl = absolutize(link.href, base);
  } else {
    resolvedUrl = absolutize(resolvedUrl, base);
  }
  let properties = template.properties;
  if (Array.isArray(properties)) {
    properties = properties
      .map(prop => convertProperty(prop))
      .filter(prop => prop !== undefined);
  } else {
    properties = [];
  }
  return new HalFormsTemplate(
    client,
    {
      rel,
      resolvedUrl,
      contentType: template.contentType || 'application/json',
      method: template.method || 'GET',
      target: template.target,
      title: template.title,
    },
    properties
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertProperty(prop: any): HalFormsPropertyInit | undefined {
  if (prop.name === undefined) {
    console.warn(
      `Ignoring property without name attribute (${JSON.stringify(prop)})`
    );
    return undefined;
  }
  let regex = prop.regex;
  if (regex !== undefined) {
    try {
      regex = new RegExp(regex);
    } catch (ignored) {
      regex = undefined;
    }
  }
  return {
    name: prop.name,
    type: isPropertyType(prop.type) ? prop.type : 'text',
    prompt: prop.prompt || prop.name,
    readOnly: prop.readOnly === true || prop.readOnly === 'true',
    regex,
    required: prop.required === true || prop.required === 'true',
    templated: prop.templated === true || prop.templated === 'true',
    value: prop.value,
  };
}
