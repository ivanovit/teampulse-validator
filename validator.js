const GitHubApi = require('github'),
      TeampulseApi = require('./teampulse/teampulse'),
      defaultConfig = require('./config'),
      _ = require('lodash'),
      helper = require('./helper'),
      github = new GitHubApi({
          version: '3.0.0',
          Promise: Promise
      }), 	  
      teampulse = new TeampulseApi({
		url: defaultConfig.teampulse.url
	  });

const dryRun = true;

class Validator {
    constructor() {
        this.config = defaultConfig;
    }
    
    initialize() {
        github.authenticate(defaultConfig.github.credentials);
        return teampulse.authenticate(defaultConfig.teampulse.credentials);
    }

    setConfig(config) {
        this.config = _.merge(defaultConfig, config);
    }
    
    validateFromPullRequest({ prNumber, requiredStatus}) {
        const that = this,
              githubOptions = Object.assign({ number: prNumber }, defaultConfig.github.repository);

        return github.pullRequests.get(githubOptions)
                                  .then(response => helper.extractTeamPulseIds(response.body))
                                  .then(itemIds => that.validateMany({itemIds, requiredStatus }))
                                  .then(() => github.issues.addLabels(_.assign({ body: [ requiredStatus ] }, githubOptions)))
                                  .catch(helper.logErrorAndExit); 
    }

    validatePullRequestRange({ daysToValidate, requiredStatus }) {
        const that = this,
              since = helper.getDateBeforeDays(daysToValidate).toISOString(),
              githubOptions = Object.assign({ base: "master", state: "closed", since }, defaultConfig.github.repository);
              
        let pullRequestsForStatusUpdate = [];
        github.issues.getForRepo(githubOptions)
                     .then(response => {
                        const that = this;
                        pullRequestsForStatusUpdate = _.filter(response, issue => that._shouldVerify({ issue, requiredStatus}));

                        return pullRequestsForStatusUpdate.map(item => items = helper.extractTeamPulseIds(item.body));
                     })
                     .then(itemIds => that.validateMany({itemIds, requiredStatus }))
                     .then(() => that._addLabelsToMany({prNumbers: pullRequestsForStatusUpdate, label: requiredStatus}))
                     .catch(helper.logErrorAndExit);
    }

    validateMany({ itemIds, requiredStatus }) {
		const that = this,
		      requests = _.map(itemIds, itemId => that.validateItem({ itemId, requiredStatus }));
		
        return Promise.all(requests);
	}

	validateItem({ itemId, requiredStatus }) {
		const that = this;
		
        return teampulse.getItem(itemId)
						.then(item => {
                            that._throwIfFieldMissing(item, defaultConfig.teampulse.requiredFields);
							return that._ensureStatus(item, requiredStatus);
						});
	}

	_throwIfFieldMissing(tpItem, requiredField) {
		_.forEach(defaultConfig.teampulse.requiredFields, requiredField => {
			if(!tpItem.fields[requiredField]) {
                if(dryRun) {
                    console.log(`Missing field: ${requiredField} for tp ${tpItem.id}`);
                    return;
                }
                 
                 throw `Missing required field ${requiredField}`;
			 }
		});
	}

	_ensureStatus(tpItem, requiredStatus) {
		if(tpItem.fields.Status !== requiredStatus) {
			if(dryRun) {
               console.log(`Will change teampulse status to ${requiredStatus} for tp ${tpItem.id}`);
               return Promise.resolve();
           }
            
            return teampulse.changeStatus(tpItem.id, requiredStatus)
		}

		return Promise.resolve();
	}

    _shouldVerify({ issue, requiredStatus }) {
        if(issue.pull_request) {
            const labels = issue.labels || [];
            return !labels.some(label => label.name === requiredStatus);
        }
        
        return false;
    }

    _addLabelsToMany(prNumbers, label) {
       return Promise.all(_.map(prNumbers, prNumber => {
           let labelsOptions = Object.assign({ number: prNumber, body: [ requiredStatus ] }, defaultConfig.github.repository);
           if(dryRun) {
               console.log(`Will add ${label} label to ${prNumbers}`);
               return Promise.resolve();
           }
           return github.issues.addLabels.addLabels(labelsOptions);
       }));
    }
}

module.exports = new Validator();