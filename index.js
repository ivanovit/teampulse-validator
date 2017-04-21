#!/usr/bin/env node

var teampulseService = require('./teampulseService'),
	helper = require('./helper'),
	yargs = require('yargs'),
	defaultConfig = require('./config'),
	_ = require('lodash');

teampulseService.initialize()
				.then(() => {
		yargs.usage('Usage: $0 <command> [options]')
			.command('update-items', 'Validate ', yargs => {
				try {
					let fieldsToSet = helper.parseFieldsToSet(yargs.argv),
						requiredFields = _.union(helper.asArray(yargs.argv.validateRequiredField), defaultConfig.teampulse.requiredFields);
					
					if (yargs.argv.fromPullRequest) {
						teampulseService.updateItemsFromPullRequest({ prNumber : yargs.argv.fromPullRequest, fieldsToSet, requiredFields })
										.then(() => process.exit())
										.catch(helper.logErrorAndExit);
					} else if(yargs.argv.fromCommitsRange) {
						helper.parseAndGetCommitIds(yargs.argv)
							.then(commits => teampulseService.updateItemsFromCommitsRange({ base: commits[0], head: commits[1], fieldsToSet, requiredFields }))
							.then(() => process.exit())
							.catch(helper.logErrorAndExit);
					} 
				} catch(e) {
					helper.logErrorAndExit(e);
				}
			})
			.alias('p', 'from-pull-request')
			.alias('c', 'from-commits-range')
			.array('from-commits-range')
			.alias('s', 'set-field')
			.alias('v', 'validate-required-field')
			.argv;
})
.catch(helper.logErrorAndExit)