var lib = require('../lib');

var should = require('chai').should();

describe('lib', function () {


    function buildAuthorisation(reqHeaders, options) {

        return function(url, method, fhir_scp, fhir_act) {
            var tc = {
                req: {
                    method: method,
                    protocol: 'https',
                    originalUrl: '/fhir/' + url,
                    headers: reqHeaders
                },
                token: {
                    fhir_scp: fhir_scp,
                    fhir_act: fhir_act
                },
                returns: function (expected) {
                    var description = tc.req.method + ' ' + tc.req.originalUrl + ' -> ' + expected;
                    it(description, function () {
                        try {
                            var params = lib.parser.parse(tc.req, options);
                            lib.claims
                                .authorise()
                                .access(params.scope, tc.token.fhir_scp)
                                .action(params.action, tc.token.fhir_act)
                                .isAuthorised
                                .should.equal(expected);
                        }
                        catch (err) {
                            err.should.exist;
                            err.message.should.equal(expected);
                        }
                    });
                }
            };

            return tc;
        }
    }
    
    describe('should combine request parsing and claim evaluation', function () {

        var header = {
            host: 'fhir.example.net/svc'
        };
        var options = {
            base: 'https://fhir.example.net/svc/fhir'
        };

        var authorise = buildAuthorisation(header, options);

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
        authorise('Foo/678/Bar?foo=bar', 'GET', 'Foo/456', 'search:Bar').returns(false);

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

    describe('should reject request if options are malformed', function () {

        var header = {
            host: 'fhir.example.net/svc'
        };
        var options = {
            // Base url has additional route path
            base: 'https://fhir.example.net/svc/testing/fhir'
        };

        var authorise = buildAuthorisation(header, options);

        authorise('Foo?identifier=bar%7C1234', 'GET', '*', '*:*').returns('request source does not match options');
    });

    describe('should support proxied request', function () {

        url = 'Foo?identifier=bar%7C1234';

        var header = {
            host: 'fhir.demo.net',
            'x-forwarded-proto': 'http',
            'x-forwarded-uri': '/svc/fhir/' + url
        };
        
        var options = {
            base: 'http://fhir.demo.net/svc/fhir'
        };

        var authorise = buildAuthorisation(header, options);

        authorise(url, 'GET', '*', ['read:*','search:*']).returns(true);
    });

    describe('requests using spoofed headers are rejected', function () {

        // This test assumes a GET request to http://fhir.demo.net/svc/fhir/Bar?a=11&/Foo/678?a=1
        // It is attempting to gain authorisation to search the Bar resource by spoofing the path and
        // with the knowledge that the /Foo/678?a=1 search term will be ignored
        var header = {
            host: 'fhir.demo.net',
            'x-forwarded-proto': 'http',
            'x-forwarded-uri': 'Bar?a=11&' + '/Foo/678'
        };

        var options = {
            base: 'http://fhir.demo.net/svc/fhir'
        };

        var authorise = buildAuthorisation(header, options);

        authorise(url, 'GET', 'Foo/678', ['read:*','search:*']).returns('request source does not match options');
    });
});

