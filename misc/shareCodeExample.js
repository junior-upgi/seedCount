(function(exports) {
    var passphrase = "secretPhrase";
    var backendServerHost = "http://upgi.ddns.net:4949";
    module.exports = {
        passphrase,
        backendServerHost
    };
})(typeof exports === "undefined" ? this["serverInfo"] = {} : exports);