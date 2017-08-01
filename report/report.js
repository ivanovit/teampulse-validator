class Report {
	constructor(config) {
		this._reportMap = {};
		this.config = config;
		this.reportHeader = this.config.report.header || '';
		this.formatterName = this.config.report.formatter || 'md';
		const Formatter = require(`./${this.formatterName}Formatter`);
		this.formatter = new Formatter(config);
	}

	createPRInfo({ number, title, url, items = [] }) {
        this._reportMap[number] = {
            number,
			title,
			url,
            items
        }
    }

    createTeampulseInfo({ number, id, title, url }) {
		if(!this._reportMap[number]) {
			throw 'Create PR record first';
		}

        this._reportMap[number].items.push({
            id,
			title,
			url
        })
	}

	getReportMap() {
		return this._reportMap;
	}

	getReportHeader() {
		return this.reportHeader;
	}
	
	write() {
		this.formatter.write(this);
	}
}

module.exports = Report;