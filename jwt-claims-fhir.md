# JWT claims for FHIR servers

JSON Web Token (JWT) is a compact, URL-safe means of representing
claims to be transferred between two parties. [RFC7519] (https://tools.ietf.org/html/rfc7519)

This proposal describes a generic set of structured claims that can be provided within JSON
Web Tokens to allow servers to authorise requests to a FHIR REST API.

## Principles
- Claims are consistent with FHIR Rest API specifications
- Standard claims are used where possible
- All custom claims prefixed 'fhir'
- Compact claims are preferred

### Reserved claims

The following reserved claims are used, with the following additional requirements:

#### iss (Issuer)
Required

#### sub (Subject)
Required

Server SHOULD use this as AuditEvent.participant.altId

#### aud (Audience)
Required

#### exp (Expiration Time)
Required

#### nbf (Not Before)
Required

#### iat (Issued At)
Required

#### jti (JWT ID)
Required

### Custom claims

#### fhir_scp (FHIR Scope)
An array of strings, each defining a scope within which actions may be performed on the server.

Optional, but if not present assume an empty array:

    fhir_scp: []

A server MAY choose to implement additional authorisation checks based on the provided claims.

Scopes can be defined as follows:

##### Any scope
Allow access to any scope on server, including all compartments:

    *

##### Compartment scope
Allow access to single compartment on server:

    [compartment]/[id]

For example:

    'Foo/ljsadf687asdf34asdf657'

##### Shorthand

For compactness, compartment scopes can be defined as comma separated lists.
For example:

    'Foo/123456,789123,456789'

is equivalent to:

    'Foo/123456',
    'Foo/789123',
    'Foo/456789'

For compactness, a single string can be supplied in place of the array. For example:

    fhir_scp: '*'

is equivalent to:

    fhir_scp: [
        '*'
    ]

#### fhir_act (FHIR Action)
An array of strings, each defining an action that may be performed on the server.

Optional, but if not present assume an empty array:

    fhir_act: []

##### Interaction (instance or type)
An interaction defined in the FHIR REST API specification:

    [interaction]:[type]

For example:

    'read:Foo'

##### Interaction (system)
An interaction defined in the FHIR REST API specification:

    [interaction]:^

For example:

    'read:^'


##### Operation (instance or type)
An operation (standard or implementor-defined)

    $[name]:[type]

For example:

    '$do/Bar'

##### Operation (system)
An operation (standard or implementor-defined)

    $[name]:^

For example:

    '$do/^'

##### Shorthand

For compactness, both type and operation can be defined as comma separated lists. For example:

    'read,search:Foo,Bar'

is equivalent to:

    'read:Foo',
    'search:Foo',
    'read:Bar',
    'search:Bar'

For compactness, a single string can be supplied in place of the array. For example:

    fhir_act: 'read:Foo'

is equivalent to:

    fhir_act: [
        'read:Foo'
    ]


### Example

    {
        iss: 'https://auth.example.net',
        sub: 'user@example.net',
        nbf: 1463059456166,
        exp: 1463064578213,
        iat: 1463059366160,
        aud: ['https://fhir.example.net'],
        jti: '5794b4f6-90bb-41a2-8e11-27ff4adb8880',
        fhir_scp: [
            '*'
        ],
        fhir_act: [
            'read:Foo,Bar',
            '$do:Bar'
        ]
    }

