var program = require('commander'),
	validator = require('./validator'),
	helper = require('./helper');

program.command('validate')
	   .description('Validate TeamPulse item')
	   .option('-p, --from-pr [number]', 'Get items number from Pull Request description')
	   .option('-i, --item <item>', 'TeamPulse item number')
	   .option('-s, --ensure-tp-status <status>', "Ensure required status")
	   .option('-f, --required-tp-fields <fields>', helper.split)
	   .parse(process.argv)
	   .action(cmd => { 
			if(cmd.items) {
				validator.validateMany({items: cmd.items, requiredStatus: cmd.ensureTpStatus});
			} else {
				validator.validateFromPullRequest({ prNumber : cmd.fromPr, requiredStatus: cmd.ensureTpStatus });
			}
	   });

program.command('validate-pr-range')
	   .description('Validate TeamPulse items')
	   .option('-d, --days [number]', 'Get items number from Pull Request description')
	   .option('-s, --ensure-tp-status <status>', "Ensure required status")
	   .option('-f, --required-tp-fields <fields>', helper.split)
	   .parse(process.argv)
	   .action(cmd => {
		   validator.validatePullRequestRange({ daysToValidate: cmd.days, requiredStatus: cmd.ensureTpStatus });
	   });

validator.initialize().then(() => {
	program.parse(process.argv);
})