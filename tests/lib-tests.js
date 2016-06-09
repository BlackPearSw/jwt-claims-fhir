var lib = require('../lib');

var should = require('chai').should();
var expect = require('chai').expect;

describe('lib', function () {

    var options = {
        base: 'https://fhir.example.net/svc/fhir'
    };

    function authorise(url, method, fhir_scp, fhir_act) {
        var tc = {
            req: {
                url: 'https://fhir.example.net/svc/fhir/' + url,
                method: method
            },
            token: {
                fhir_scp: fhir_scp,
                fhir_act: fhir_act
            },
            returns: function (expected) {
                try {
                    var description = tc.req.method + ' ' + tc.req.url + ' -> ' + tc.expected;
                    it(description, function () {
                        var params = lib.parser.parse(tc.req, options);
                        lib.claims
                            .authorise()
                            .access(params.scope, tc.token.fhir_scp)
                            .action(params.action, tc.token.fhir_act)
                            .isAuthorised
                            .should.equal(expected);
                    });
                }
                catch (err) {
                    console.log(err);
                }
            }
        };

        return tc;
    }

    describe('should combine request parsing and claim evaluation', function () {
        //Wellformed requests
        authorise('Foo/123', 'GET', '*', 'read:Foo').returns(true);
        authorise('Foo/123', 'GET', '*', 'read:*').returns(true);
        authorise('Bar/123', 'GET', '*', 'read:Foo').returns(false);
        authorise('Foo/123', 'GET', '*', '*:Foo').returns(true);

        authorise('Foo/123/_history/1', 'GET', '*', 'vread:Foo').returns(true);
        authorise('Foo/123/_history/1', 'GET', '*', 'read:Foo').returns(false);

        authorise('Foo/123', 'PUT', '*', 'update:Foo').returns(true);
        authorise('Foo?bar=123', 'PUT', '*', 'update:Foo').returns(true);
        authorise('Bar/123', 'PUT', '*', 'update:Foo').returns(false);

        authorise('Foo/123', 'DELETE', '*', 'delete:Foo').returns(true);
        authorise('Foo?bar=123', 'DELETE', '*', 'delete:Foo').returns(true);


        authorise('Foo', 'POST', '*', 'create:Foo').returns(true);

        authorise('Foo?bar=123', 'GET', '*', 'search:Foo').returns(true);
        authorise('Foo?foo=bar1&foo=bar2&bar=foo', 'GET', '*', 'search:Foo').returns(true);
        authorise('Foo/_search?bar=123', 'POST', '*', 'search:Foo').returns(true);
        authorise('Foo/_search?foo=bar1&foo=bar2&bar=foo', 'POST', '*', 'search:Foo').returns(true);

        authorise('Foo/123/Bar?foo=bar', 'GET', '*', 'search:Bar').returns(true);
        authorise('Foo/123/Bar?foo=bar', 'GET', 'Foo/123', 'search:Bar').returns(true);
        authorise('Foo/123/Bar?foo=bar', 'GET', 'Foo/456', 'search:Bar').returns(false);

        authorise('_search?bar=123', 'POST', '*', 'search:^').returns(true);

        authorise('', 'GET', '*', 'conformance:^').returns(true);
        authorise('metadata', 'GET', '*', 'conformance:^').returns(true);

        authorise('', 'POST', '*', 'transaction:^').returns(true);

        authorise('Foo/123/_history', 'GET', '*', 'history:Foo').returns(true);
        authorise('Foo/_history', 'GET', '*', 'history:Foo').returns(true);
        authorise('_history', 'GET', '*', 'history:^').returns(true);

        authorise('Foo/123/$bar', 'POST', '*', '$bar:Foo').returns(true);
        authorise('Foo/123/$bar', 'GET', '*', '$bar:Foo').returns(true);

        authorise('Foo/$bar', 'POST', '*', '$bar:Foo').returns(true);
        authorise('Foo/$bar', 'GET', '*', '$bar:Foo').returns(true);

        authorise('$bar', 'POST', '*', '$bar:^').returns(true);
        authorise('$bar', 'GET', '*', '$bar:^').returns(true);

        //Badly formed requests
        authorise('dfjlkjasdflkjlkjljadsfkj', 'POST', '*', 'create:Foo').returns(false);
        authorise('Foo/123', 'POST', '*', 'create:Foo').returns(false);
        authorise('Foo/123', 'GET', '*', 'read:').returns(false);
        authorise('Foo/123', 'GET', '*', '').returns(false);
    });
});

