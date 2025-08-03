const {Reporter} = require('greener-reporter');
const path = require('path');

class GreenerReporter {
    constructor(globalConfig, reporterOptions, reporterContext) {
        this._reporter = null;
        this._session = null;
        this._rootDir = globalConfig.rootDir;
    }

    onRunStart(results, options) {
        this._reporter = new Reporter();
        this._session = this._reporter.createSession();
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
                    "err",
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
