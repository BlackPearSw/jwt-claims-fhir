var lib = require('../lib/claims');

var should = require('chai').should();
var expect = require('chai').expect;

describe('claims', function () {
    describe('authorise', function () {

        var scope_claims;
        var action_claims;

        beforeEach(function () {
            scope_claims = [
                'Foo/12345'
            ];

            action_claims = [
                'read:Foo',
                'read:Bar'
            ];
        });

        it('should support method chaining', function () {
            //claims made in javascript web token
            var scope_claims = ['*'];
            var action_claims = ['read:Foo', 'read:Bar'];

            //scope and action to evaluate
            var scope = '*';
            var action = {op: 'read', type: 'Bar'};

            var result = lib
                .authorise()
                .access(scope, scope_claims)
                .action(action, action_claims)
                .isAuthorised;

            should.exist(result);
            result.should.equal(true);
        });

        describe('access', function () {
            var root_scope;
            var cmp_scope;
            var claims;

            beforeEach(function () {
                root_scope = '*';

                cmp_scope = {
                    cmp: 'Foo',
                    id: '12345'
                };

                claims = [
                    'Foo/12345',
                    'Bar/54321'
                ];
            });

            it('should exist', function () {
                should.exist(lib.authorise().access);
            });

            it('should be a function', function () {
                lib.authorise().access.should.be.a('function');
            });

            it('should throw an error if scope undefined', function () {
                var fn = function () {
                    lib.authorise().access();
                };

                expect(fn).to.throw(Error);
            });

            describe('when root scope', function () {
                it('should authorise access when wildcard claim', function () {
                    var claim = '*';

                    var result = lib.authorise().access(root_scope, claim);

                    should.exist(result);
                    result.isAuthorised.should.equal(true);
                });

                it('should not authorise access when compartment claim', function () {
                    var claim = 'Foo/*';

                    var result = lib.authorise().access(root_scope, claim);

                    should.exist(result);
                    result.isAuthorised.should.equal(false);
                });
            });

            describe('when compartment scope', function () {
                it('should throw an error if scope.cmp undefined', function () {
                    var fn = function () {
                        lib.authorise().access({});
                    };

                    expect(fn).to.throw(Error);
                });

                it('should throw an error if scope.cmp not a string', function () {
                    var fn = function () {
                        lib.authorise().access({cmp: 1});
                    };

                    expect(fn).to.throw(Error);
                });

                it('should throw an error if compartment.id undefined', function () {
                    var fn = function () {
                        lib.authorise().access({cmp: 'Foo'});
                    };

                    expect(fn).to.throw(Error);
                });

                it('should throw an error if scope.id not a string', function () {
                    var fn = function () {
                        lib.authorise().access({cmp: 'Foo', id: 123});
                    };

                    expect(fn).to.throw(Error);
                });

                it('should handle an array of claims', function () {
                    var result = lib.authorise().access(cmp_scope, claims);

                    should.exist(result);
                    result.isAuthorised.should.equal(true);
                });

                it('should handle a single claim', function () {
                    var result = lib.authorise().access(cmp_scope, claims[0]);

                    should.exist(result);
                    result.isAuthorised.should.equal(true);
                });

                it('should handle no claims', function () {
                    var result = lib.authorise().access(cmp_scope);

                    should.exist(result);
                    result.isAuthorised.should.equal(false);
                });

                it('should authorise access when resource and id match', function () {
                    var result = lib.authorise().access(cmp_scope, claims[0]);

                    should.exist(result);
                    result.isAuthorised.should.equal(true);
                });

                it('should not authorise access when resource does not match', function () {
                    var claim = 'Bar/12345';

                    var result = lib.authorise().access(cmp_scope, claim);

                    should.exist(result);
                    result.isAuthorised.should.equal(false);
                });

                it('should not authorise access when id does not match', function () {
                    var claim = 'Foo/98765';

                    var result = lib.authorise().access(cmp_scope, claim);

                    should.exist(result);
                    result.isAuthorised.should.equal(false);
                });

                it('should authorise access for wildcard compartment', function () {
                    var claim = '*';

                    var result = lib.authorise().access(cmp_scope, claim);

                    should.exist(result);
                    result.isAuthorised.should.equal(true);
                });

                it('should authorise access for wildcard id ', function () {
                    var claim = claims[0];
                    claim.id = '*';

                    var result = lib.authorise().access(cmp_scope, claims[0]);

                    should.exist(result);
                    result.isAuthorised.should.equal(true);
                });
            });
        });

        describe('action', function () {
            var action;
            var claims;

            beforeEach(function () {
                action = {
                    op: 'read',
                    type: 'Foo'
                };

                claims = [
                    'read:Foo',
                    'read:Bar'
                ];
            });

            it('should exist', function () {
                should.exist(lib.authorise().action);
            });

            it('should be a function', function () {
                lib.authorise().action.should.be.a('function');
            });

            it('should throw an error if action not present', function () {
                var fn = function () {
                    lib.authorise().action();
                };

                expect(fn).to.throw(Error);
            });
            
            it('should throw an error if action.op not a string', function () {
                var fn = function () {
                    lib.authorise().action({op: 1});
                };

                expect(fn).to.throw(Error);
            });

            it('should throw an error if action.type not a string', function () {
                var fn = function () {
                    lib.authorise().action({op: 'read', type: 123});
                };

                expect(fn).to.throw(Error);
            });

            it('should handle an array of claims', function () {
                var result = lib.authorise().action(action, claims);

                should.exist(result);
                result.isAuthorised.should.equal(true);
            });

            it('should handle a single claim', function () {
                var result = lib.authorise().action(action, claims[0]);

                should.exist(result);
                result.isAuthorised.should.equal(true);
            });

            it('should handle no claims', function () {
                var result = lib.authorise().action(action);

                should.exist(result);
                result.isAuthorised.should.equal(false);
            });

            it('should not authorise a wildcard claim if the action does not contain an op', function () {
                var result = lib.authorise().action({base: 'https://foobar', type: 'Foo'}, ['*:*']);

                should.exist(result);
                result.isAuthorised.should.equal(false);
            });

            it('should not authorise a wildcard claim if the action does not contain a type', function () {
                var result = lib.authorise().action({base: 'https://foobar', op: 'read'}, ['*:*']);

                should.exist(result);
                result.isAuthorised.should.equal(false);
            });

            it('should handle a claim when multiple resources defined as csv', function () {
                var claim = 'read:Bar,Foo';

                var result = lib.authorise().action(action, claim);

                should.exist(result);
                result.isAuthorised.should.equal(true);
            });

            it('should handle a claim when multiple ops defined as csv', function () {
                var claim = 'read,update:Foo';

                var result = lib.authorise().action(action, claim);

                should.exist(result);
                result.isAuthorised.should.equal(true);
            });

            it('should authorise action when resource and operation match', function () {
                var claim = claims[0];

                var result = lib.authorise().action(action, claim);

                should.exist(result);
                result.isAuthorised.should.equal(true);
            });

            it('should not authorise action when type does not match', function () {
                var claim = 'read:Bar';

                var result = lib.authorise().action(action, claim);

                should.exist(result);
                result.isAuthorised.should.equal(false);
            });

            it('should ignore invalid claim [claim.type undefined]', function () {
                var claim = 'read:';

                var result = lib.authorise().action(action, claim);

                should.exist(result);
                result.isAuthorised.should.equal(false);
            });

            it('should ignore invalid claim [not a string]', function () {
                var claim = 123;

                var result = lib.authorise().action(action, claim);

                should.exist(result);
                result.isAuthorised.should.equal(false);
            });

            it('should not authorise action when operation does not match', function () {
                var claim = 'create:Foo';

                var result = lib.authorise().action(action, claim);

                should.exist(result);
                result.isAuthorised.should.equal(false);
            });

            it('should authorise action for wildcard resource', function () {
                var claim = 'read:*';

                var result = lib.authorise().action(action, claim);

                should.exist(result);
                result.isAuthorised.should.equal(true);
            });

            it('should authorise action for wildcard operation', function () {
                var claim = '*:Foo';

                var result = lib.authorise().action(action, claim);

                should.exist(result);
                result.isAuthorised.should.equal(true);
            });
        });

    });
});