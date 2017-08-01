const _ = require('lodash'),
	  fs = require('fs'),
	  mkdirp = require('mkdirp'),
	  path = require('path');

class MarkdownReporter {
	constructor(config) {
		this.outputFile = config.report.outputFile || './reports/md/report.md';
	}

	write(report) {
		const reportsDir = path.dirname(this.outputFile);
		mkdirp.sync(reportsDir);
		this.logFile = fs.openSync(this.outputFile, 'w');

		if(report.getReportHeader()) {
			this._writeHeader(report.getReportHeader());
		}
		
		_.forEach(report.getReportMap(), prInfo => {
			this._writeListItem({ text: `PR [#${prInfo.number}](${prInfo.url}) - ${prInfo.title}`, level: 0 });
			_.forEach(prInfo.items, item => {
				this._writeListItem({ text: `TP [#${item.id} ](${item.url}) - ${item.title}`, level: 2 });
			});
		});
	}

	_writeListItem({ text, level }) {
		fs.writeSync(this.logFile, `${new Array(level + 1).join(' ')}* ${text}\n`);
	}

	_writeHeader(text) {
		fs.writeSync(this.logFile, `#### ${text}\n`);
	}
}

module.exports = MarkdownReporter;