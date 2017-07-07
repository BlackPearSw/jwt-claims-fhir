var lib = require('./claims');
var _ = require('lodash');

var ALL = '*';
var READ = 'read';
var WRITE = 'write';
var PERMISSIONS = [READ, WRITE, ALL];

function mapToSMARTonFHIRscopes(map){
    return function(claims){
        var scopes =  lib.deserialiseClaims(claims)
            .map(function(claim){
                var permission = map[claim.op];
                if (permission){
                    return 'user/' + claim.type + '.' + permission;
                }
            })
            .filter(function(scope){
                return scope !== undefined;
            });

        return _.uniq(scopes);
    }
}

module.exports.convert = function (options) {
    function validateOptions() {
        options = options || {};
        options.read = options.read || [];
        options.write = options.write || [];
    }

    function makeConfig(){
        var base = {};
        base[READ] = ['read', 'vread', 'history', 'search'];
        base[WRITE] = ['update', 'delete', 'create'];
        base[ALL] = ['*'];
        //'conformance': READ, //ignore as op on root
        //'transaction': WRITE //ignore as op on root
        return base;

    }

    function addUserDefinedOpsToConfig(permission){
        if (options[permission]){
            config[permission] = config[permission].concat(options[permission]);
        }
    }

    function addOpsToMap(permission){
        config[permission].forEach(function(op){
            map[op] = permission;
        });
    }

    validateOptions();

    var config = makeConfig();
    PERMISSIONS.forEach(addUserDefinedOpsToConfig);

    var map = {};
    PERMISSIONS.forEach(addOpsToMap);

    return {
        toSMARTonFHIRscopes: mapToSMARTonFHIRscopes(map)
    }
};