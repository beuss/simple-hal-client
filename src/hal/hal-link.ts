import {HalResponse} from '../client/hal-response';
import {SimpleHalClient} from '../client/simple-hal-client';
import * as urlTemplate from 'url-template';
import {absolutize} from '../utils/url';
export type HalLinkInit = {
  href: string;
  rel: string;
  base: string;
  templated?: boolean;
  type?: string;
  deprecation?: string;
  name?: string;
  profile?: string;
  title?: string;
  hreflang?: string;
};

/**
 * Link as per HAL specification
 */
export class HalLink {
  /**
   * href of the link, may be fully qualified, rooted or relative
   * to its containing resource
   */
  public readonly href: string;
  /**
   * Base URL used to resolve href to an absolute URL if it isn't
   * already
   */
  public readonly base: string;
  /**
   * Relationship between this link and its enclosing resource
   * (key of the _links array leading to this link's generation)
   */
  public readonly rel: string;
  /**
   * Whether this link's href is templated or not
   */
  public readonly templated?: boolean;
  /**
   * Media type of the resource pointed by this link
   */
  public readonly type?: string;
  /**
   * URL of details about this link's deprecation. If this
   * property is defined, this link should probably not be
   * used anymore
   */
  public readonly deprecation?: string;
  /**
   * Name of the link, additional key used to discriminate
   * links with the same rel.
   */
  public readonly name?: string;
  /**
   * Profile of the target resource (RFC6906), informations about
   * constraints, conventions, etc.
   */
  public readonly profile?: string;
  /**
   * Human readable title of the link
   */
  public readonly title?: string;
  /**
   * Language of the target resoruce
   */
  public readonly hreflang?: string;
  private readonly urlTemplate;

  constructor(
    private readonly client: SimpleHalClient,
    init: HalLinkInit
  ) {
    this.href = init.href;
    this.base = init.base;
    this.rel = init.rel;
    this.templated = init.templated;
    this.type = init.type;
    this.deprecation = init.deprecation;
    this.name = init.name;
    this.profile = init.profile;
    this.title = init.title;
    this.hreflang = init.hreflang;
    this.urlTemplate = urlTemplate.parse(init.href);
  }

  /**
   * Follows this link and returns the provided response
   * @param variables Variables to use for URL template extension
   * @param client Client to use for fetching, defaults to the client used
   * to create this instance
   * @returns A promise resolving to the remote end response that may be an
   * HAL-FORMS resource or not.
   */
  public follow(
    variables?: Record<string, string | string[] | number | number[]>,
    client?: SimpleHalClient
  ): Promise<HalResponse> {
    // A client SHOULD provide some notification (for example, by logging a warning message) whenever it traverses over a link that has this property.
    if (this.deprecation !== undefined) {
      console.warn(
        `Following deprecated link with rel ${this.rel}, more information at ${this.deprecation}`
      );
    }
    let target;
    if (this.templated) {
      target = this.urlTemplate.expand(variables ?? {});
    } else {
      target = this.href;
    }
    if (client === undefined) {
      client = this.client;
    }
    return client.fetch(absolutize(target, this.base));
  }
}
