var url = require('url');

const ALL = '*';

//http://hl7.org/fhir/valueset-restful-interaction.html
//L1 codes only
const READ = 'read';
const VREAD = 'vread';
const UPDATE = 'update';
const DELETE = 'delete';
const HISTORY = 'history';
const CREATE = 'create';
const SEARCH = 'search';
// 'validate' TODO: check - is this op?
const CONFORMANCE = 'conformance';
const TRANSACTION = 'transaction';
//operation: Not used - use operation name to allow differentiation

const SYSTEM = '^';

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
    function setInstanceScope() {
        if (result.scope == ALL) {
            result.scope = {
                cmp: tk[0],
                id: tk[1]
            };
        }
    }

    var result = {
        action: {
            base: config.base
        },
        scope: ALL
    };

    var parameters = parseParameters(req.query);
    if (parameters){
        result.action.parameters = parameters;
    }

    var path = req.pathname || '';
    var tk = path.split('/');
    tk.shift();

    //set scope for compartment operations
    if (path.match(/^\/\w+\/\w+\/[^_$].*$/)) {
        setInstanceScope();

        tk.shift();
        tk.shift();
        path = '/' + tk.join('/');
    }

    if (method === 'GET') {
        if (path.match(/^\/$/) && result.action.parameters) {
            result.action.op = SEARCH;
            result.action.type = SYSTEM;
            return result;
        }

        if (path.match(/^\/\w+\/\w+\/\w+$/) && result.action.parameters) {
            result.action.op = SEARCH;
            result.action.type = tk[2];
            return result;
        }

        // If matching service root URL, does not include a trailing slash as specified in
        // https://www.hl7.org/fhir/http.html#general
        if (path.match(/^\/?$/)) {
            result.action.op = CONFORMANCE;
            result.action.type = SYSTEM;
            return result;
        }

        if (path.match(/^\/metadata$/)) {
            result.action.op = CONFORMANCE;
            result.action.type = SYSTEM;
            return result;
        }

        //system history
        if (path.match(/^\/_history$/)) {
            result.action.op = HISTORY;
            result.action.type = SYSTEM;
            return result;
        }

        //type history
        if (path.match(/^\/\w+\/_history$/)) {
            result.action.op = HISTORY;
            result.action.type = tk[0];
            return result;
        }

        //instance history
        if (path.match(/^\/\w+\/\w+\/_history$/)) {
            setInstanceScope();
            result.action.op = HISTORY;
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }

        //vread
        if (path.match(/^\/\w+\/\w+\/_history\/\w+$/)) {
            setInstanceScope();
            result.action.op = VREAD;
            result.action.type = tk[0];
            result.action.id = tk[1];
            result.action.vid = tk[3];
            return result;
        }

        //system operation
        if (path.match(/^\/\$\w+$/)) {
            result.action.op = tk[0];
            result.action.type = SYSTEM;
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
            setInstanceScope();
            result.action.op = tk[2];
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }

        if (path.match(/^\/\w+$/)) {
            result.action.op = SEARCH;
            result.action.type = tk[0];
            return result;
        }

        if (path.match(/^\/\w+\/\w+$/)) {
            setInstanceScope();
            result.action.op = READ;
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }
    }

    if (method === 'PUT') {
        if (path.match(/^\/\w+$/) && result.action.parameters) {
            result.action.op = UPDATE;
            result.action.type = tk[0];
            return result;
        }

        if (path.match(/^\/\w+\/\w+$/)) {
            setInstanceScope();
            result.action.op = UPDATE;
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }
    }

    if (method === 'DELETE') {
        if (path.match(/^\/\w+$/) && result.action.parameters) {
            result.action.op = DELETE;
            result.action.type = tk[0];
            return result;
        }

        if (path.match(/^\/\w+\/\w+$/)) {
            setInstanceScope();
            result.action.op = DELETE;
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }
    }

    if (method === 'POST') {
        if (path.match(/^\/_search$/)) {
            result.action.op = SEARCH;
            result.action.type = SYSTEM;
            return result;
        }

        if (path.match(/^\/$/)) {
            result.action.op = TRANSACTION;
            result.action.type = SYSTEM;
            return result;
        }

        if (path.match(/^\/\w+\/_search$/)) {
            result.action.op = SEARCH;
            result.action.type = tk[0];
            return result;
        }

        if (path.match(/^\/\w+\/\w+$/)) {
            setInstanceScope();
            result.action.op = TRANSACTION;
            result.action.type = SYSTEM;
            return result;
        }

        //system operation
        if (path.match(/^\/\$\w+$/)) {
            result.action.op = tk[0];
            result.action.type = SYSTEM;
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
            setInstanceScope();
            result.action.op = tk[2];
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }

        //type create
        if (path.match(/^\/\w+$/)) {
            result.action.op = CREATE;
            result.action.type = tk[0];
            return result;
        }

        //instance _tags
        if (path.match(/^\/\w+\/\w+\/_tags$/)) {
            setInstanceScope();
            result.action.op = '_tags';
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }

        //instance _tags/_delete
        if (path.match(/^\/\w+\/\w+\/_tags\/_delete$/)) {
            setInstanceScope();
            result.action.op = '_tags/_delete';
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }
    }

    return result;
}

function parse(req, options) {

    function getFhirUrl() {

        function getRequestUrl() {
            var protocol = req.headers['x-forwarded-proto'] || req.protocol;

            if (!protocol) {
                throw new Error('request protocol not defined');
            }

            if ((protocol !== 'http') && (protocol !== 'https')) {
                throw new Error('request protocol not valid');
            }

            var uri = req.headers['x-forwarded-uri'] || req.url;

            return protocol + "://" + req.headers.host + uri;
        }

        function validateRequestUrl(reqUrl) {
            if (options.base !== reqUrl.substring(0,options.base.length)) {
                throw new Error('request source does not match options');
            }
        }

        var reqUrl = getRequestUrl();

        validateRequestUrl(reqUrl);

        return reqUrl.substring(options.base.length);
    }

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
            throw new Error('options.base undefined');
        }

        if (typeof(options.base) !== 'string'){
            throw new Error('options.base must be a string');
        }
    }

    validateInput();

    var fhirUrl = getFhirUrl();

    return parseAction(url.parse(fhirUrl), req.method, options);
}

module.exports.parse = parse;