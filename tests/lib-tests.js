var lib = require('../lib');

var should = require('chai').should();
var expect = require('chai').expect;

describe('lib', function () {

    var options = {
        base: 'https://fhir.example.net/svc/fhir'
    };

    var testcase = [];
    function addTestCase(url, method, fhir_scp, fhir_act, expected) {
        testcase.push({
            req: {
                url: 'https://fhir.example.net/svc/fhir/' + url,
                method: method
            },
            token: {
                fhir_scp: fhir_scp,
                fhir_act: fhir_act
            },
            expected: expected
        });
    }

    function runTestCase(tc){
        try {
            var description = tc.req.method + ' ' + tc.req.url + ' -> ' + tc.expected;
            it(description, function () {
                var params = lib.parser.parse(tc.req, options);
                lib.claims
                    .authorise()
                    .access(params.scope, tc.token.fhir_scp)
                    .action(params.action, tc.token.fhir_act)
                    .isAuthorised
                    .should.equal(tc.expected);
            });
        }
        catch (err){
            console.log(err);
        }
    }

    //Wellformed requests
    addTestCase('Foo/123', 'GET', '*', 'read:Foo', true);
    addTestCase('Foo/123', 'GET', '*', 'read:*', true);
    addTestCase('Bar/123', 'GET', '*', 'read:Foo', false);
    addTestCase('Foo/123', 'GET', '*', '*:Foo', true);

    addTestCase('Foo/123/_history/1', 'GET', '*', 'vread:Foo', true);
    addTestCase('Foo/123/_history/1', 'GET', '*', 'read:Foo', false);

    addTestCase('Foo/123', 'PUT', '*', 'update:Foo', true);
    addTestCase('Foo?bar=123', 'PUT', '*', 'update:Foo', true);
    addTestCase('Bar/123', 'PUT', '*', 'update:Foo', false);

    addTestCase('Foo/123', 'DELETE', '*', 'delete:Foo', true);
    addTestCase('Foo?bar=123', 'DELETE', '*', 'delete:Foo', true);

    addTestCase('Foo', 'POST', '*', 'create:Foo', true);

    addTestCase('Foo?bar=123', 'GET', '*', 'search:Foo', true);
    addTestCase('Foo?foo=bar1&foo=bar2&bar=foo', 'GET', '*', 'search:Foo', true);
    addTestCase('Foo/_search?bar=123', 'POST', '*', 'search:Foo', true);
    addTestCase('Foo/_search?foo=bar1&foo=bar2&bar=foo', 'POST', '*', 'search:Foo', true);

    addTestCase('Foo/123/Bar?foo=bar', 'GET', '*', 'search:Bar', true);
    addTestCase('Foo/123/Bar?foo=bar', 'GET', 'Foo/123', 'search:Bar', true);
    addTestCase('Foo/123/Bar?foo=bar', 'GET', 'Foo/456', 'search:Bar', false);

    addTestCase('_search?bar=123', 'POST', '*', 'search:^', true);

    addTestCase('', 'GET', '*', 'conformance:^', true);
    addTestCase('metadata', 'GET', '*', 'conformance:^', true);

    addTestCase('', 'POST', '*', 'batch_transaction:^', true);

    addTestCase('Foo/123/_history', 'GET', '*', 'history:Foo', true);
    addTestCase('Foo/_history', 'GET', '*', 'history:Foo', true);
    addTestCase('_history', 'GET', '*', 'history:^', true);

    addTestCase('Foo/123/$bar', 'POST', '*', '$bar:Foo', true);
    addTestCase('Foo/123/$bar', 'GET', '*', '$bar:Foo', true);

    addTestCase('Foo/$bar', 'POST', '*', '$bar:Foo', true);
    addTestCase('Foo/$bar', 'GET', '*', '$bar:Foo', true);

    addTestCase('$bar', 'POST', '*', '$bar:^', true);
    addTestCase('$bar', 'GET', '*', '$bar:^', true);

    //Badly formed requests
    addTestCase('dfjlkjasdflkjlkjljadsfkj', 'POST', '*', 'create:Foo', false);
    addTestCase('Foo/123', 'POST', '*', 'create:Foo', false);
    addTestCase('Foo/123', 'GET', '*', 'read:', false);
    addTestCase('Foo/123', 'GET', '*', '', false);

    describe('should combine request parsing and claim evaluation', function () {
        testcase.forEach(runTestCase);
    });
});

