// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

var EComponent;
(function(EComponent1) {
    EComponent1["Net"] = "Net";
    EComponent1["Peer"] = "Peer";
    EComponent1["Discovery"] = "Discovery";
    EComponent1["Monitor"] = "Monitor";
    EComponent1["Logger"] = "Logger";
    EComponent1["Api"] = "Api";
    EComponent1["ALL"] = "Messenger";
})(EComponent || (EComponent = {}));
var EMonOpType;
(function(EMonOpType1) {
    EMonOpType1["Set"] = "Set";
    EMonOpType1["Get"] = "Get";
})(EMonOpType || (EMonOpType = {}));
var EMType;
(function(EMType2) {
    EMType2["Any"] = "Any";
    EMType2["LogMessage"] = "LogMessage";
    EMType2["InitialMessage"] = "InitialMessage";
    EMType2["DiscoveryResult"] = "DiscoveryResult";
    EMType2["DiscoveryEndpointCalled"] = "DiscoveryEndpointCalled";
    EMType2["ClientRequest"] = "ClientRequest";
    EMType2["ClientResponse"] = "ClientResponse";
    EMType2["ClientNotification"] = "ClientNotification";
    EMType2["ClientConnectionOpen"] = "ClientConnectionOpen";
    EMType2["ClientConnectionClose"] = "ClientConnectionClose";
    EMType2["PeerConnectionRequest"] = "PeerConnectionRequest";
    EMType2["PeerConnectionAccepted"] = "PeerConnectionAccepted";
    EMType2["PeerConnectionOpen"] = "PeerConnectionOpen";
    EMType2["PeerConnectionSuccess"] = "PeerConnectionSuccess";
    EMType2["PeerConnectionClose"] = "PeerConnectionClose";
    EMType2["MonGetRequest"] = "MonGetRequest";
    EMType2["MonGetResponse"] = "MonGetResponse";
    EMType2["MonSetRequest"] = "MonSetRequest";
    EMType2["MonSetResponse"] = "MonSetResponse";
    EMType2["MonWatchRequest"] = "MonWatchRequest";
    EMType2["InvalidMessageDestination"] = "InvalidMessageDestination";
    EMType2["InvalidClientRequestType"] = "InvalidClientRequestType";
})(EMType || (EMType = {}));
var EOpType;
(function(EOpType2) {
    EOpType2["Any"] = "Any";
    EOpType2["Ping"] = "Ping";
    EOpType2["Pong"] = "Pong";
    EOpType2["MonOp"] = "MonOp";
    EOpType2["MonWatch"] = "MonWatch";
    EOpType2["Crash"] = "Crash";
    EOpType2["Trace"] = "Trace";
})(EOpType || (EOpType = {}));
class Client extends Object {
    static DEFAULT_SERVER_ADDR = "127.0.0.1";
    static DEFAULT_SERVER_PORT = 8080;
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
    disconnect() {
        this.ws.close();
    }
    constructor(addr = Client.DEFAULT_SERVER_ADDR, port = Client.DEFAULT_SERVER_PORT, trace = false){
        super();
        this.trace = trace;
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
                    this.disconnect();
                },
                reject: reject
            };
        });
    }
    [EMType.ClientResponse](message) {
        if (Object.keys(this._requests).includes(message.payload.token)) {
            this._requests[message.payload.token].resolve(message);
            delete this._requests[message.payload.token];
            delete this._listeners[message.payload.type];
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
    trace;
}
var EMType1;
(function(EMType3) {
    EMType3["Any"] = "Any";
    EMType3["LogMessage"] = "LogMessage";
    EMType3["InitialMessage"] = "InitialMessage";
    EMType3["DiscoveryResult"] = "DiscoveryResult";
    EMType3["DiscoveryEndpointCalled"] = "DiscoveryEndpointCalled";
    EMType3["ClientRequest"] = "ClientRequest";
    EMType3["ClientResponse"] = "ClientResponse";
    EMType3["ClientNotification"] = "ClientNotification";
    EMType3["ClientConnectionOpen"] = "ClientConnectionOpen";
    EMType3["ClientConnectionClose"] = "ClientConnectionClose";
    EMType3["PeerConnectionRequest"] = "PeerConnectionRequest";
    EMType3["PeerConnectionAccepted"] = "PeerConnectionAccepted";
    EMType3["PeerConnectionOpen"] = "PeerConnectionOpen";
    EMType3["PeerConnectionSuccess"] = "PeerConnectionSuccess";
    EMType3["PeerConnectionClose"] = "PeerConnectionClose";
    EMType3["MonGetRequest"] = "MonGetRequest";
    EMType3["MonGetResponse"] = "MonGetResponse";
    EMType3["MonSetRequest"] = "MonSetRequest";
    EMType3["MonSetResponse"] = "MonSetResponse";
    EMType3["MonWatchRequest"] = "MonWatchRequest";
    EMType3["InvalidMessageDestination"] = "InvalidMessageDestination";
    EMType3["InvalidClientRequestType"] = "InvalidClientRequestType";
})(EMType1 || (EMType1 = {}));
var EOpType1;
(function(EOpType3) {
    EOpType3["Any"] = "Any";
    EOpType3["Ping"] = "Ping";
    EOpType3["Pong"] = "Pong";
    EOpType3["MonOp"] = "MonOp";
    EOpType3["MonWatch"] = "MonWatch";
    EOpType3["Crash"] = "Crash";
    EOpType3["Trace"] = "Trace";
})(EOpType1 || (EOpType1 = {}));
var EWSOpType;
(function(EWSOpType1) {
    EWSOpType1["Chop"] = "Chop";
    EWSOpType1["Run"] = "Run";
    EWSOpType1["Throw"] = "Throw";
    EWSOpType1["Tick"] = "Tick";
    EWSOpType1["Reset"] = "Reset";
    EWSOpType1["Delete"] = "Delete";
    EWSOpType1["Create"] = "Create";
    EWSOpType1["Config"] = "Config";
    EWSOpType1["GetState"] = "GetState";
    EWSOpType1["CreateError"] = "CreateError";
    EWSOpType1["DeleteError"] = "DeleteError";
    EWSOpType1["EntityNotFound"] = "EntityNotFound";
    EWSOpType1["SetTicksFrequency"] = "SetTicksFrequency";
})(EWSOpType || (EWSOpType = {}));
class WSClient extends Client {
    trc = "";
    constructor(addr = Client.DEFAULT_SERVER_ADDR, port = Client.DEFAULT_SERVER_PORT, trace = false){
        super(addr, port, trace);
        if (trace) {
            this.listen(EOpType1.Trace, (message)=>{
                this.trc += message.payload.payload + " -> ";
                console.clear();
                console.log("[Trace]", this.trc);
            });
        }
    }
    [EMType1.ClientResponse](message) {
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
