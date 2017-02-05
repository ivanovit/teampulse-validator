const request = require('request'),
      httpntlm = require('httpntlm'),
      Promise = require('bluebird'),
      httpntlmGet = Promise.promisify(httpntlm.get),
      queryString = require('query-string'),
      requestPromise = require('request-promise');

class Teampulse {
    constructor(config) {
        config = config || {}
        config.url = config.url || 'http://teampulse.com'
        this.config = config;

        this.consts = {
            ASP_COOKIE: '.ASPXAUTH='
        };
    }

    authenticate(credentials) {
        return this._getAuthCookie(credentials)
                   .then(this._getVerificationCode.bind(this))
                   .then(this._getAccessToken.bind(this))
                   .then(accessToken => this.wrap_access_token = accessToken);
    }

    getItem(id) {
        const getItemOptions = { 
            url: `${this.config.url}/api/workitems/${id}`,
            headers: {
                'Authorization': `WRAP access_token="${this.wrap_access_token}"`,
                'Content-Type': 'application/json',
                'Accept': '*/*'
            },
            method: 'GET',
            json: true
        };

        return requestPromise(getItemOptions);
    }

    putItem(id, item) {
        const putItemOptions = { 
            url:  `${this.config.url}/api/workitems/${id}`,
            headers: {
                'Authorization': `WRAP access_token="${this.wrap_access_token}"`,
                'Content-Type': 'application/json',
                'Accept': '*/*'
            },
            method: 'PUT',
            json: item
        };

        return requestPromise(putItemOptions);
    }

    changeStatus(itemId, status) {
		const propertiesToChange = { 
			"Status":  status 
		};

		return this.putItem(itemId, propertiesToChange);
	}

    _getAuthCookie(credentials) {
        const getAuthCookieOptions = {
            url: `${this.config.url}/WinLogin/Login.aspx?ReturnUrl=0`,
            username: credentials.username,
            password: credentials.password,
            domain:  credentials.domain
        };

        return httpntlmGet(getAuthCookieOptions).then(this._extractAuthCookie.bind(this));
    }

    _getVerificationCode(authCookieValue) {
        const getVerificationCodeOptions = { 
            url: `${this.config.url}/Authenticate/WRAPv0.9?wrap_client_id=uri%3aTeamPulse`,
            headers: {
                'Cookie':`${this.consts.ASP_COOKIE}${authCookieValue}`
            }
        };
        
        return requestPromise(getVerificationCodeOptions).then(this._extractVerificationCode.bind(this));
    }

    _getAccessToken(verificationCode) {
        const getAccessTokenOptions = { 
            url: `${this.config.url}/Authenticate/WRAPv0.9?wrap_client_id=uri%3aTeamPulse`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'POST',
            body: `wrap_client_id=uri:TeamPulse&wrap_verification_code=${verificationCode}`,
        };

        return requestPromise(getAccessTokenOptions).then(response => queryString.parse(response).wrap_access_token);
    }

    _extractAuthCookie(response) {
        let setCookieHeaders = response.headers['set-cookie'],
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

    _extractVerificationCode(body) {
        const verificationCodeRegex = /<title>Authentication Delegation, code=(.+)<\/title>/,
              verificationCodeMatch = body.match(verificationCodeRegex);
        
        if(verificationCodeMatch != null) {
            return verificationCodeMatch[1];
        }
    }
}

module.exports = Teampulse;
