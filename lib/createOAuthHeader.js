var async = require('async'),
	Promise = require('bluebird'),
	rtrim = require('locutus/php/strings/rtrim'),
	ksort = require('locutus/php/array/ksort');

var nonce = require('./nonce'),
	urlencode = require('./urlencode');

var generateSignature = require('./generateSignature');

module.exports = (method, url, body, consumerKey, signingKey) => {
	return new Promise((resolve, reject) => {
		let oAuthData = {};

		oAuthData[urlencode('oauth_consumer_key')] = consumerKey;
		oAuthData[urlencode('oauth_nonce')] = nonce();
		oAuthData[urlencode('oauth_signature_method')] = 'HMAC-SHA256';
		oAuthData[urlencode('oauth_timestamp')] = (Math.floor(new Date() / 1000));
		oAuthData[urlencode('oauth_version')] = '1.0';

		// generate signature
	    generateSignature(method, url, body, oAuthData, signingKey)
		.then(result => {
			oAuthData[urlencode('oauth_signature')] = result;
		    ksort(oAuthData);

		    let authString = 'OAuth ';
		    async.eachOf(oAuthData, (value, key, next) => {
		    	authString += urlencode(key) + '="' + urlencode(value) + '", ';
		    	next();
		    }, (err) => {
				if(err) { return reject(err); }

				authString = rtrim(authString, ', ');

				resolve(authString);
		    });
		}, err => reject(err));
	});
};