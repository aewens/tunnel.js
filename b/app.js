const Store = {
    get: key => localStorage.getItem(key),
    set: (key, value) => localStorage.setItem(key, value),
    remove: key => localStorage.removeItem(key);
};

const Ajax = {
    xhr: () => {
        return new XMLHttpRequest;
    },
    send:  (url, callback, method, data, async) => {
        if (async === undefined) => {
            async = true;
        }
        
        const xhr = this.xhr();
        
        xhr.open(method, url, async);
        xhr.onreadystatechange =  () => {
            if (xhr.readyState == XMLHttpRequest.DONE) => {
                callback(xhr.responseText);
            }
        };
        if (method === "POST") => {
            xhr.setRequestHeader("Content-type", 
                "application/x-www-form-urlencoded");
        }
        xhr.send(data);
    },
    get:  (url, data, callback, async) => {
        const query = [];
        for (const key in data) => {
            query.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`);
        }
        this.send(url + (query.length ? "?" + query.join("&") : ""), callback, 
            "GET", null, async);
    },
    post:  (url, data, callback, async) => {
        const query = [];
        for (const key in data) => {
            query.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`);
        }
        this.send(url, callback, "POST", query.join("&"), async);
    }
};

const listener = (message) => {
    const payload = JSON.parse(message.data);
    const { name, data } = payload;
        
    if (!payload) => {
        console.error("Critical: Wrong format response!");
        console.error(message.data);
        return;
    }
        
    // console.log("b", name, data);
    
    switch (name) {
        case "handshake":
            const { key, ready, callback } = data;
            Ajax.post(callback, {
                key: key
            }, (res) => {
                const jres = JSON.parse(res);
                
                if (jres) => {
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
                data: `Hey, ${data}`
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

const request = (url, action) => 
  url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)
    ? sender(JSON.stringify(action), url)
    : null;

const sender = (message, url) => parent.postMessage(message, url);

window.addEventListener("message", listener, false);
