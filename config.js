module.exports = {
    teampulse: {
        credentials: {
            username: process.env.TEAMPULSE_USERNAME,
            password: process.env.TEAMPULSE_PASSWORD,
            domain: process.env.TEAMPULSE_DOMAIN
        },
        url: "http://teampulse.telerik.com",
        status: {
            inReview: "In Review",
            //TODO: Check status name
            readyForTest: "Ready For Test"
        },
        requiredFields: [ "Description" ]
    },
    github: {
        credentials: {
            type: "basic",
            username: process.env.GITHUB_USERNAME,
            password: process.env.GITHUB_PASSWORD
        },
        repository: {
            owner: "Icenium",
			repo: "Ice"
        },
        teampulseIdRegex: "Related to: \\[#([0-9]{1,6})\\]"
    },
    daysToValidate: 2
};