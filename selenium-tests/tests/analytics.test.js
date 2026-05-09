const { expect } = require('chai');
const { getDriver } = require('../config/driverSetup');
const AnalyticsPage = require('../pages/AnalyticsPage');
const DashboardPage = require('../pages/DashboardPage');
const LoginPage = require('../pages/LoginPage');
const mockData = require('../test-data/mockData.json');
const ScreenshotHelper = require('../utils/screenshotHelper');

describe('Analytics E2E', function () {
    let driver;
    let analyticsPage;
    let dashboardPage;
    let loginPage;

    this.timeout(45000);

    before(async function () {
        driver = await getDriver();
        analyticsPage = new AnalyticsPage(driver);
        dashboardPage = new DashboardPage(driver);
        loginPage = new LoginPage(driver);

        // Pre-requisite: Login as Student
        await loginPage.navigateToLogin();
        await loginPage.login(mockData.users.student.email, mockData.users.student.password);
    });

    afterEach(async function () {
        if (this.currentTest.state === 'failed') {
            await ScreenshotHelper.takeScreenshotOnFailure(driver, this.currentTest.title);
        }
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it('should navigate to analytics page and view stats', async function () {
        // Assume student can access analytics via dashboard
        await dashboardPage.navigateToAnalytics();
        
        const isLoaded = await analyticsPage.isAnalyticsLoaded();
        expect(isLoaded).to.be.true;

        const count = await analyticsPage.getStatsCardsCount();
        // It might be 0 if the user is completely new, but we expect UI to render at least the containers
        // or check for charts
        const isChartDisplayed = await analyticsPage.isChartDisplayed();
        
        // At least one form of data presentation should be visible
        expect(count > 0 || isChartDisplayed).to.be.true;
    });
});
