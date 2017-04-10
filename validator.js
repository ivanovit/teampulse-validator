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
        const githubOptions = Object.assign({ number: prNumber }, defaultConfig.github.repository);
              

        return github.pullRequests.get(githubOptions)
                                  .then(response => helper.extractTeamPulseIds(response.body))
                                  .then(itemIds => this.validateMany.call(this, { itemIds, requiredStatus }))
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

                        return _.flatMap(pullRequestsForStatusUpdate, item => helper.extractTeamPulseIds(item.body))
                     })
                     .then(itemIds => that.validateMany({itemIds, requiredStatus }))
                     .then(() => that._addLabelsToMany({prNumbers: pullRequestsForStatusUpdate, label: requiredStatus}))
                     .catch(helper.logErrorAndExit);
    }

    validateMany({ itemIds, requiredStatus }) {
		const requests = _.map(itemIds, itemId => this.validateItem({ itemId, requiredStatus }));
		
        return Promise.all(requests);
	}

	validateItem({ itemId, requiredStatus }) {
        return teampulse.getItem(itemId)
						.then(item => {
                            this._throwIfFieldMissing(item, defaultConfig.teampulse.requiredFields);
							return this._ensureStatus(item, requiredStatus);
						});
	}

	_throwIfFieldMissing(tpItem, requiredField) {
		_.forEach(defaultConfig.teampulse.requiredFields, requiredField => {
			if(!tpItem.fields[requiredField]) {
				 throw `Missing required field ${requiredField}`;
			 }
		});
	}

	_ensureStatus(tpItem, requiredStatus) {
		if(tpItem.fields.Status !== requiredStatus) {
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
           return github.issues.addLabels.addLabels(labelsOptions);
       }));
    }
}

module.exports = new Validator();
