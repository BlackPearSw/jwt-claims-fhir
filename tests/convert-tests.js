var lib = require('../lib/convert');

var should = require('chai').should();

describe('convert', function () {
    describe('toSMARTonFHIRscopes', function () {
        it('should exist', function () {
            should.exist(lib.convert().toSMARTonFHIRscopes);
        });

        it('should be a function', function () {
            lib.convert().toSMARTonFHIRscopes.should.be.a('function');
        });

        it('should return empty array if no claims provided', function () {
            lib.convert()
                .toSMARTonFHIRscopes()
                .should.be.deep.equal([]);
        });

        it('should return empty array if a fhir_scp is defined', function () {
            var claims = {
                fhir_scp: 'Foo/123',
                fhir_act: '*:*'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal([]);
        });

        it('should convert wildcard op', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: '*:Foo'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/Foo.*']);
        });

        it('should convert wildcard type', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: 'read:*'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/*.read']);
        });

        it('should convert wildcard op AND type', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: '*:*'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/*.*']);
        });

        it('should convert defined claim', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: 'read:Foo'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/Foo.read']);
        });

        it('should convert array of claims', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: ['read:Foo', 'update:Foo', 'read:Bar']
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/Foo.read', 'user/Foo.write', 'user/Bar.read']);
        });

        it('should convert read op to read permission', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: 'read:Foo'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/Foo.read']);
        });

        it('should convert vread op to read permission', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: 'vread:Foo'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/Foo.read']);
        });

        it('should convert update op to write permission', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: 'update:Foo'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/Foo.write']);
        });

        it('should convert delete op to write permission', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: 'delete:Foo'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/Foo.write']);
        });

        it('should convert history op to read permission', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: 'history:Foo'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/Foo.read']);
        });

        it('should convert create op to write permission', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: 'create:Foo'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/Foo.write']);
        });

        it('should convert search op to read permission', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: 'search:Foo'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/Foo.read']);
        });

        it('should ignore conformance op', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: 'conformance:^'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal([]);
        });

        it('should ignore transaction op', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: 'transaction:^'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal([]);
        });

        it('should ignore unknown op', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: '$bar:Foo'
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal([]);
        });

        it('should convert unknown ops defined in options', function () {
            var options = {
                read: ['$bar'],
                write: ['$rab'],
                '*': ['$root']
            };

            var claims = {
                fhir_scp: '*',
                fhir_act: ['$bar:Foo', '$rab:Foo', '$root:Bar']
            };

            lib.convert(options)
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/Foo.read', 'user/Foo.write', 'user/Bar.*']);
        });

        it('should dedupe duplicate permissions', function () {
            var claims = {
                fhir_scp: '*',
                fhir_act: ['read:Foo', 'vread:Foo']
            };

            lib.convert()
                .toSMARTonFHIRscopes(claims)
                .should.be.deep.equal(['user/Foo.read']);
        });
    });
});