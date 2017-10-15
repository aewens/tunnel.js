const Store = {
    get: key => localStorage.getItem(key);
    set: (key, value) => localStorage.setItem(key, value);
    remove: key => localStorage.removeItem(key);
};

const Tunnel = () => {
    const listener = this.listener.bind(this),
        remote = document.createElement("iframe");
    
    remote.style.display = "none";
    document.body.appendChild(remote);
    
    this.remote = remote;
    this.loadID = null;
    
    window.addEventListener("message", listener, false);
    return this;
};

Tunnel.readyEvent = new Event("tunnel-ready");

Tunnel.prototype = {
    noop: () => {},
    S4: () => (((1+Math.random())*0x10000)|0).toString(16).substring(1),
    guid: () =>
        [
          this.S4() + this.S4(),
          this.S4(),
          this.S4(),
          this.S4(),
          this.S4() + this.S4() + this.S4()
        ].join("-"),
    start: (options) => {
        this.src = "*";
        this.wait = 1000;
        this.ready = this.noop;
        this.callback = "/callback";
        
        if (options) {
            this.src = options.src || this.src;
            this.wait = options.wait || this.wait;
            this.ready = options.ready || this.ready;
            this.callback = options.callback || this.callback;
        }
        
        this.remote.setAttribute("src", this.src);
            
        document.addEventListener("tunnel-ready", () => this.ready());
        
        return this.loadID = setInterval(() => {
            if (!Store.get("key")) Store.set("key", this.guid());
            
            return this.request(this.src, {
                name: "handshake",
                data: {
                    key: Store.get("key"),
                    callback: this.callback
                }
            });
        }, this.wait);
    },
    unload: () => {
        clearInterval(this.loadID);
        this.loadID = null;
        Store.set("tunnel-ready", true);
        // return callback.call(this, args);
    },
    request: (url, action) =>
        url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)
          ? this.sender(JSON.stringify(action), url)
          : null,
    sender: (message, url) => this.remote.contentWindow.postMessage(message, url),
    send: (name) => {
        const token = null;
        
        switch (name) {
            case "ready":
                document.dispatchEvent(Tunnel.readyEvent);
                return this.request(this.src, {
                    name: "hello",
                    data: "Austin"
                });
            default:
                console.error("Fail: That's not a valid name");
                break;
        }
    },
    listener: (message) => {
        const payload = JSON.parse(message.data);
        const { name, data } = payload;
        
        // Remove in production
        if (!payload) {
            console.error("Critical: Wrong format response!");
            console.error(message.data);
            console.error(JSON.parse(message.data));
            return;
        }
            
        switch(name) {
            case "accept":
                console.log(data);
                this.send("ready");
                break;
            case "hey":
                console.log(data);
                break;
            case "fail":
                console.error(`Failed:${data.code}: ${data.msg}`);
                break;
            default:
                console.error("Error!");
                break;
        }
        
        if (this.loadID) {
            this.unload();
        }
    }
};

const tunnel = new Tunnel();
tunnel.start({
    src: "http://localhost/testing/b",
    wait: 500,
    callback: "ajax.php",
    ready: () => {
        console.log("Ready!");
    }
});
