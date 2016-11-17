const crypto = require('crypto');

module.exports = () => {
	return crypto
			.createHash('md5')
			.update(new Date().getTime().toString())
			.digest("hex");
}