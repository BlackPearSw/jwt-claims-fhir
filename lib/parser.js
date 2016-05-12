var url = require('url');

function parseParameters(query){
    if (!query) {
        return undefined;
    }

    return query
        .split('&')
        .map(function(item){
            var tk = item.split('=');
            return {
                key: tk[0],
                value: tk[1]
            }
        })
        .filter(function(item){
            return item.key !== '_format'
        })
        .reduce(function(prev, item){
            prev = prev ? prev : {};

            if (prev[item.key]){
                prev[item.key] = Array.isArray(prev[item.key]) ? prev[item.key] : [prev[item.key]];
                prev[item.key].push(item.value);
            }
            else {
                prev[item.key] = item.value;
            }

            return prev;
        }, undefined)
}

function parseFormat(query){
    if (!query) {
        return {};
    }

    return query
        .split('&')
        .map(function(item){
            var tk = item.split('=');
            return {
                key: tk[0],
                value: tk[1]
            }
        })
        .filter(function(item){
            return item.key === '_format'
        })
        .shift();
}

function parseAction(req, method, config) {
    var result = {
        action: {
            base: config.base
        },
        scope: '*'
    };

    var parameters = parseParameters(req.query);
    if (parameters){
        result.action.parameters = parameters;
    }

    var path = req.pathname || '';
    var tk = path.split('/');
    tk.shift();

    if (method === 'GET') {
        if (path.match(/^\/$/) && result.action.parameters) {
            result.action.op = 'search';
            result.action.type = '^';
            return result;
        }

        if (path.match(/^\/\w+\/\w+\/\w+$/) && result.action.parameters) {
            result.action.op = 'search';
            result.action.type = tk[2];
            result.scope = {
                cmp: tk[0],
                id: tk[1]
            };
            return result;
        }

        if (path.match(/^\/$/)) {
            result.action.op = 'conformance';
            result.action.type = '^';
            return result;
        }

        if (path.match(/^\/metadata$/)) {
            result.action.op = 'conformance';
            result.action.type = '^';
            return result;
        }

        //system history
        if (path.match(/^\/_history$/)) {
            result.action.op = 'history';
            result.action.type = '^';
            return result;
        }

        //type history
        if (path.match(/^\/\w+\/_history$/)) {
            result.action.op = 'history';
            result.action.type = tk[0];
            return result;
        }

        //instance history
        if (path.match(/^\/\w+\/\w+\/_history$/)) {
            result.action.op = 'history';
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }

        //vread
        if (path.match(/^\/\w+\/\w+\/_history\/\w+$/)) {
            result.action.op = 'vread';
            result.action.type = tk[0];
            result.action.id = tk[1];
            result.action.vid = tk[3];
            return result;
        }

        //system operation
        if (path.match(/^\/\$\w+$/)) {
            result.action.op = tk[0];
            result.action.type = '^';
            return result;
        }

        //type operation
        if (path.match(/^\/\w+\/\$\w+$/)) {
            result.action.op = tk[1];
            result.action.type = tk[0];
            return result;
        }

        //instance operation
        if (path.match(/^\/\w+\/\w+\/\$\w+$/)) {
            result.action.op = tk[2];
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }

        if (path.match(/^\/\w+$/)) {
            result.action.op = 'search';
            result.action.type = tk[0];
            return result;
        }

        if (path.match(/^\/\w+\/\w+$/)) {
            result.action.op = 'read';
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }
    }

    if (method === 'PUT') {
        if (path.match(/^\/\w+$/) && result.action.parameters) {
            result.action.op = 'update';
            result.action.type = tk[0];
            return result;
        }

        if (path.match(/^\/\w+\/\w+$/)) {
            result.action.op = 'update';
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }
    }

    if (method === 'DELETE') {
        if (path.match(/^\/\w+$/) && result.action.parameters) {
            result.action.op = 'delete';
            result.action.type = tk[0];
            return result;
        }

        if (path.match(/^\/\w+\/\w+$/)) {
            result.action.op = 'delete';
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }
    }

    if (method === 'POST') {
        if (path.match(/^\/_search$/)) {
            result.action.op = 'search';
            result.action.type = '^';
            return result;
        }

        if (path.match(/^\/$/)) {
            result.action.op = 'batch_transaction';
            result.action.type = '^';
            return result;
        }

        if (path.match(/^\/\w+\/_search$/)) {
            result.action.op = 'search';
            result.action.type = tk[0];
            return result;
        }

        //system operation
        if (path.match(/^\/\$\w+$/)) {
            result.action.op = tk[0];
            result.action.type = '^';
            return result;
        }

        //type operation
        if (path.match(/^\/\w+\/\$\w+$/)) {
            result.action.op = tk[1];
            result.action.type = tk[0];
            return result;
        }

        //instance operation
        if (path.match(/^\/\w+\/\w+\/\$\w+$/)) {
            result.action.op = tk[2];
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }

        //type create
        if (path.match(/^\/\w+$/)) {
            result.action.op = 'create';
            result.action.type = tk[0];
            return result;
        }
    }

    return result;
}

function parse(req, options) {
    function validateInput(){
        if (! req){
            throw new Error('req undefined');
        }

        if (! req.url){
            throw new Error('req.url undefined');
        }

        if (typeof(req.url) !== 'string'){
            throw new Error('req.url must be a string');
        }

        if (! req.method){
            throw new Error('req.method undefined');
        }

        if (typeof(req.method) !== 'string'){
            throw new Error('req.method must be a string');
        }

        if (! options){
            throw new Error('options undefined');
        }

        if (! options.base){
            throw new Error('req.method undefined');
        }

        if (typeof(options.base) !== 'string'){
            throw new Error('req.method must be a string');
        }
    }

    validateInput();

    var fhirUrl = req.url.substring(options.base.length);

    return parseAction(url.parse(fhirUrl), req.method, options);
}

module.exports.parse = parse;