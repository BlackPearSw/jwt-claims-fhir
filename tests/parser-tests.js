var lib = require('../lib/parser');

var should = require('chai').should();
var expect = require('chai').expect;

describe('parser', function () {

    var options;

    beforeEach(function () {
        options = {
            base: 'https://fubar.com/foo/fhir'
        }
    });

    function req(url, method) {
        return {
            method: method,
            protocol: 'https',
            originalUrl: '/foo/fhir/' + url,
            headers: {host : 'fubar.com'}
        }
    }

    describe('parse', function () {
        it('should exist', function () {
            should.exist(lib.parse);
        });

        it('should be a function', function () {
            lib.parse.should.be.a('function');
        });

        it('should tolerate unknown pattern', function () {
            var url = 'the/quick/brown/fox/jumped/over/the/lazy/dog';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'the',
                    id: 'quick'
                },
                action: {
                    base: options.base
                }
            });
        });

        it('should tolerate _ char in id', function () {
            var url = 'the/quick/brown/fox/jumped/over/the/lazy/dog';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'the',
                    id: 'quick'
                },
                action: {
                    base: options.base
                }
            });
        });

        it('should parse instance/read', function () {
            var url = 'Foo/123-a';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: 'read',
                    type: 'Foo',
                    id: '123-a'
                }
            });
        });

        it('should parse instance/vread', function () {
            var url = 'Foo/123-a/_history/1';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: 'vread',
                    type: 'Foo',
                    id: '123-a',
                    vid: '1'
                }
            });
        });

        it('should parse instance/update', function () {
            var url = 'Foo/123-a';
            var method = 'PUT';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: 'update',
                    type: 'Foo',
                    id: '123-a'
                }
            });
        });

        it('should parse type/conditional-update', function () {
            var url = 'Foo?bar=123-a';
            var method = 'PUT';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'update',
                    type: 'Foo',
                    parameters: {
                        bar: '123-a'
                    }
                }
            });
        });

        it('should parse instance/delete', function () {
            var url = 'Foo/123-a';
            var method = 'DELETE';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: 'delete',
                    type: 'Foo',
                    id: '123-a'
                }
            });
        });

        it('should parse type/conditional-delete', function () {
            var url = 'Foo?bar=123-a';
            var method = 'DELETE';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'delete',
                    type: 'Foo',
                    parameters: {
                        bar: '123-a'
                    }
                }
            });
        });

        it('should parse type/create', function () {
            var url = 'Foo';
            var method = 'POST';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'create',
                    type: 'Foo'
                }
            });
        });

        //TODO: conditional create not implemented

        it('should parse type/search using GET', function () {
            var url = 'Foo?foo=bar';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'search',
                    type: 'Foo',
                    parameters: {
                        foo: 'bar'
                    }
                }
            });
        });

        it('should parse type/search using POST', function () {
            var url = 'Foo/_search?foo=bar';
            var method = 'POST';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'search',
                    type: 'Foo',
                    parameters: {
                        foo: 'bar'
                    }
                }
            });
        });

        it('should parse type/search using POST with complex params', function () {
            var url = 'Foo/_search?foo=bar1&foo=bar2&bar=foo';
            var method = 'POST';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'search',
                    type: 'Foo',
                    parameters: {
                        foo: ['bar1', 'bar2'],
                        bar: 'foo'
                    }
                }
            });
        });

        it('should parse system/search using POST', function () {
            var url = '_search?foo=bar';
            var method = 'POST';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'search',
                    type: '^',
                    parameters: {
                        foo: 'bar'
                    }
                }
            });
        });

        it('should parse system/search using GET', function () {
            var url = '?foo=bar';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'search',
                    type: '^',
                    parameters: {
                        foo: 'bar'
                    }
                }
            });
        });

        it('should parse system/conformance', function () {
            var url = '';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'conformance',
                    type: '^'
                }
            });
        });

        it('should parse system/conformance specified without trailing slash', function () {
            var thisReq =  {
                    method: 'GET',
                    protocol: 'https',
                    originalUrl: '/foo/fhir',
                    headers: {host : 'fubar.com'}
                };

            var result = lib.parse(thisReq, options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'conformance',
                    type: '^'
                }
            });
        });

        it('should parse system/conformance using /metadata route', function () {
            var url = 'metadata';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'conformance',
                    type: '^'
                }
            });
        });

        it('should parse system/transaction', function () {
            var url = '';
            var method = 'POST';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'transaction',
                    type: '^'
                }
            });
        });

        it('should parse instance/history', function () {
            var url = 'Foo/123-a/_history';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: 'history',
                    type: 'Foo',
                    id: '123-a'
                }
            });
        });

        it('should parse type/history', function () {
            var url = 'Foo/_history';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'history',
                    type: 'Foo'
                }
            });
        });

        it('should parse system/history', function () {
            var url = '_history';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'history',
                    type: '^'
                }
            });
        });

        it('should parse instance/$operation using POST', function () {
            var url = 'Foo/123-a/$bar';
            var method = 'POST';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: '$bar',
                    type: 'Foo',
                    id: '123-a'
                }
            });
        });

        it('should parse instance/$operation using GET', function () {
            var url = 'Foo/123-a/$bar';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: '$bar',
                    type: 'Foo',
                    id: '123-a'
                }
            });
        });

        it('should parse instance/$operation using GET [regression BPS.PT#146765319]', function () {
            var url = 'Slot/5821ee6d9e04a3df0812b335/$reserve';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Slot',
                    id: '5821ee6d9e04a3df0812b335'
                },
                action: {
                    base: options.base,
                    op: '$reserve',
                    type: 'Slot',
                    id: '5821ee6d9e04a3df0812b335'
                }
            });
        });



        it('should parse type/$operation using POST', function () {
            var url = 'Foo/$bar';
            var method = 'POST';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: '$bar',
                    type: 'Foo'
                }
            });
        });

        it('should parse type/$operation using GET', function () {
            var url = 'Foo/$bar';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: '$bar',
                    type: 'Foo'
                }
            });
        });

        it('should parse system/$operation using POST', function () {
            var url = '$bar';
            var method = 'POST';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: '$bar',
                    type: '^'
                }
            });
        });

        it('should parse system/$operation using GET', function () {
            var url = '$bar';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: '$bar',
                    type: '^'
                }
            });
        });

        it('should parse compartment/search using GET', function () {
            var url = 'Foo/123-a/Bar?foo=bar';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: 'search',
                    type: 'Bar',
                    parameters: {
                        foo: 'bar'
                    }
                }
            });
        });

        it('should parse compartment/search using GET when parameter includes DSTU1 operators (>)', function () {
            var url = 'Foo/123-a/Bar?foo=>bar';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: 'search',
                    type: 'Bar',
                    parameters: {
                        foo: '>bar'
                    }
                }
            });
        });

        it('should parse compartment/search using GET when parameter includes DSTU1 operators (>=)', function () {
            var url = 'Foo/123-a/Bar?foo=>=bar';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: 'search',
                    type: 'Bar',
                    parameters: {
                        foo: '>=bar'
                    }
                }
            });
        });

        it('should parse compartment/read using GET', function () {
            var url = 'Foo/123-a/Bar/456';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: 'read',
                    type: 'Bar',
                    id: '456'
                }
            });
        });

        it('should parse compartment/transaction', function () {
            var url = 'Foo/123-a';
            var method = 'POST';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: 'transaction',
                    type: '^'
                }
            });
        });

        it('should parse GET operation with base URL expressed as regex', function () {
            var url = 'foo';

            var reqForOrg = function(org) {

                var urlWithOrg = '/vault/v1/' + org + '/fhir/Foo/123-a';

                return {
                    method: 'GET',
                    protocol: 'https',
                    originalUrl: urlWithOrg,
                    headers: {host: 'fubar.com'}
                };
            };

            options.base = {
                regexString: '^https://fubar.(?:thirdparty.nhs.uk|com)/vault/v1/\\w\\d{5}/fhir'
            };

            var result_Z99999 = lib.parse(reqForOrg('Z99999'), options);
            var result_A12345 = lib.parse(reqForOrg('A12345'), options);

            should.exist(result_Z99999);
            result_Z99999.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: 'https://fubar.com/vault/v1/Z99999/fhir',
                    op: 'read',
                    type: 'Foo',
                    id: '123-a'
                }
            });

            should.exist(result_A12345);
            result_A12345.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: 'https://fubar.com/vault/v1/A12345/fhir',
                    op: 'read',
                    type: 'Foo',
                    id: '123-a'
                }
            });
        });

        it('should parse system conformance with base URL expressed as regex', function () {
            var url = 'foo';

            var reqForOrg = function(org) {

                var urlWithOrg = '/vault/v1/' + org + '/fhir';

                return {
                    method: 'GET',
                    protocol: 'https',
                    originalUrl: urlWithOrg,
                    headers: {host: 'fubar.com'}
                };
            };

            options.base = {
                regexString: '^https://fubar.com/vault/v1/\\w\\d{5}/fhir'
            };

            var result = lib.parse(reqForOrg('Z99999'), options);
            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: 'https://fubar.com/vault/v1/Z99999/fhir',
                    op: 'conformance',
                    type: '^'
                }
            });
        });

        it('should parse instance/_tags using POST', function () {
            var url = 'Foo/123-a/_tags';
            var method = 'POST';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: '_tags',
                    type: 'Foo',
                    id: '123-a'
                }
            });
        });

        it('should parse instance/_tags/_delete using POST', function () {
            var url = 'Foo/123-a/_tags/_delete';
            var method = 'POST';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123-a'
                },
                action: {
                    base: options.base,
                    op: '_tags/_delete',
                    type: 'Foo',
                    id: '123-a'
                }
            });
        });

        it('should throw an error if req undefined', function () {
            var fn = function () {
                lib.parse();
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if req.originalUrl undefined', function () {
            var req = {};

            var fn = function () {
                lib.parse(req);
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if req.originalUrl is not a string', function () {
            var req = {
                originalUrl: 123
            };

            var fn = function () {
                lib.parse(req);
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if req.method undefined', function () {
            var req = {
                originalUrl: '123-a'
            };

            var fn = function () {
                lib.parse(req);
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if req.method is not a string', function () {
            var req = {
                originalUrl: '123-a',
                method: 123
            };

            var fn = function () {
                lib.parse(req);
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if options undefined', function () {
            var req = {
                originalUrl: '123-a',
                method: 'GET'
            };

            var fn = function () {
                lib.parse(req);
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if options.base undefined', function () {
            var req = {
                originalUrl: '123-a',
                method: 'GET'
            };

            var options = {};

            var fn = function () {
                lib.parse(req, options);
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if options.base is not a string', function () {
            var req = {
                originalUrl: '123-a',
                method: 'GET'
            };

            var options = {
                base: 123
            };

            var fn = function () {
                lib.parse(req, options);
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if options.base.regexString defined but is not a string', function () {
            var req = {
                originalUrl: '123-a',
                method: 'GET'
            };

            var options = {
                base: {
                    regexString: 123
                }
            };

            var fn = function () {
                lib.parse(req, options);
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if protocol is not specified', function () {
            var req =  {
                method: 'GET',
                originalUrl: '/foo/fhir/',
                headers: {host : 'fubar.com'}
            };

            try {
                lib.parse(req, options);
                throw new Error('error not thrown');
            }
            catch(err) {
                expect(err).to.exist;
                expect(err.message).to.equal('request protocol not defined');
            }
        });

        it('should throw an error if protocol specified is not valid', function () {
            var req =  {
                method: 'GET',
                protocol: 'ftp',
                originalUrl: '/foo/fhir/',
                headers: {host : 'fubar.com'}
            };

            try {
                lib.parse(req, options);
                throw new Error('error not thrown');
            }
            catch(err) {
                expect(err).to.exist;
                expect(err.message).to.equal('request protocol not valid');
            }
        });

        it('should throw an error if options regex does not match request URL', function () {
            var url = 'foo';

            var reqForOrg = function (org) {

                var urlWithOrg = '/vault/v1/' + org + '/fhir/Foo/123-a';

                return {
                    method: 'GET',
                    protocol: 'https',
                    originalUrl: urlWithOrg,
                    headers: {host: 'fubar.com'}
                };
            };

            options.base = {
                regexString: '^https://fubar.com/vault/v1/\\w\\d{5}/fhir'
            };

            try {
                var result = lib.parse(reqForOrg('12345A'), options);
                throw new Error('error not thrown');
            }
            catch(err) {
                expect(err).to.exist;
                expect(err.message).to.equal('request source does not match options');
            }

        });

        it('should support proxied request headers', function () {
            var req =  {
                method: 'GET',
                protocol: 'http',
                originalUrl: '/some/other/path',
                headers: {host : 'fubar.com',
                    'x-forwarded-proto': 'https',
                    'x-forwarded-uri': '/foo/fhir/'}
            };

            var result = lib.parse(req, options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'conformance',
                    type: '^'
                }
            });
        });

        it('should reject spoofed headers', function() {
            var req =  {
                method: 'GET',
                protocol: 'http',
                originalUrl: '/some/other/path',
                headers: {host : 'fubar.com',
                    'x-forwarded-proto': 'https',
                    'x-forwarded-uri': 'Bar?a=11&x' + '/Foo/678'}
            };

            try {
                lib.parse(req, options);
                throw new Error('error not thrown');
            }
            catch(err) {
                expect(err).to.exist;
                expect(err.message).to.equal('request source does not match options');
            }
        });
    });
});