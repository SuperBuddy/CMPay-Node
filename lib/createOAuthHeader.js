var async = require('async'),
	Promise = require('bluebird'),
	rtrim = require('locutus/php/strings/rtrim'),
	ksort = require('locutus/php/array/ksort');

var nonce = require('./nonce'),
	urlencode = require('./urlencode');

var generateSignature = require('./generateSignature');

/**
 * @param  {string} method The http method
 * @param  {string}	url The requested url
 * @param  {body} object Unstringified body
 * @param  {string} consumerKey The consumer key
 * @param  {string} signingKey From the getSigningKey function
 * @return {Promise<string>} Authentication string for the oAuth Header
 */
module.exports = (method, url, body, consumerKey, signingKey) => {
	let oAuthData = {};

	oAuthData[urlencode('oauth_consumer_key')] = consumerKey;
	oAuthData[urlencode('oauth_nonce')] = nonce();
	oAuthData[urlencode('oauth_signature_method')] = 'HMAC-SHA256';
	oAuthData[urlencode('oauth_timestamp')] = (Math.floor(new Date() / 1000));
	oAuthData[urlencode('oauth_version')] = '1.0';

	// generate signature
	oAuthData[urlencode('oauth_signature')] = generateSignature(method, url, body, oAuthData, signingKey)
	
	ksort(oAuthData);

	let authString = 'OAuth ';
	for (let key in oAuthData) {
		let value = oAuthData[key];
		authString += urlencode(key) + '="' + urlencode(value) + '", ';
	}
	
	authString = rtrim(authString, ', ');

	return authString;
};