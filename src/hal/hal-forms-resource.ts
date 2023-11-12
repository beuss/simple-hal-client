import {HalFormsTemplate} from './hal-forms-template';
import {HalLink} from './hal-link';

export type HalFormsResourceInit<T> = {
  rel: string;
  links: Record<string, HalLink | HalLink[]>;
  embedded: Record<
    string,
    HalFormsResource<unknown> | HalFormsResource<unknown>[]
  >;
  templates: Record<string, HalFormsTemplate>;
  content?: T;
};

/**
 * Resource as per HAL-FORMS definition
 */
export class HalFormsResource<T> {
  private readonly _links: Record<string, HalLink | HalLink[]>;
  private readonly _embedded: Record<
    string,
    HalFormsResource<unknown> | HalFormsResource<unknown>[]
  >;
  private readonly _templates: Record<string, HalFormsTemplate>;

  /**
   * Relationship between this resource and the root resource. Useful when
   * retrieving all embedded as an array through #embeddeds(). The root resource
   * will always have the value self
   */
  public readonly rel: string;

  /**
   * Content of this resource (application specific fields, stripped from all
   * HAL-FORMS elements)
   */
  public readonly content?: T;

  constructor(init: HalFormsResourceInit<T>) {
    this.rel = init.rel;
    this._links = init.links;
    this._embedded = init.embedded;
    this._templates = init.templates;
    this.content = init.content;
  }

  /**
   * Retrieves the link having the given relation with this resource
   * @param rel Relation of the link
   * @param name Optional name used to discriminate between several links with the same
   * @returns The link with the specified relationship. If name is not specified, the value
   * shouldn't appear as an array in the response. If name is specified, then only one link
   * must match the name, otherwise an Error will be thrown
   * @throws Error if the link appears as an array in the original response (even with a single
   * entry) or if the specified (rel, name) combination matches more than one link
   */
  public link(rel: string, name?: string): HalLink | undefined {
    let link = this._links[rel];
    if (link === undefined) {
      return undefined;
    }
    if (name !== undefined) {
      link = this.ensureArray(link).filter(item => item.name === name);
      if (link.length === 0) {
        return undefined;
      }
      if (link.length === 1) {
        link = link[0];
      }
    }
    if (Array.isArray(link)) {
      throw new Error(`Link ${rel} is multivalued`);
    }
    return link;
  }

  /**
   * Retrieves the requested multivalued links having the given relation or all declared links as
   * an array reif no relation is specified
   * @param rel Relation between this document and the link
   * @param name Name of the links to retain, to discriminate several links using the same relation
   * @returns Requested links or undefined if no link with such rel/name exists (returned array is
   * never empty)
   * @throws Error if the requested link is not an array (spec states that “representation SHOULD not
   * change between link array and monovalued link”)
   */
  public links(rel?: string, name?: string): HalLink[] | undefined {
    if (Object.keys(this._links).length === 0) {
      return undefined;
    }
    if (rel === undefined) {
      return Object.values(this._links).flat();
    }
    let links = this._links[rel];
    if (links === undefined) {
      return undefined;
    }
    if (!Array.isArray(links)) {
      throw new Error(`Link ${rel} is monovalued`);
    }
    if (name !== undefined) {
      links = links.filter(link => link.name === name);
    }
    if (links.length === 0) {
      return undefined;
    }
    return links;
  }

  /**
   * Retrieves a monovalued embedded resource with the specified relationship with
   * this resources
   * @param rel Relationship of the embedded resource to fetch
   * @returns undefined if no embedded with the specified rel exists
   * @throws Error if the embedded has been returned as an array in original document
   * (there is no directive in the spec about how this should be handled but it seems
   * logical to adopt the same behavior as for links)
   */
  public embedded<T>(rel: string): HalFormsResource<T> | undefined {
    const embedded = this._embedded[rel];
    if (embedded === undefined) {
      return undefined;
    }
    if (Array.isArray(embedded)) {
      throw new Error(`Embedded ${rel} is multivalued`);
    }
    return embedded as HalFormsResource<T>;
  }

  /**
   * Retrieves multivalued embedded resources with the specified relationship with regard
   * to this resource
   * @param rel Relationship between current resource and the requested embedded resources.
   * If not specified, all embedded resources are returned as an array.
   * @returns undefined if no embedded with the specified relationship exists in this resource
   * @throws Error if the requested embedded does not appear as an array in the original
   * document
   */
  public embeddeds<T>(rel?: string): HalFormsResource<T>[] | undefined {
    if (Object.keys(this._embedded).length === 0) {
      return undefined;
    }
    if (rel === undefined) {
      return Object.values(this._embedded).flat() as HalFormsResource<T>[];
    }
    const embedded = this._embedded[rel];
    if (embedded === undefined) {
      return undefined;
    }
    if (!Array.isArray(embedded)) {
      throw new Error(`Link ${rel} is monovalued`);
    }
    return embedded as HalFormsResource<T>[];
  }

  /**
   * Gets the template whose name is provided if it exists
   * @param key Key (identifier) of the template to get
   * @returns The requested template or undefined if no template
   * with this key exists
   */
  public template(key: string): HalFormsTemplate | undefined {
    return this._templates[key];
  }

  /**
   * Gets all the templates of this resource as an array
   * @returns undefined if this resource defines no template
   */
  public templates(): HalFormsTemplate[] | undefined {
    if (Object.keys(this._templates).length === 0) {
      return undefined;
    }
    return Object.values(this._templates).flat();
  }

  private ensureArray<A>(maybeArray: A | A[]): A[] {
    return Array.isArray(maybeArray) ? maybeArray : [maybeArray];
  }
}
