var async = require('async'),
	Promise = require('bluebird'),
	crypto = require('crypto'),
	rtrim = require('locutus/php/strings/rtrim'),
	ksort = require('locutus/php/array/ksort');

var urlencode = require('./urlencode');

module.exports = (method = 'GET', url, body, oAuthData, signingKey) => {
	return new Promise((resolve, reject) => {
		ksort(oAuthData);

		let baseUrl = url.split('?')[0];

		let signatureString = body ? urlencode(JSON.stringify(body) + '&') : '';

		async.eachOf(oAuthData, (value, key, next) => {
			signatureString +=  urlencode(key + '=' + value + '&');
			next();
		}, (err) => {
			if(err) { reject(err); }

			signatureString = rtrim(signatureString, '%26');

			let payload = method.toUpperCase() + '&' + urlencode(baseUrl) + '&' + signatureString;

			let encrypted = crypto.createHmac('SHA256', signingKey)
						   .update(payload)
						   .digest('hex');
				encrypted = new Buffer(encrypted);
				encrypted = encrypted.toString('base64');

			resolve(encrypted);
		});
	});
};