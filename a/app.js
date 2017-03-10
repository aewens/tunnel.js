var Store = {
    get: function(key) {
        return localStorage.getItem(key);
    },
    set: function(key, value) {
        return localStorage.setItem(key, value);
    },
    remove: function(key) {
        return localStorage.removeItem(key);
    }
};

var Tunnel = function() {
    var listener = this.listener.bind(this),
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
    noop: function() {},
    S4: function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    },
    guid: function() {
        return [
            this.S4() + this.S4(),
            this.S4(),
            this.S4(),
            this.S4(),
            this.S4() + this.S4() + this.S4()
        ].join("-");
    }, 
    start: function(options) {
        var self = this;
        
        this.src = "*";
        this.wait = 1000;
        this.ready = this.noop;
        this.callback = "/callback";
        
        if (options !== undefined) {
            this.src = options.src || this.src;
            this.wait = options.wait || this.wait;
            this.ready = options.ready || this.ready;
            this.callback = options.callback || this.callback;
        }
        
        this.remote.setAttribute("src", this.src);
            
        document.addEventListener("tunnel-ready", function() {
            return self.ready();
        });
        
        return this.loadID = setInterval(function() {
            if (!Store.get("key")) Store.set("key", self.guid());
            
            return self.request(self.src, {
                name: "handshake",
                data: {
                    key: Store.get("key"),
                    callback: self.callback
                }
            });
        }, this.wait);
    },
    unload: function() {
        clearInterval(this.loadID);
        this.loadID = null;
        Store.set("tunnel-ready", true);
        // return callback.call(this, args);
    },
    request: function(url, action) {
        // Check here if URL is okay
        
        return this.sender(JSON.stringify(action), url);
    },
    sender: function(message, url) {
        return this.remote.contentWindow.postMessage(message, url);
    },
    send: function(name) {
        var token = null;
        
        switch (name) {
            case "ready":
                document.dispatchEvent(Tunnel.readyEvent);
                return this.request(this.src, {
                    name: "hello",
                    data: "Austin"
                });
            default:
                console.log("Fail: That's not a valid name");
                break;
        }
    },
    listener: function(message) {
        var payload = JSON.parse(message.data);
        
        // Remove in production
        if (payload === null) {
            console.log("Critical: Wrong format response!");
            console.log(message.data);
            console.log(JSON.parse(message.data));
            return;
        }
        
        var name = payload.name,
            data = payload.data,
            self = this;
            
        switch(name) {
            case "accept":
                console.log(data);
                this.send("ready");
                break;
            case "hey":
                console.log(data);
                break;
            case "fail":
                console.log("Failed: "+data.code+": "+data .msg);
                break;
            default:
                console.log("Error!");
                break;
        }
        
        if (this.loadID) {
            this.unload();
        }
    }
};

var tunnel = new Tunnel();
tunnel.start({
    src: "http://localhost/testing/b",
    wait: 500,
    callback: "ajax.php",
    ready: function() {
        console.log("Ready!");
    }
});
