var config = require('./config'),
	Promise = require('bluebird'),
	requestPromise = require('request-promise');
	_ = require('lodash');

class Helper {
	extractPullRequestNumber(text) {
		const mergeCommitRegex = /^merge pull request #(\d+)/i;
		if(mergeCommitRegex.test(text)) { 
			return text.match(mergeCommitRegex)[1];
		}
	}
	
	extractTeamPulseIds(text) {
		var regex = new RegExp(config.github.teampulseIdRegex, 'gi'),
			matches = [],
			match;
			
		match = regex.exec(text);
		while (match) {
			matches.push(match[1])
			match = regex.exec(text);
		}

		return matches;
	}

	asArray(value) {
		if(value) {
			return value.constructor !== Array ? [ value ] : value
		}

		return [];
	}

	parseFieldsToSet(argv) {
		let setFields = this.asArray(argv.setField);

		return _.map(setFields, fieldString => {
				let fieldNameAndVal = fieldString.split("=")
				
				if(fieldNameAndVal.length != 2) {
					throw `Invalid format ${fieldString}. Should be fieldName=value`
				}

				return {
					name: fieldNameAndVal[0],
					value: fieldNameAndVal[1]
				};
		});
	}

	parseAndGetCommitIds(argv) {
		let commits = argv.fromCommitsRange;
		if(commits.length != 2) {
			throw `Please specify commit range by specifying start and end commit.`
		}

		let commitPromises = _.map(commits, commit => {
			if(this.isUrl(commit)) {
				return requestPromise.get(commit)
									 .then(result => result.trim());	
			}

			return Promise.resolve(commit);
		});

		return Promise.all(commitPromises);
	}

	isUrl(val) {
		return val.indexOf("http") !== -1 || val.indexOf("https") !== -1
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