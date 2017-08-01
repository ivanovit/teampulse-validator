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
            owner: process.env.GITHUB_OWNER || "Icenium",
			repo: process.env.GITHUB_REPO  || "fusion"
        },
        teampulseIdRegex: "TP: \\[#([0-9]{1,6})\\]",
        labels: {
            noTeampulseItem: "no-teampulse-item"
        }
    },
    report: {
        header: process.env.REPORT_HEADER || "",
        formatter: process.env.REPORT_FORMATTER,
        outputFile: process.env.REPORT_OUT_FILE
    },
    daysToValidate: 2
};