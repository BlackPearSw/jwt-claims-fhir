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
                value: tk.slice(1).join('=')
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

function parseAction(decodedUrls, method, config) {
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
            base: decodedUrls.baseUrl
        },
        scope: ALL
    };

    var req = url.parse(decodedUrls.fhirUrl);

    var parameters = parseParameters(req.query);
    if (parameters){
        result.action.parameters = parameters;
    }

    var path = req.pathname || '';
    var tk = path.split('/');
    tk.shift();

    //set scope for compartment operations
    if (path.match(/^\/\w+\/[A-Za-z0-9\-\.]{1,64}\/[^_$].*$/)) {
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
        if (path.match(/^\/\w+\/[A-Za-z0-9\-\.]{1,64}\/_history$/)) {
            setInstanceScope();
            result.action.op = HISTORY;
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }

        //vread
        if (path.match(/^\/\w+\/[A-Za-z0-9\-\.]{1,64}\/_history\/[A-Za-z0-9\-\.]{1,64}$/)) {
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
        if (path.match(/^\/\w+\/[A-Za-z0-9\-\.]{1,64}\/\$\w+$/)) {
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

        if (path.match(/^\/\w+\/[A-Za-z0-9\-\.]{1,64}$/)) {
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

        if (path.match(/^\/\w+\/[A-Za-z0-9\-\.]{1,64}$/)) {
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

        if (path.match(/^\/\w+\/[A-Za-z0-9\-\.]{1,64}$/)) {
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

        if (path.match(/^\/\w+\/[A-Za-z0-9\-\.]{1,64}$/)) {
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
        if (path.match(/^\/\w+\/[A-Za-z0-9\-\.]{1,64}\/\$\w+$/)) {
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
        if (path.match(/^\/\w+\/[A-Za-z0-9\-\.]{1,64}\/_tags$/)) {
            setInstanceScope();
            result.action.op = '_tags';
            result.action.type = tk[0];
            result.action.id = tk[1];
            return result;
        }

        //instance _tags/_delete
        if (path.match(/^\/\w+\/[A-Za-z0-9\-\.]{1,64}\/_tags\/_delete$/)) {
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

    function decodeReqUrl() {

        function getRequestUrl() {
            var protocol = req.headers['x-forwarded-proto'] || req.protocol;

            if (!protocol) {
                throw new Error('request protocol not defined');
            }

            if ((protocol !== 'http') && (protocol !== 'https')) {
                throw new Error('request protocol not valid');
            }

            var uri = req.headers['x-forwarded-uri'] || req.originalUrl;

            return protocol + "://" + req.headers.host + uri;
        }

        function validateRequestUrl(reqUrl) {
            if (options.base.regexString) {

                // Escape '.' & '/' for regex.  When '.' is escaped in a regexString in config file, the config module
                // crashes when trying to JSON.parse the file.
                var escapedString = options.base.regexString.replace(/[./]/g, '\\$&');

                var regex = new RegExp('(' + escapedString + ')(.*)');
                var match = reqUrl.match(regex);

                // match[2] can be null for conformance statement
                if (match && match[1]) {
                    return {
                        baseUrl: match[1],
                        fhirUrl: match[2]
                    }
                }
                else {
                    throw new Error('request source does not match options');
                }

            }
            else {
                if (options.base !== reqUrl.substring(0,options.base.length)) {
                    throw new Error('request source does not match options');
                }

                return {
                    baseUrl: options.base,
                    fhirUrl: reqUrl.substring(options.base.length)
                }

            }
        }

        var reqUrl = getRequestUrl();
        return validateRequestUrl(reqUrl);

    }

    function validateInput(){
        if (!req){
            throw new Error('req undefined');
        }

        if (!req.originalUrl){
            throw new Error('req.originalUrl undefined');
        }

        if (typeof(req.originalUrl) !== 'string'){
            throw new Error('req.originalUrl must be a string');
        }

        if (!req.method){
            throw new Error('req.method undefined');
        }

        if (typeof(req.method) !== 'string'){
            throw new Error('req.method must be a string');
        }

        if (!options){
            throw new Error('options undefined');
        }

        if (!options.base){
            throw new Error('options.base undefined');
        }

        if (options.base.regexString) {
            if (typeof(options.base.regexString) !== 'string') {
                throw new Error('options.base.regexString must be expressed as a string');
            }
        }
        else {
            if (typeof(options.base) !== 'string') {
                throw new Error('options.base must be a string');
            }
        }
    }

    validateInput();

    var decodedUrls = decodeReqUrl();

    return parseAction(decodedUrls, req.method, options);
}

module.exports.parse = parse;