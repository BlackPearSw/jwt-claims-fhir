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
        base: config.base
    };

    var parameters = parseParameters(req.query);
    if (parameters){
        result.parameters = parameters;
    }

    var path = req.pathname || '';
    var tk = path.split('/');
    tk.shift();

    if (method === 'GET') {
        if (path.match(/^\/$/) && result.parameters) {
            result.op = 'search';
            return result;
        }

        if (path.match(/^\/$/)) {
            result.op = 'conformance';
            return result;
        }

        if (path.match(/^\/metadata$/)) {
            result.op = 'conformance';
            return result;
        }

        //system history
        if (path.match(/^\/_history$/)) {
            result.op = 'history';
            return result;
        }

        //type history
        if (path.match(/^\/\w+\/_history$/)) {
            result.op = 'history';
            result.type = tk[0];
            return result;
        }

        //instance history
        if (path.match(/^\/\w+\/\w+\/_history$/)) {
            result.op = 'history';
            result.type = tk[0];
            result.id = tk[1];
            return result;
        }

        //vread
        if (path.match(/^\/\w+\/\w+\/_history\/\w+$/)) {
            result.op = 'vread';
            result.type = tk[0];
            result.id = tk[1];
            result.vid = tk[3];
            return result;
        }

        //system operation
        if (path.match(/^\/\$\w+$/)) {
            result.op = tk[0];
            return result;
        }

        //type operation
        if (path.match(/^\/\w+\/\$\w+$/)) {
            result.op = tk[1];
            result.type = tk[0];
            return result;
        }

        //instance operation
        if (path.match(/^\/\w+\/\w+\/\$\w+$/)) {
            result.op = tk[2];
            result.type = tk[0];
            result.id = tk[1];
            return result;
        }

        if (path.match(/^\/\w+$/)) {
            result.op = 'search';
            result.type = tk[0];
            return result;
        }

        if (path.match(/^\/\w+\/\w+$/)) {
            result.op = 'read';
            result.type = tk[0];
            result.id = tk[1];
            return result;
        }
    }

    if (method === 'PUT') {
        if (path.match(/^\/\w+$/) && result.parameters) {
            result.op = 'update';
            result.type = tk[0];
            return result;
        }

        if (path.match(/^\/\w+\/\w+$/)) {
            result.op = 'update';
            result.type = tk[0];
            result.id = tk[1];
            return result;
        }
    }

    if (method === 'DELETE') {
        if (path.match(/^\/\w+$/) && result.parameters) {
            result.op = 'delete';
            result.type = tk[0];
            return result;
        }

        if (path.match(/^\/\w+\/\w+$/)) {
            result.op = 'delete';
            result.type = tk[0];
            result.id = tk[1];
            return result;
        }
    }

    if (method === 'POST') {
        if (path.match(/^\/$/) && result.parameters) {
            result.op = 'search';
            return result;
        }

        if (path.match(/^\/$/)) {
            result.op = 'batch_transaction';
            return result;
        }

        if (path.match(/^\/\w+\/_search$/)) {
            result.op = 'search';
            result.type = tk[0];
            return result;
        }

        //system operation
        if (path.match(/^\/\$\w+$/)) {
            result.op = tk[0];
            return result;
        }

        //type operation
        if (path.match(/^\/\w+\/\$\w+$/)) {
            result.op = tk[1];
            result.type = tk[0];
            return result;
        }

        //instance operation
        if (path.match(/^\/\w+\/\w+\/\$\w+$/)) {
            result.op = tk[2];
            result.type = tk[0];
            result.id = tk[1];
            return result;
        }

        //type create
        if (!result.op) {
            result.op = 'create';
            result.type = tk[0];
            return result;
        }
    }

    return;
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

    return {
        scope: '*',
        action: parseAction(url.parse(fhirUrl), req.method, options)
    };
}

module.exports.parse = parse;