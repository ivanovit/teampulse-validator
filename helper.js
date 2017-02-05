var config = require('./config');

class Helper {
	extractTeamPulseIds(text) {
		var regex = new RegExp(config.github.teampulseIdRegex, 'gi'),
			matches = [],
			match;
		
		//TODO: Remove
		text = 'Related to: [#328140](http://teampulse.telerik.com/view#item/326852)'
				
		match = regex.exec(text);
		while (match) {
			console.log('TeamPulse item id: ' + match[1]);
			matches.push(match[1])
			match = regex.exec(text);
		}

		return matches;
	}

	split(val) {
		return val.split(',');
	}

	getDateBeforeDays(days) {
		var d = new Date();
        d.setDate(d.getDate() - days);
		return d;
	}

	logErrorAndExit(e) {
		console.error(e);
		process.exit(1);
	}
};

module.exports = new Helper();