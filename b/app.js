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

var Ajax = {
    xhr: function() {
        return new XMLHttpRequest;
    },
    send: function (url, callback, method, data, async) {
        if (async === undefined) {
            async = true;
        }
        
        var xhr = this.xhr();
        
        xhr.open(method, url, async);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                callback(xhr.responseText);
            }
        };
        if (method === "POST") {
            xhr.setRequestHeader("Content-type", 
                "application/x-www-form-urlencoded");
        }
        xhr.send(data);
    },
    get: function (url, data, callback, async) {
        var query = [];
        for (var key in data) {
            query.push(encodeURIComponent(key) + "=" + 
                encodeURIComponent(data[key]));
        }
        this.send(url + (query.length ? "?" + query.join("&") : ""), callback, 
            "GET", null, async);
    },
    post: function (url, data, callback, async) {
        var query = [];
        for (var key in data) {
            query.push(encodeURIComponent(key) + "=" + 
                encodeURIComponent(data[key]));
        }
        this.send(url, callback, "POST", query.join("&"), async);
    }
};

var listener = function(message) {
    var payload = JSON.parse(message.data);
        
    if (payload === null) {
        console.log("Critical: Wrong format response!");
        console.log(message.data);
        return;
    }
    
    // console.log(payload);
    
    var name = payload.name,
        data = payload.data;
        
    // console.log("b", name, data);
    
    switch (name) {
        case "handshake":
            var key = data.key,
                ready = data.ready,
                callback = data.callback;
            Ajax.post(callback, {
                key: key
            }, function(res) {
                var jres = JSON.parse(res);
                
                if (jres) {
                    request(message.origin, {
                        name: "accept",
                        data: {
                            key: key
                        }
                    });
                } else {
                    request(message.origin, {
                        name: "fail",
                        data: {
                            code: "0x2",
                            msg: "Denied by server"
                        }
                    });
                }
            })
            break;
        case "hello":
            return request(message.origin, {
                name: "hey",
                data: "Hey, " + data
            });
        default:
            return request(message.origin, {
                name: "fail",
                data: {
                    code: "0x1",
                    msg: "Command does not exist"
                }
            });
    }
};

var request = function(url, action) {
    // Check here if URL is okay
    
    return sender(JSON.stringify(action), url);
};

var sender = function(message, url) {
    return parent.postMessage(message, url);
};

window.addEventListener("message", listener, false);
