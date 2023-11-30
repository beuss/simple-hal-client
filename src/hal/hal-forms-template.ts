import {HalResponse} from '../client/hal-response';
import {SimpleHalClient} from '../client/simple-hal-client';

export type HalFormsPropertyInit = {
  name: string;
  type: HalFormsPropertyType;
  prompt: string;
  readOnly: boolean;
  required: boolean;
  templated: boolean;
  regex?: RegExp;
  value?: unknown;
};

export type HalFormsPropertyType =
  | 'hidden'
  | 'text'
  | 'textarea'
  | 'search'
  | 'tel'
  | 'url'
  | 'email'
  | 'password'
  | 'date'
  | 'month'
  | 'week'
  | 'time'
  | 'datetime-local'
  | 'number'
  | 'range'
  | 'color';

export function isPropertyType(
  maybeType: string | undefined
): maybeType is HalFormsPropertyType {
  if (maybeType === undefined) {
    return false;
  }
  return (
    [
      'hidden',
      'text',
      'textarea',
      'search',
      'tel',
      'url',
      'email',
      'password',
      'date',
      'month',
      'week',
      'time',
      'datetime-local',
      'number',
      'range',
      'color',
    ].indexOf(maybeType.toLowerCase()) !== -1
  );
}

export type HalFormsTemplateInit = {
  rel: string;
  resolvedUrl: string;
  contentType: string;
  method: string;
  target?: string;
  title?: string;
};
/**
 * Property of a template, indicates a parameter that can be
 * transmitted to a template invokation. Describes additional
 * metadata for automatic form generation
 */
export class HalFormsProperty {
  /**
   * Name of the property, considered unique per template
   */
  public readonly name: string;
  /**
   * Type of the property, giving the type of field to use for
   * its representation
   */
  public readonly type: HalFormsPropertyType;
  /**
   * Human readable prompt of this property
   */
  public readonly prompt: string;
  /**
   * Whether this property is readonly (probably to only show
   * it in the generated form)
   */
  public readonly readOnly: boolean;
  /**
   * Whether this property is mandatory to send when invoking
   */
  public readonly required: boolean;
  /**
   * Whether this property's value is a templated URI. The placeholders
   * are probably taken from the enclosing resource, spec is silent about
   * this).
   */
  public readonly templated: boolean;
  /**
   * Validation regex for the value, only values matching it will be
   * accepted by the remote end
   */
  public readonly regex?: RegExp;
  /**
   * Initial value of this property
   */
  public readonly value?: unknown;

  constructor(init: HalFormsPropertyInit) {
    this.name = init.name;
    this.type = init.type;
    this.prompt = init.prompt;
    this.readOnly = init.readOnly;
    this.required = init.required;
    this.templated = init.templated;
    this.regex = init.regex;
    this.value = init.value;
  }
}

/**
 * Represents a template (action, affordance, method, …) that can be
 * bound to a HAL-FORMS resource.
 * As it seems nobody ever cared reading the spec there are massive
 * inconsistencies and lacks which led to some choices being made,
 * hoping they're good ones.
 * @param TPayload Type of the payload to use with invoke when JSON
 * is expected
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class HalFormsTemplate<TPayload = any> {
  /**
   * Relationship between this template and its parent. Special value
   * default represents the default action to apply to the resource
   */
  public readonly rel: string;
  /**
   * Content type of the payload to submit
   */
  public readonly contentType: string;
  /**
   * Method used to perform request when invoking this template
   */
  public readonly method: string;
  /**
   * Full URL to the action, resolved from enclosing element self
   * href of _links collection.
   */
  public readonly resolvedUrl: string;
  /**
   * Target of this action, may be an absolute URL, an url relative
   * to enclosing resource self href or a reference to one of the
   * _links entry
   */
  public readonly target?: string;
  /**
   * Human readable title of this action.
   */
  public readonly title?: string;
  /**
   * Properties to submit when invoking this template
   */
  public readonly properties: HalFormsProperty[];

  constructor(
    private readonly client: SimpleHalClient,
    init: HalFormsTemplateInit,
    propertiesInit: HalFormsPropertyInit[]
  ) {
    this.rel = init.rel;
    this.contentType = init.contentType;
    this.method = init.method;
    this.resolvedUrl = init.resolvedUrl;
    this.target = init.target;
    this.title = init.title;
    this.properties = propertiesInit.map(p => new HalFormsProperty(p));
  }

  /**
   * Key of this template, despite being mentioned in every sentence
   * of the spec, it seems that it is not an attribute of the template
   * but rather its key in the _templates object (making it similar to
   * rel)
   */
  get key() {
    return this.rel;
  }

  /**
   * Retrieves the property of this template whose name is provided
   * @param name name of the property to retrieve
   * @returns The requested property or undefined if no such property exists.
   * If several properties of the same name exist, only the first one is taken
   * into account
   */
  property(name: string): HalFormsProperty | undefined {
    // There is no explicit statement in the spec that a property name
    // should be unique for a single template but that seems logical
    return this.properties.find(p => p.name === name);
  }

  /**
   * Invoke this template, sending request as specified to remote backend
   * @param payload Payload of the query. Type should match expected content
   * type. It should provide at least all required properties declared for
   * this template.
   * @param client Client used to perform this invokation (e.g. to use different
   * filters). Defaults to the client used to retrieve this template's resource.
   * @returns A promise resolving when request completes or fails.
   */
  invoke(
    payload?: BodyInit | null | TPayload,
    client?: SimpleHalClient
  ): Promise<HalResponse> {
    if (client === undefined) {
      client = this.client;
    }

    const headers = new Headers();
    // For multipart queries, content-type must contain boundary, which is set
    // by browser… but only if no content type has been defined
    if (!this.contentType.startsWith('multipart/')) {
      if (
        payload !== null &&
        this.contentType === 'application/json' &&
        typeof payload === 'object'
      ) {
        payload = JSON.stringify(payload);
      }
      headers.set('content-type', this.contentType);
    }

    return client.fetch(this.resolvedUrl, {
      body: payload as BodyInit | null | undefined,
      headers,
      method: this.method,
      redirect: 'follow',
    });
  }
}
