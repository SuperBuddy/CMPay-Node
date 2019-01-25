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

/**
 * CMPay class
 * Everything public which could be needed
 */
class CMPay {
	/**
	 * Constructor for CMPay, sets the options.
	 * @param  {[object]}  Object with options.
	 */
	constructor(options){
		this.options = checkOptions(options);

		if(this.options.debug) {
			require('request-debug')(request);
		}
	}
	
	/**
	 * Get the signing key based off of the consumerKey & secretKey
	 * @return {[string]}
	 */
	getSigningKey() {
		return urlencode(this.options.consumerKey) + '&' + urlencode(this.options.secretKey);
	}

	/**
	 * @param {string} url the url to call to
	 * @param {object} body body data if needed
	 * @param {string} method the method to be used ['get', 'post', 'put', 'delete']
	 * @return {Promise<object>} CMPay response
	 */
	sendRequest(url, body, method = 'GET') {
		return new Promise((resolve, reject) => {
			let fullUrl = this.options.apiUrl + url;

			let httpOptions = {
				url: fullUrl,
				method: method.toUpperCase()
			};

			if(body && typeof body === 'object') {
				httpOptions.body = JSON.stringify(body);
			}

			// create the oAuth header needed for the Authorization header.
			let oAuthHeader = createOAuthHeader(method, fullUrl, body, this.options.consumerKey, this.getSigningKey());

			httpOptions.headers = {
				'Content-type': 'application/json',
				'Authorization': oAuthHeader
			};

			request(httpOptions, (err, res, resBody) => {
				if(err) { return reject(err); }
				let jsonBody = JSON.parse(resBody);
				if(jsonBody.errors) { return reject(new Error(jsonBody.errors[0].message)); }
				resolve(jsonBody);
			});
		})
	}

	/**
	 * @param {string} issuerId ID of the issuer (bank)	
	 * @param {string} purchageId identifier to recognize your payment
	 * @param {string} description Optional description for the payment
	 * @param {object} returnUrls object with return urls if you want to use something else than the config defined
	 * @return {object} CMPay formatted payment details
	 */
	createIdealPaymentDetails(issuerId, purchaseId, description, returnUrls = false) {
		if (!issuerId) {
			throw new Error('issuerId is a required variable.');
		}

		if (!purchaseId) {
			throw new Error('purchaseId is a required variable.');
		}

		return {
			"issuer_id": issuerId,
			"success_url": (returnUrls && returnUrls.success) ? returnUrls.success : this.options.returnUrls.success,
			"cancelled_url": (returnUrls && returnUrls.cancel) ? returnUrls.cancel : this.options.returnUrls.cancel,
			"failed_url": (returnUrls && returnUrls.fail) ? returnUrls.fail : this.options.returnUrls.fail,
			"expired_url": (returnUrls && returnUrls.error) ? returnUrls.error : this.options.returnUrls.error,
			"purchase_id": purchaseId,
			"description": description ? description : ''
		};
	}

	/**
	 * @param {double} amount The amount to be paid
	 * @param {string} issuerId ID of the issuer (bank)	
	 * @param {string} purchageId identifier to recognize your payment
	 * @param {string} description Optional description for the payment
	 * @return {object} CMPay formatted payment
	 */
	createIdealPayment(amount, issuerId, purchaseId, description, returnUrls = false) {
		return {
			"amount": amount,
			"currency": this.options.currency,
			"payment_method": "iDEAL",
			"payment_details": this.createIdealPaymentDetails(issuerId, purchaseId, description, returnUrls)
		};
	}

	/**
	 * @param {string} purchaseId identifier to recognize your payment
	 * @param {string} bankAccountNumber The IBAN of the end user
	 * @param {string} name The IBAN of the end user
	 * @param {string} description Optional description for the payment
	 * @param {string} mandateId Unique identification of the mandate
	 * @param {string} mandateStartDate Date at which the mandate was obtained
	 * @param {string} transactionDescription Optional description that will be shown on the end user their bank statement. If transaction_description is not provided, description will be used.
	 * @return {object} CMPay formatted payment details
	 */
	createDirectDebitPaymentDetails(purchaseId, bankAccountNumber, name, description, mandateId, mandateStartDate, transactionDescription) {
		if (!purchaseId) {
			throw new Error('purchaseId is a required variable.');
		}

		if (!bankAccountNumber) {
			throw new Error('bankAccountNumber is a required variable.');
		}

		if (!name) {
			throw new Error('name is a required variable.');
		}

		if (!mandateId) {
			throw new Error('mandateId is a required variable.');
		}

		if (!mandateStartDate) {
			throw new Error('mandateStartDate is a required variable.');
		}

		return {
			"purchase_id": purchaseId,
			"bank_account_number": bankAccountNumber,
			"name": name,
			"description": description ? description : '',
			"mandate_id": mandateId,
			"mandate_start_date": mandateStartDate,
			"transaction_description": transactionDescription
		};
	}

	/**
	 * @param {double} amount The amount to be paid
	 * @param {string} purchaseId identifier to recognize your payment
	 * @param {string} bankAccountNumber The IBAN of the end user
	 * @param {string} name The IBAN of the end user
	 * @param {string} description Optional description for the payment
	 * @param {string} mandateId Unique identification of the mandate
	 * @param {string} mandateStartDate Date at which the mandate was obtained
	 * @param {string} transactionDescription Optional description that will be shown on the end user their bank statement. If transaction_description is not provided, description will be used.
	 * @return {object} CMPay formatted payment
	 */
	createDirectDebitPayment(amount, purchaseId, bankAccountNumber, name, description, mandateId, mandateStartDate, transactionDescription) {
		return {
			"amount": amount,
			"currency": this.options.currency,
			"payment_method": "DirectDebit",
			"payment_details": this.createDirectDebitPaymentDetails(
				purchaseId,
				bankAccountNumber,
				name,
				description,
				mandateId,
				mandateStartDate,
				transactionDescription
			)
		};
	}

	/**
	 * @return {Promise} request promise object.
	 */
	getBankList() {
		return this.sendRequest('/issuers/v1/ideal');
	}

	/**
	 * @param  {object} payment A formatted payment object (create payment functions)
	 * @return {Promise} request promise object.
	 */
	createCharge(payment) {
		if (typeof payment !== 'object') {
			throw new Error('Payments must be an object, use one of the createPayments methods to create a payment.');
		}

		let data = {
			"amount": payment.amount,
			"currency": this.options.currency,
			"payments": [payment]
		};

		return this.sendRequest('/charges/v1', data, 'post');
	}

	/**
	 * @param  {string} chargeId the id of a charge
	 * @return {Promise} request promise object.
	 */
	getCharge(chargeId) {
		if(!chargeId) {
			throw new Error('ChargeId is a required variable.');
		}

		return this.sendRequest('/charges/v1/' + chargeId);
	}

	/**
	 * @param  {string} paymentId the id of a payment
	 * @return {Promise} request promise object.
	 */
	getPayment(paymentId) {
		if(!paymentId) {
			throw new Error('paymentId is a required variable.');
		}

		return this.sendRequest('/payments/v1/' + paymentId);
	}

	/**
	 * @param  {string} paymentId the id of a payment
	 * @param  {string} reason the reason for the refund
	 * @param  {string} details custom details about the refund
	 * @return {Promise} request promise object.
	 */
	async refundPayment(paymentId, reason, refundDetails = {}) {
		if(!paymentId || !reason) {
			throw new Error('paymentId and reason are required variables.');
		}

		let payment = await this.getPayment(paymentId);

		let data = {
			"amount": payment.amount,
			"currency": this.options.currency,
			"reason": reason,
			"payment_id": paymentId,
			"refund_details": refundDetails
		};

		return this.sendRequest('/refunds/v1', data, 'post');
	}
}


module.exports = CMPay;
