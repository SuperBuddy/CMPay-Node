var Promise = require('bluebird'),
	crypto = require('crypto'),
	rtrim = require('locutus/php/strings/rtrim'),
	ksort = require('locutus/php/array/ksort');

var urlencode = require('./urlencode');

/**
 * @param  {string} method The http request method 
 * @param  {string} url The requested url
 * @param  {object} body The body send to the request
 * @param  {object} oAuthData The oAuth header data
 * @param  {string} signingKey From the getSigningKey function
 * @return {Promise<string>} Returns an encrypted signature for the oAuth Headers
 */
module.exports = (method = 'GET', url, body, oAuthData, signingKey) => {
	ksort(oAuthData);

	let baseUrl = url.split('?')[0];

	let signatureString = body ? urlencode(JSON.stringify(body) + '&') : '';

	for (let key in oAuthData) {
		let value = oAuthData[key];
		signatureString +=  urlencode(key + '=' + value + '&');
	}

	signatureString = rtrim(signatureString, '%26');

	let payload = method.toUpperCase() + '&' + urlencode(baseUrl) + '&' + signatureString;

	let encrypted = crypto.createHmac('SHA256', signingKey)
					.update(payload)
					.digest('hex');
		encrypted = new Buffer(encrypted);
		encrypted = encrypted.toString('base64');

	return encrypted;
};