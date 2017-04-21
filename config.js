module.exports = {
    teampulse: {
        credentials: {
            username: process.env.TEAMPULSE_USERNAME,
            password: process.env.TEAMPULSE_PASSWORD,
            domain: process.env.TEAMPULSE_DOMAIN
        },
        url: "http://teampulse.telerik.com",
        fields: {
            status:   {
                name: "Status",
                values: {
                    inReview: "In Review",
                    readyForTest: "Ready For Test"
                }
            } 
        },
        status: {
            inReview: "In Review",
            readyForTest: "Ready For Test"
        },
        requiredFields: [ ]
    },
    github: {
        credentials: {
            type: "basic",
            username: process.env.GITHUB_USERNAME,
            password: process.env.GITHUB_PASSWORD
        },
        repository: {
            owner: "Icenium",
			repo: "fusion"
        },
        teampulseIdRegex: "TP: \\[#([0-9]{1,6})\\]",
        labels: {
            noTeampulseItem: "no-teampulse-item"
        }
    },
    daysToValidate: 2
};