# jwt-claims-fhir
This is a trial implementation of the proposal to use [jwt claims for fhir](./jwt-claims-fhir.md)

## Use

### claims
Evaluate claims against a proposed action

    //claims made in json web token
    var scope_claims = ['Foo/12345'];
    var action_claims = ['read:Foo', 'read:Bar'];

    //scope and action to evaluate
    var scope = '*';
    var action = {op: 'read', type: 'Bar'};

    if (lib.claims
        .authorise()
        .access(scope, scope_claims)
        .action(action, action_claims)
        .isAuthorised)
    {
        console.log('authorised');
    }

### parser
Determine action from a request with url and method

    var options = {
        base: 'https://fhir.example.net/svc/fhir'
    };

    var req = {
        url: 'https://fhir.example.net/svc/fhir/Foo/123',
        method: 'GET'
    };

    var action = lib.parser.parse(req, options);

    console.log(action);

### convert
Convert claims to [SMART on FHIR scopes](http://docs.smarthealthit.org/authorization/scopes-and-launch-context/)

    var options = {
        read: ['$foo'],
        write: ['$bar'],
        '*': ['$anything']
    };

    var smart_scopes = lib.convert(options).toSMARTonFHIRscopes(claims);

    console.log(smart_scopes);


## Notices

Copyright (c) 2016+ Black Pear Software

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## License
jwt-claims-fhir is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

jwt-claims-fhir is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

## Acknowledgements

Work supported by [Black Pear Software](https://www.blackpear.com)
