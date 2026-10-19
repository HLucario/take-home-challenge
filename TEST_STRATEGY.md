1. What would you not automate in this flow, and why?
Manual exploratory testing is far better suited for verifying the design of specific elements, dynamic text adjustments, or font-rendering anomalies. In my view, automating these aspects requires significant effort, yet often has little impact on the user experience and isn't critical for validating core user flows.
While the search and filter flow is safe to automate, executing real-money transactions or end-to-end third-party gateway integrations in a test pipeline introduces compliance risks, account lockouts, and unnecessary flakiness due to external dependency downtime.

2. If Liverpool added a CAPTCHA to the search flow, how would you handle it in your test suite?
If automated search traffic triggers  CAPTCHAs, I could consider to intercept and mock the authentication/anti-bot headers or bypass the UI search layer entirely by querying the underlying internal search endpoint directly.

3. What flakiness risks exist in this test, and how did you mitigate them?
E-commerce sites load content asynchronously, a lot. I use Playwright's built-in auto-waiting locators and explicit network response interception (page.waitForResponse()) to synchronize actions with actual data readiness.
XPath selectors break when frontend components update. Rely on resilient, using locators like test IDs).

4. If you had to add this to a team's CI pipeline running 50+ other test suites, what would you change?
I could consider options like
- Run test files or parameters in parallel across multiple matrix jobs.
- Test Categorization (Smoke vs. Regression) to run.
- Run strictly in headless mode with optimized browser resource flags (--disable-dev-shm-usage, --no-sandbox) inside lightweight Docker containers to maximize pipeline throughput and minimize resource contention.