// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

var EComponent;
(function(EComponent) {
    EComponent["Net"] = "Net";
    EComponent["Peer"] = "Peer";
    EComponent["Discovery"] = "Discovery";
    EComponent["Monitor"] = "Monitor";
    EComponent["Logger"] = "Logger";
    EComponent["Api"] = "Api";
    EComponent["ALL"] = "Messenger";
})(EComponent || (EComponent = {}));
var EMonOpType;
(function(EMonOpType) {
    EMonOpType["Set"] = "Set";
    EMonOpType["Get"] = "Get";
})(EMonOpType || (EMonOpType = {}));
var EMType;
(function(EMType) {
    EMType["Any"] = "Any";
    EMType["LogMessage"] = "LogMessage";
    EMType["InitialMessage"] = "InitialMessage";
    EMType["DiscoveryResult"] = "DiscoveryResult";
    EMType["DiscoveryEndpointCalled"] = "DiscoveryEndpointCalled";
    EMType["ClientRequest"] = "ClientRequest";
    EMType["ClientResponse"] = "ClientResponse";
    EMType["ClientNotification"] = "ClientNotification";
    EMType["ClientConnectionOpen"] = "ClientConnectionOpen";
    EMType["ClientConnectionClose"] = "ClientConnectionClose";
    EMType["PeerConnectionRequest"] = "PeerConnectionRequest";
    EMType["PeerConnectionAccepted"] = "PeerConnectionAccepted";
    EMType["PeerConnectionOpen"] = "PeerConnectionOpen";
    EMType["PeerConnectionSuccess"] = "PeerConnectionSuccess";
    EMType["PeerConnectionClose"] = "PeerConnectionClose";
    EMType["MonGetRequest"] = "MonGetRequest";
    EMType["MonGetResponse"] = "MonGetResponse";
    EMType["MonSetRequest"] = "MonSetRequest";
    EMType["MonSetResponse"] = "MonSetResponse";
    EMType["MonWatchRequest"] = "MonWatchRequest";
    EMType["InvalidMessageDestination"] = "InvalidMessageDestination";
    EMType["InvalidClientRequestType"] = "InvalidClientRequestType";
})(EMType || (EMType = {}));
var EOpType;
(function(EOpType) {
    EOpType["Any"] = "Any";
    EOpType["Ping"] = "Ping";
    EOpType["Pong"] = "Pong";
    EOpType["MonOp"] = "MonOp";
    EOpType["MonWatch"] = "MonWatch";
    EOpType["Crash"] = "Crash";
    EOpType["Trace"] = "Trace";
})(EOpType || (EOpType = {}));
class Client extends Object {
    static DEFAULT_SERVER_ADDR = "127.0.0.1";
    static DEFAULT_SERVER_PORT = 8080;
    _disconnectOnClientResponse;
    _server;
    get endpoint() {
        const protocol = this._server.port === 443 ? "wss" : "ws";
        return `${protocol}://` + this._server.addr + ":" + this._server.port + "/client";
    }
    ws;
    _requests;
    _listeners;
    _connection;
    get co() {
        return this._connection.promise;
    }
    keepalive() {
        this._disconnectOnClientResponse = false;
    }
    disconnect() {
        this.ws.close();
    }
    constructor(addr = Client.DEFAULT_SERVER_ADDR, port = Client.DEFAULT_SERVER_PORT, trace = false){
        super();
        this.trace = trace;
        this._disconnectOnClientResponse = true;
        this._server = {
            addr: Client.DEFAULT_SERVER_ADDR,
            port: Client.DEFAULT_SERVER_PORT
        };
        this._requests = {};
        this._listeners = {};
        this._connection = {};
        this._server.addr = addr;
        this._server.port = port;
        this.ws = new WebSocket(this.endpoint);
        this._connection.promise = new Promise((resolve, reject)=>{
            this._connection.resolve = resolve;
            this._connection.reject = reject;
        });
        this.ws.onopen = (_)=>{
            this._connection.resolve(this);
        };
        let methods = [];
        let parent = Object.getPrototypeOf(this);
        while(parent.constructor.name !== "Object"){
            methods = methods.concat(Reflect.ownKeys(parent));
            parent = Object.getPrototypeOf(parent);
        }
        this.ws.onmessage = (ev)=>{
            const message = JSON.parse(ev.data);
            const self = this;
            if (methods.includes(message.type)) {
                self[message.type]({
                    ...message,
                    source: this._server.addr,
                    destination: "Client"
                });
            } else {
                console.warn(`${this.constructor.name}::MissingHandlerFor::${message.type}`);
            }
        };
        this.ws.onerror = (error)=>{
            this._connection.reject(error);
        };
    }
    send(type, payload) {
        const token = Math.random().toString(36).substring(2);
        this.ws.send(JSON.stringify({
            type: EMType.ClientRequest,
            source: "Client",
            destination: this._server.addr,
            payload: {
                trace: this.trace,
                token: token,
                type: type,
                payload: payload,
                timestamp: new Date().getTime()
            }
        }));
        return new Promise((resolve, reject)=>{
            this._requests[token] = {
                resolve: (v)=>{
                    resolve(v);
                    if (this._disconnectOnClientResponse) this.disconnect();
                },
                reject: reject
            };
        });
    }
    [EMType.ClientResponse](message) {
        if (Object.keys(this._requests).includes(message.payload.token)) {
            this._requests[message.payload.token].resolve(message);
            delete this._requests[message.payload.token];
            if (this._disconnectOnClientResponse) delete this._listeners[message.payload.type];
        } else {
            console.log(`Client::ClientResponse::Error::InvalidToken::${message.payload.token}`);
        }
    }
    [EMType.ClientNotification](message) {
        const handler = this._listeners[message.payload.type];
        if (handler) {
            handler(message);
        } else {
            console.log(`Client::ClientNotification::Error::InvalidToken::${message.payload.token}`);
        }
    }
    [EMType.InvalidClientRequestType](message) {
        if (Object.keys(this._requests).includes(message.payload.token)) {
            this._requests[message.payload.token].reject(message);
            delete this._requests[message.payload.token];
        } else {
            console.error(`Client::InvalidClientRequestType::Error::InvalidToken::${message.payload.token}`);
        }
    }
    monop(op, key, value) {
        return this.send(EOpType.MonOp, {
            op: op,
            metric: {
                key: key,
                value: value
            }
        });
    }
    monget(key) {
        return this.send(EOpType.MonOp, {
            op: EMonOpType.Get,
            metric: {
                key: key
            }
        });
    }
    monset(key, value) {
        return this.send(EOpType.MonOp, {
            op: EMonOpType.Set,
            metric: {
                key: key,
                value: value
            }
        });
    }
    monwatch(key, expire = -1) {
        return this.send(EOpType.MonWatch, {
            key: key,
            expire: expire
        });
    }
    ping() {
        return this.send(EOpType.Ping, null);
    }
    any(payload) {
        return this.send(EOpType.Any, payload);
    }
    crash() {
        return this.send(EOpType.Crash, null);
    }
    listen(type, callback) {
        this._listeners[type] = callback;
    }
    unlisten(type) {
        delete this._listeners[type];
    }
    trace;
}
var EWSOpType;
(function(EWSOpType) {
    EWSOpType["Chop"] = "Chop";
    EWSOpType["Run"] = "Run";
    EWSOpType["Throw"] = "Throw";
    EWSOpType["Tick"] = "Tick";
    EWSOpType["Reset"] = "Reset";
    EWSOpType["Delete"] = "Delete";
    EWSOpType["Create"] = "Create";
    EWSOpType["Config"] = "Config";
    EWSOpType["GetState"] = "GetState";
    EWSOpType["UnGetState"] = "UnGetState";
    EWSOpType["CreateError"] = "CreateError";
    EWSOpType["DeleteError"] = "DeleteError";
    EWSOpType["EntityNotFound"] = "EntityNotFound";
    EWSOpType["SetTicksFrequency"] = "SetTicksFrequency";
})(EWSOpType || (EWSOpType = {}));
class WSClient extends Client {
    trc = "";
    constructor(addr = Client.DEFAULT_SERVER_ADDR, port = Client.DEFAULT_SERVER_PORT, trace = false){
        super(addr, port, trace);
        if (trace) {
            this.listen(EOpType.Trace, (message)=>{
                this.trc += message.payload.payload + " -> ";
                console.clear();
                console.log("[Trace]", this.trc);
            });
        }
    }
    [EMType.ClientResponse](message) {
        super.ClientResponse(message);
        if (this.trc.length) {
            console.clear();
            console.log("[Trace]", this.trc + "Client");
        }
    }
    run(yes) {
        return this.send(EWSOpType.Run, yes === undefined ? null : yes);
    }
    throw(message) {
        return this.send(EWSOpType.Throw, message);
    }
    reset() {
        return this.send(EWSOpType.Reset, null);
    }
    stfrequency(v) {
        return this.send(EWSOpType.SetTicksFrequency, v);
    }
    chop(tree) {
        return this.send(EWSOpType.Chop, tree);
    }
    create(type, amount = 1) {
        return this.send(EWSOpType.Create, {
            type: type,
            amount: amount
        });
    }
    delete(type, amount = 1) {
        return this.send(EWSOpType.Delete, {
            type: type,
            amount: amount
        });
    }
    watch() {
        return this.send(EWSOpType.GetState, null);
    }
    unwatch() {
        return this.send(EWSOpType.UnGetState, null);
    }
    tick(amount) {
        return this.send(EWSOpType.Tick, amount);
    }
    config(type, param, value, prop = 1) {
        return this.send(EWSOpType.Config, {
            type,
            param,
            value,
            prop
        });
    }
}
export { WSClient as WSClient };
