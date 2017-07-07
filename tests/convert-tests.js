var lib = require('../lib/convert');

var should = require('chai').should();

describe('convert', function () {
    describe('toSMARTonFHIRscopes', function () {
        var claims;

        beforeEach(function () {
            claims = [
                '*:Foo',
                'read:Bar'
            ];
        });

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

        it('should convert wildcard op', function () {
            lib.convert()
                .toSMARTonFHIRscopes('*:Foo')
                .should.be.deep.equal(['user/Foo.*']);
        });

        it('should convert wildcard type', function () {
            lib.convert()
                .toSMARTonFHIRscopes('read:*')
                .should.be.deep.equal(['user/*.read']);
        });

        it('should convert wildcard op AND type', function () {
            lib.convert()
                .toSMARTonFHIRscopes('*:*')
                .should.be.deep.equal(['user/*.*']);
        });

        it('should convert defined claim', function () {
            lib.convert()
                .toSMARTonFHIRscopes('read:Foo')
                .should.be.deep.equal(['user/Foo.read']);
        });

        it('should convert array of claims', function () {
            lib.convert()
                .toSMARTonFHIRscopes(['read:Foo', 'update:Foo', 'read:Bar'])
                .should.be.deep.equal(['user/Foo.read', 'user/Foo.write', 'user/Bar.read']);
        });

        it('should convert read op to read permission', function () {
            lib.convert()
                .toSMARTonFHIRscopes('read:Foo')
                .should.be.deep.equal(['user/Foo.read']);
        });

        it('should convert vread op to read permission', function () {
            lib.convert()
                .toSMARTonFHIRscopes('vread:Foo')
                .should.be.deep.equal(['user/Foo.read']);
        });

        it('should convert update op to write permission', function () {
            lib.convert()
                .toSMARTonFHIRscopes('update:Foo')
                .should.be.deep.equal(['user/Foo.write']);
        });

        it('should convert delete op to write permission', function () {
            lib.convert()
                .toSMARTonFHIRscopes('delete:Foo')
                .should.be.deep.equal(['user/Foo.write']);
        });

        it('should convert history op to read permission', function () {
            lib.convert()
                .toSMARTonFHIRscopes('history:Foo')
                .should.be.deep.equal(['user/Foo.read']);
        });

        it('should convert create op to write permission', function () {
            lib.convert()
                .toSMARTonFHIRscopes('create:Foo')
                .should.be.deep.equal(['user/Foo.write']);
        });

        it('should convert search op to read permission', function () {
            lib.convert()
                .toSMARTonFHIRscopes('search:Foo')
                .should.be.deep.equal(['user/Foo.read']);
        });

        it('should ignore conformance op', function () {
            lib.convert()
                .toSMARTonFHIRscopes('conformance:^')
                .should.be.deep.equal([]);
        });

        it('should ignore transaction op', function () {
            lib.convert()
                .toSMARTonFHIRscopes('transaction:^')
                .should.be.deep.equal([]);
        });

        it('should ignore unknown op', function () {
            lib.convert()
                .toSMARTonFHIRscopes('$bar:Foo')
                .should.be.deep.equal([]);
        });

        it('should convert unknown ops defined in options', function () {
            var options = {
                read: ['$bar'],
                write: ['$rab'],
                '*': ['$root']
            };

            lib.convert(options)
                .toSMARTonFHIRscopes(['$bar:Foo', '$rab:Foo', '$root:Bar'])
                .should.be.deep.equal(['user/Foo.read', 'user/Foo.write', 'user/Bar.*']);
        });

        it('should convert dedupe duplicate permissions', function () {
            lib.convert()
                .toSMARTonFHIRscopes(['read:Foo', 'vread:Foo'])
                .should.be.deep.equal(['user/Foo.read']);
        });
    });
});