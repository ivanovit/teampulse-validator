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

class TeampulseService {
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

    updateItemsFromCommitsRange({ base, head, fieldsToSet, requiredFields }) {
        console.log(`Start checking items from commits range ${base} to ${head}`)
        const compareCommitsParams = Object.assign({ base, head }, defaultConfig.github.repository);

        return github.repos.compareCommits(compareCommitsParams).then(result => {
            let tasks = _.map(result.commits, commitInfo => {
                let prNumber = helper.extractPullRequestNumber(commitInfo.commit.message);
                if(prNumber) {
                    return this.updateItemsFromPullRequest({ prNumber, fieldsToSet, requiredFields });
                }
                
                return Promise.resolve();
            });
            
            return Promise.all(tasks);
        });
    }
    
    updateItemsFromPullRequest({ prNumber, fieldsToSet, requiredFields }) {
        console.log(`Start checking items from PR #${prNumber}`)
        const githubOptions = Object.assign({ number: prNumber }, defaultConfig.github.repository);

        return github.issues.get(githubOptions)
                                  .then(this._getTeampulseItems.bind(this))
                                  .then(itemIds => Promise.all(_.map(itemIds, itemId => this.updateItemAndValidate({ itemId, fieldsToSet, requiredFields }))))
    }

	updateItemAndValidate({ itemId, fieldsToSet, requiredFields }) {
        console.log(`Checking teampulse item #${itemId}`)
        return teampulse.getItem(itemId)
						.then(item => {
                            this._throwIfFieldMissing(item, requiredFields);
                            return this._setFields(item, fieldsToSet);
						});
	}

	_throwIfFieldMissing(tpItem, requiredFields) {
        let hasMissingField = false;
        _.forEach(requiredFields, requiredField => {
            const orRequiredFields = requiredField.split("|");
			if (!_.some(orRequiredFields, orField => tpItem.fields[orField])) {
                hasMissingField = true;
				console.log(`Missing required field ${requiredField} for #${tpItem.id}`);
			 }
		});

        if(hasMissingField) {
            throw `Fix the missing fields`
        }
	}

    _getTeampulseItems(issue) {
        if(!issue.pull_request) {
            throw "Only Pull Requests are supported."
        }

        let teampulseItemIds = helper.extractTeamPulseIds(issue.body);
        if(teampulseItemIds.length < 1) {
            if(issue.labels.some(label => label.name === defaultConfig.github.labels.noTeampulseItem)) {
                return [];
            }

            throw `Missing teampulse id in the pull request(#${issue.number}) description. Add teampulse id in the description or add label ${defaultConfig.github.labels.noTeampulseItem}`;
        }

        return teampulseItemIds;
    }

    _setFields(tpItem, fields) {
        let propertiesToChange = _.filter(fields, field => tpItem.fields[field.name] !== field.value)
        //TODO: If item is closed should not change status
        if(propertiesToChange.length > 0) {
            let changeSet = {};
            let oldValues = {};
            _.forEach(propertiesToChange, field => {
                changeSet[field.name] = field.value;
                oldValues[field.name] = tpItem.fields[field.name] || '<empty>';
            })

            console.log(`Changing item #${tpItem.id} ${JSON.stringify(oldValues)} -> ${JSON.stringify(changeSet)}` );
            return teampulse.putItem(tpItem.id, changeSet);
        }
        
        console.log(`No fields to change for #${tpItem.id}`)
        return Promise.resolve();
    }

    _shouldVerify({ issue, requiredStatus }) {
        if(issue.pull_request) {
            const labels = issue.labels || [];
            return !labels.some(label => label.name === requiredStatus);
        }
        
        return false;
    }
}

module.exports = new TeampulseService();