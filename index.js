const {Reporter} = require('greener-reporter');
const path = require('path');

class GreenerReporter {
    constructor(globalConfig, reporterOptions, reporterContext) {
        this._reporter = null;
        this._session = null;
        this._rootDir = globalConfig.rootDir;
    }

    onRunStart(results, options) {
        let ingress_endpoint = process.env.GREENER_INGRESS_ENDPOINT;
        let ingress_api_key = process.env.GREENER_INGRESS_API_KEY;
        this._reporter = new Reporter(ingress_endpoint, ingress_api_key);

        let session_id = process.env.GREENER_SESSION_ID; 
        let description = process.env.GREENER_SESSION_DESCRIPTION; 
        let baggage = process.env.GREENER_SESSION_BAGGAGE; 
        let labels = process.env.GREENER_SESSION_LABELS; 
        this._session = this._reporter.createSession(
            (session_id === undefined) ? null : session_id,
            (description === undefined) ? null : description,
            (baggage === undefined) ? null : baggage,
            (labels === undefined) ? null : labels
        );
    }

    onRunComplete(testContexts, results) {
        for (const fileResults of results.testResults) {
            if(!fileResults.testExecError) {
                for (const testCaseResult of fileResults.testResults) {
                    if (testCaseResult.status === "pending") {
                        // report skipped testcase
                        this._reporter.createTestcase(
                            this._session.id,
                            testCaseResult.title,
                            testCaseResult.ancestorTitles.join("::"),
                            path.relative(this._rootDir, fileResults.testFilePath),
                            null,
                            "skip",
                            null,
                            null
                        );
                    }
                }
            } else {
                this._reporter.createTestcase(
                    this._session.id,
                    "*",
                    null,
                    path.relative(this._rootDir, fileResults.testFilePath),
                    null,
                    "error",
                    null,
                    null
                );
            }
        }

        this._reporter.shutdown();
    }

    onTestCaseResult(test, testCaseResult) {
        let status = {"passed": "pass", "failed": "fail"}[testCaseResult.status];

        this._reporter.createTestcase(
            this._session.id,
            testCaseResult.title,
            testCaseResult.ancestorTitles.join("::"),
            path.relative(this._rootDir, test.path),
            null,
            status,
            null,
            null
        );
    }
}

module.exports = GreenerReporter;
