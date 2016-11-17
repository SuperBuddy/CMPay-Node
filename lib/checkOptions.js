module.exports = (options) => {
	// optionals
	if (!options.hasOwnProperty('apiUrl')) {
		options.apiUrl = 'https://api.cmpayments.com';
	}
	if (!options.hasOwnProperty('debug')) {
		options.debug = false;
	}

	// required
	if (!options.hasOwnProperty('consumerKey')) {
		throw new Error('Options.consumerKey is required');
	}
	if (!options.hasOwnProperty('secretKey')) {
		throw new Error('Options.secretKey is required');
	}
	if (!options.hasOwnProperty('country')) {
		throw new Error('Options.country is required');
	}
	if (!options.hasOwnProperty('language')) {
		throw new Error('Options.language is required');
	}
	if (!options.hasOwnProperty('currency')) {
		throw new Error('Options.currency is required');
	}
	if (!options.hasOwnProperty('company')) {
		throw new Error('Options.company is required');
	}
	if (!options.hasOwnProperty('referencePrefix')) {
		throw new Error('Options.referencePrefix is required');
	}
	
	// return url's
	if (!options.hasOwnProperty('returnUrls')) {
		throw new Error('Options.returnUrls is required');
	}
	else {
		if((typeof options.returnUrls) != 'object')	 {
			throw new Error('Options.returnUrls must be of type object');		
		}

		if(!options.returnUrls.hasOwnProperty('success')) {
			throw new Error('Options.returnUrls.success is required');
		}
		if(!options.returnUrls.hasOwnProperty('fail')) {
			throw new Error('Options.returnUrls.fail is required');
		}
		if(!options.returnUrls.hasOwnProperty('cancel')) {
			throw new Error('Options.returnUrls.cancel is required');
		}
		if(!options.returnUrls.hasOwnProperty('error')) {
			throw new Error('Options.returnUrls.error is required');
		}
	}

	return options;
};