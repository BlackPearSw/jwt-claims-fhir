var lib = require('../lib/parser');

var should = require('chai').should();
var expect = require('chai').expect;

describe('parser', function () {

    var options;

    beforeEach(function () {
        options = {
            base: 'https://fubar/foo/fhir'
        }
    });

    function req(url, method) {
        return {
            method: method,
            url: 'https://fubar/foo/fhir/' + url
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
            var url = 'the/quick/brown/fox';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base
                }
            });
        });

        it('should parse instance/read', function () {
            var url = 'Foo/123';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'read',
                    type: 'Foo',
                    id: '123'
                }
            });
        });

        it('should parse instance/vread', function () {
            var url = 'Foo/123/_history/1';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'vread',
                    type: 'Foo',
                    id: '123',
                    vid: '1'
                }
            });
        });

        it('should parse instance/update', function () {
            var url = 'Foo/123';
            var method = 'PUT';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'update',
                    type: 'Foo',
                    id: '123'
                }
            });
        });

        it('should parse type/conditional-update', function () {
            var url = 'Foo?bar=123';
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
                        bar: '123'
                    }
                }
            });
        });

        it('should parse instance/delete', function () {
            var url = 'Foo/123';
            var method = 'DELETE';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'delete',
                    type: 'Foo',
                    id: '123'
                }
            });
        });

        it('should parse type/conditional-delete', function () {
            var url = 'Foo?bar=123';
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
                        bar: '123'
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

        //TODO: Compartment search

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


        it('should parse system/conformance', function () {
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


        it('should parse system/batch_transaction', function () {
            var url = '';
            var method = 'POST';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'batch_transaction',
                    type: '^'
                }
            });
        });

        it('should parse instance/history', function () {
            var url = 'Foo/123/_history';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: 'history',
                    type: 'Foo',
                    id: '123'
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
            var url = 'Foo/123/$bar';
            var method = 'POST';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: '$bar',
                    type: 'Foo',
                    id: '123'
                }
            });
        });

        it('should parse instance/$operation using GET', function () {
            var url = 'Foo/123/$bar';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: '*',
                action: {
                    base: options.base,
                    op: '$bar',
                    type: 'Foo',
                    id: '123'
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
            var url = 'Foo/123/Bar?foo=bar';
            var method = 'GET';

            var result = lib.parse(req(url, method), options);

            should.exist(result);
            result.should.deep.equal({
                scope: {
                    cmp: 'Foo',
                    id: '123'
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

        it('should throw an error if req undefined', function () {
            var fn = function () {
                lib.parse();
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if req.url undefined', function () {
            var req = {};

            var fn = function () {
                lib.parse(req);
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if req.url is not a string', function () {
            var req = {
                url: 123
            };

            var fn = function () {
                lib.parse(req);
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if req.method undefined', function () {
            var req = {
                url: '123'
            };

            var fn = function () {
                lib.parse(req);
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if req.method is not a string', function () {
            var req = {
                url: '123',
                method: 123
            };

            var fn = function () {
                lib.parse(req);
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if options undefined', function () {
            var req = {
                url: '123',
                method: 'GET'
            };

            var fn = function () {
                lib.parse(req);
            };

            expect(fn).to.throw(Error);
        });

        it('should throw an error if options.base undefined', function () {
            var req = {
                url: '123',
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
                url: '123',
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
    });
});