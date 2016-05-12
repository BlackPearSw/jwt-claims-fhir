const WILDCARD = '*';
const SCOPE_SEPARATOR = '/';
const ACTION_SEPARATOR = ':';
const LIST_SEPARATOR = ',';

function coerceToArray(value){
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

    function isValid(claim){
        if (typeof(claim) !== 'string'){
            return false;
        }

        return claim.match(/^[A-Za-z]+\/[A-Za-z0-9,*]+$/);
    }

    function unpack(item){
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

    if (claims[0] === WILDCARD){
        return {
            authorised: true,
            claimsUsed: [
                claims[0]
            ]
        }
    }

    return claims
        .filter(isValid)
        .map(unpack)
        .reduce(evaluateClaim, initialOutcome);
}

function authoriseAction(action, claims) {
    function checkPreconditions() {
        if (!action) {
            throw new Error('action must not be undefined');
        }

        if (!action.op) {
            throw new Error('action.op must be defined');
        }

        if (typeof(action.op) !== 'string') {
            throw new Error('action.op must be a string');
        }

        if (!action.type) {
            throw new Error('action.type must be defined');
        }

        if (typeof(action.type) !== 'string') {
            throw new Error('action.type must be a string');
        }
    }

    function applyDefaults() {
        if (claims) {
            claims = Array.isArray(claims) ? claims : [claims];
        } else {
            claims = [];
        }
    }

    function isValid(claim){
        if (typeof(claim) !== 'string'){
            return false;
        }

        return claim.match(/^[$A-Za-z0-9,*]+:[A-Za-z,*]+$/);
    }

    function unpack(claim){
        var tk = claim.split(ACTION_SEPARATOR);
        return {
            op: tk[0],
            type: tk[1]
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

    function evaluateClaim(outcome, claim) {
        function isAuthorisedAction(action, claim) {
            function isAuthorisedResource() {
                if (claim.type === WILDCARD) {
                    return true;
                }

                if (action.type === claim.type) {
                    return true;
                }

                return false;
            }

            function isAuthorisedOperation() {
                if (claim.op === WILDCARD) {
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
    applyDefaults();

    return claims
        .filter(isValid)
        .map(unpack)
        .reduce(expandClaimByType, [])
        .reduce(expandClaimByOperation, [])
        .reduce(evaluateClaim, initialOutcome);
}

function authorise() {
    this.access = function(scope, claims){
        this.isAuthorised = authoriseAccess(scope, claims).authorised;
        return this;
    };

    this.action = function(action, claims){
        this.isAuthorised = authoriseAction(action, claims).authorised;
        return this;
    };
}

module.exports.authorise = new authorise();