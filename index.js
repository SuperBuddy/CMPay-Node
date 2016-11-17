'use strict';

// dependencies
var Promise = require('bluebird'),
	request = require('request'),
	_ = require('lodash');

// libs
var urlencode = require('./lib/urlencode');

// libs specific to cmpay
var createOAuthHeader = require('./lib/createOAuthHeader'),
	checkOptions = require('./lib/checkOptions');

// constructor/class
class CMPay {
	constructor(options){
		this.options = checkOptions(options);
	}
	
	getSigningKey() {
		return urlencode(this.options.consumerKey) + '&' + urlencode(this.options.secretKey);
	}

	sendRequest(method, url, body) {
		return new Promise((resolve, reject) => {
			let fullUrl = this.options.apiUrl + url;

			let httpOptions = {
				url: fullUrl,
				method: method.toUpperCase(),
				json: true
			};

			if(body && typeof body === 'object') {
				httpOptions.body = body;
			}

			createOAuthHeader(method, fullUrl, body, this.options.consumerKey, this.getSigningKey())
			.then(result => {
				httpOptions.headers = {
					'Content-type': 'application/json',
					'Authorization': result
				};

				request(httpOptions, (err, res, resBody) => {
					if(err) { return reject(err); }
					resolve(resBody);
				});
			}, err => reject(err));
		})
	}

	createPaymentDetails(issuerId, purchaseId, description) {
		if(!issuerId) {
			throw new Error('issuerId is a required variable.');
		}

		if(!purchaseId) {
			throw new Error('purchaseId is a required variable.');
		}

		return {
            issuer_id: issuerId,
            success_url: this.options.returnUrls.success,
            cancelled_url: this.options.returnUrls.cancel,
            failed_url: this.options.returnUrls.fail,
            expired_url: this.options.returnUrls.error,
            purchase_id: purchaseId,
            description: description ? description : ''
        };
	}

	createIdealPayment(amount, issuerId, purchaseId, description) {
		return {
            amount: amount,
            currency: this.options.currency,
            payment_method: 'iDEAL',
            payment_details: this.createPaymentDetails(issuerId, purchaseId, description)
        };
	}

	getBankList() {
		return this.sendRequest('get', '/issuers/v1/ideal');
	}

	createCharge(payment) {
		if(typeof payment !== 'object') {
			throw new Error('Payments must be an object, use one of the createPayments methods to create a payment.');
		}

		let data = {
            amount: payment.amount,
            currency: this.options.currency,
            payments: [payment]
        };

        return this.sendRequest('post', '/charges/v1', data);
	}

	getCharge(chargeId) {
		if(!chargeId) {
			throw new Error('ChargeId is a required variable.');
		}

		return this.sendRequest('get', '/charges/v1/' + chargeId);
	}

	getPayment(paymentId) {
		if(!paymentId) {
			throw new Error('paymentId is a required variable.');
		}

		return this.sendRequest('get', '/payments/v1/' + paymentId);
	}
}


module.exports = CMPay;