const WILDCARD = '*';
const SCOPE_SEPARATOR = '/';
const ACTION_SEPARATOR = ':';
const LIST_SEPARATOR = ',';

function coerceToArray(value) {
    if (value) {
        value = Array.isArray(value) ? value : [value];
    } else {
        value = [];
    }

    return value;
}

function authoriseAccess(scope, claims) {
    function checkPreconditions() {
        if (!scope) {
            throw new Error('scope undefined');
        }

        if (scope !== WILDCARD) {
            if (!scope.cmp) {
                throw new Error('scope.cmp must be defined');
            }

            if (typeof(scope.cmp) !== 'string') {
                throw new Error('scope.cmp must be a string');
            }

            if (!scope.id) {
                throw new Error('scope.id must be defined');
            }

            if (typeof(scope.id) !== 'string') {
                throw new Error('scope.id must be a string');
            }
        }
    }

    function applyDefaults() {
        claims = coerceToArray(claims);
    }

    function hasWildcard(claims) {
        return claims.reduce(function(state, claim){
            if (state) return state;

            return (claim === WILDCARD);
        }, false);
    }

    function isValid(claim) {
        if (typeof(claim) !== 'string') {
            return false;
        }

        return claim.match(/^[A-Za-z]+\/[A-Za-z0-9,*]+$/);
    }

    function unpack(item) {
        var tk = item.split(SCOPE_SEPARATOR);
        return {
            cmp: tk[0],
            id: tk[1]
        }
    }

    function evaluateClaim(outcome, claim) {
        function isAuthorisedAccess(compartment, claim) {
            function isAuthorisedResource() {
                if (claim.cmp === WILDCARD) {
                    return true;
                }

                if (compartment.cmp === claim.cmp) {
                    return true;
                }

                return false;
            }

            function isAuthorisedId() {
                if (claim.id === WILDCARD) {
                    return true;
                }

                if (compartment.id === claim.id) {
                    return true;
                }

                return false;
            }

            return isAuthorisedResource() && isAuthorisedId();
        }

        if (isAuthorisedAccess(scope, claim)) {
            outcome.authorised = true;
            outcome.claimsUsed = claim;
        }

        return outcome;
    }

    var initialOutcome = {
        authorised: false,
        claimsUsed: []
    };

    checkPreconditions();
    applyDefaults();


    if (hasWildcard(claims)) {
        return {
            authorised: true,
            claimsUsed: ['*']
        }
    }

    return claims
        .filter(isValid)
        .map(unpack)
        .reduce(evaluateClaim, initialOutcome);
}

function deserialiseClaims(claims){
    function applyDefaults() {
        if (claims) {
            claims = Array.isArray(claims) ? claims : [claims];
        } else {
            claims = [];
        }
    }

    function isValid(claim) {
        if (typeof(claim) !== 'string') {
            return false;
        }

        return claim.match(/^[$A-Za-z0-9,*_\/]+:[A-Za-z,*^]+$/);
    }

    function unpack(claim) {
        var tk = claim.split(ACTION_SEPARATOR);
        return {
            op: tk[0],
            type: tk[1]
        }
    }

    function R4compatibility(claim){
        switch (claim.op){
            case 'capabilities':
                return {
                    op: 'conformance',
                    type: claim.type
                }
            default:
                return claim;
        }
    }

    function expandClaimByType(expansion, claim) {
        claim.type
            .split(LIST_SEPARATOR)
            .map(function (type) {
                expansion.push({
                    op: claim.op,
                    type: type.trim()
                });
            });
        return expansion;
    }

    function expandClaimByOperation(expansion, claim) {
        claim.op
            .split(LIST_SEPARATOR)
            .map(function (op) {
                expansion.push({
                    op: op.trim(),
                    type: claim.type
                });
            });
        return expansion;
    }

    applyDefaults();

    return claims
        .filter(isValid)
        .map(unpack)
        .map(R4compatibility)
        .reduce(expandClaimByType, [])
        .reduce(expandClaimByOperation, []);
}

function authoriseAction(action, claims) {
    function checkPreconditions() {
        if (!action) {
            throw new Error('action must not be undefined');
        }

        if (action.op) {
            if (typeof(action.op) !== 'string') {
                throw new Error('action.op must be a string');
            }
        }

        if (action.type) {
            if (typeof(action.type) !== 'string') {
                throw new Error('action.type must be a string');
            }
        }
    }

    function evaluateClaim(outcome, claim) {
        function isAuthorisedAction(action, claim) {
            function isAuthorisedResource() {
                if ((claim.type === WILDCARD) && action.type) {
                    return true;
                }

                if (action.type === claim.type) {
                    return true;
                }

                return false;
            }

            function isAuthorisedOperation() {
                if ((claim.op === WILDCARD) && action.op) {
                    return true;
                }

                if (action.op === claim.op) {
                    return true;
                }

                return false;
            }

            return isAuthorisedOperation() && isAuthorisedResource();
        }

        if (isAuthorisedAction(action, claim)) {
            outcome.authorised = true;
            outcome.claimsUsed = claim;
        }
        return outcome;
    }

    var initialOutcome = {
        authorised: false,
        claimsUsed: []
    };

    checkPreconditions();

    return deserialiseClaims(claims)
        .reduce(evaluateClaim, initialOutcome);
}

function authorise() {
    this.isAuthorised = null;

    this.access = function (scope, claims) {
        if (this.isAuthorised === false) {
            return this;
        }
        else {
            this.isAuthorised = authoriseAccess(scope, claims).authorised;
            return this;
        }
    };

    this.action = function (action, claims) {
        if (this.isAuthorised === false) {
            return this;
        }
        else {
            this.isAuthorised = authoriseAction(action, claims).authorised;

            return this;
        }
    };
}

module.exports.authorise = function () {
    return new authorise();
};

module.exports.deserialiseClaims = deserialiseClaims;