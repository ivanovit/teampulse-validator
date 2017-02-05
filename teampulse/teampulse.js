var request = require('request');
var httpntlm = require('httpntlm');
var queryString = require('query-string');
var Promise = require('bluebird')

module.exports = function(config) {
    config = config || {}
    config.url = config.url || 'http://teampulse.com'
    this.config = config;

    this.authenticate = function(credentials) {
        var that = this;

        return new Promise(function (resolve, reject) {
            httpntlm.get({
                url: that.config.url + '/WinLogin/Login.aspx?ReturnUrl=0',
                username: credentials.username,
                password: credentials.password,
                domain:  credentials.domain
            }, function (err, res){
                if(err) {
                    reject(err);
                }

                authCookieValue = that._getAuthCookie(res);

                request({
                    url: that.config.url + '/Authenticate/WRAPv0.9?wrap_client_id=uri%3aTeamPulse',
                    headers: {
                        'Cookie': that.consts.ASP_COOKIE + authCookieValue
                    }
                }, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        var verificationCode = that._getVerificationCode(body);
                        request({
                            url: that.config.url + '/Authenticate/WRAPv0.9?wrap_client_id=uri%3aTeamPulse',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            method: 'POST',
                            body: 'wrap_client_id=uri:TeamPulse&wrap_verification_code=' + verificationCode,
                        }, function (error, response, body) {
                            var parsed = queryString.parse(body),
                                accessToken = parsed.wrap_access_token;

                            that.wrap_access_token = parsed.wrap_access_token;
                            resolve();
                        })
                    }
                });
            });
        });
    }

    this.getItem = function(id) {
        var that = this;
        return new Promise(function (resolve, reject) {
            request({ 
                url: that.config.url + '/api/workitems/' + id,
                headers: {
                            'Authorization': 'WRAP access_token="' + that.wrap_access_token +'"',
                            'Content-Type': 'application/json',
                            'Accept': '*/*'
                        },
                method: 'GET'
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    resolve(JSON.parse(body));
                    return;
                }
                
                reject(error);      
            });
        });
    }

    this.putItem = function(id, item) {
        var that = this;
        return new Promise(function (resolve, reject) {
            request({ 
                url: that.config.url + '/api/workitems/' + id,
                headers: {
                            'Authorization': 'WRAP access_token="' + that.wrap_access_token +'"',
                            'Content-Type': 'application/json',
                            'Accept': '*/*'
                        },
                method: 'PUT',
                json: item
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    resolve();
                    return;
                }
                
                reject(error);      
            });
        });
    }

    this.changeStatus = function(itemId, status) {
		const propertiesToChange = { 
			"Status":  status 
		};

		return this.putItem(itemId, propertiesToChange);
	}

    this._getAuthCookie = function(response) {
        var setCookieHeaders = response.headers['set-cookie'],
            header,
            authCookieStartIndex,
            authCookieEndIndex;

        for (var i = 0; i < setCookieHeaders.length; i++) {
            header = setCookieHeaders[i];
            authCookieStartIndex = header.indexOf(this.consts.ASP_COOKIE)
            if(authCookieStartIndex != -1) {
                authCookieEndIndex = header.indexOf(';')
                return header.substring(authCookieStartIndex + this.consts.ASP_COOKIE.length, authCookieEndIndex);
            }
        }
    }

    this._getVerificationCode = function(body) {
        var verificationCodeRegex = /<title>Authentication Delegation, code=(.+)<\/title>/,
            verificationCodeMatch = body.match(verificationCodeRegex);
        
        if(verificationCodeMatch != null) {
            return verificationCodeMatch[1];
        }
    }

    this.consts = {
        ASP_COOKIE: '.ASPXAUTH='
    }
}
