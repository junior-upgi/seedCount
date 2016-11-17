

// route middleware to verify a token
app.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, app.get("passphrase"), function(error, decoded) {
            if (error) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    } else {
        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});

app.post("/api/authenticate", urlencodedParser, function(req, res) {
    console.log(req.body);
    console.log(req.query);
    var baseDN = "dc=upgi,dc=ddns,dc=net";
    var ldapServerHost = "ldap://upgi.ddns.net:389";
    var ldapClient = ldap.createClient({ url: ldapServerHost });
    ldapClient.bind("uid=" + req.query.loginID + ",ou=user," + baseDN, req.query.password, function(error) {
        if (error) {
            console.log("     帳號驗證失敗：" + error);
            res.status(403).json({ "authenticated": false, "message": "帳號驗證失敗：" + error });
            return false;
        }
        ldapClient.unbind(function(error) {
            if (error) {
                console.log("     LDAP 伺服器分離失敗：" + error);
                res.status(500).json({ "authenticated": false, "message": "LDAP 伺服器分離失敗：" + error });
                return false;
            }
            var user = { loginID: req.query.loginID };
            var token = jwt.sign(user, app.get("passphrase"), {
                expiresIn: "1h"
            });
            console.log("     帳號驗證成功");
            res.status(200).json({
                authenticated: true,
                message: "帳號驗證成功",
                token: token
            });
            return true;
        });
    });
});