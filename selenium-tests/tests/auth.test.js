const { expect } = require('chai');
const { getDriver } = require('../config/driverSetup');
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');
const mockData = require('../test-data/mockData.json');
const ScreenshotHelper = require('../utils/screenshotHelper');

describe('Authentication Flow E2E', function () {
    let driver;
    let loginPage;
    let dashboardPage;

    before(async function () {
        driver = await getDriver();
        loginPage = new LoginPage(driver);
        dashboardPage = new DashboardPage(driver);
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

    it('should show an error for invalid credentials', async function () {
        await loginPage.navigateToLogin();
        await loginPage.login('invalid@example.com', 'wrongpassword');
        
        // Wait for and check error message (assuming the UI displays one)
        // Note: adjust the assertion based on the actual error text if needed.
        const errorText = await loginPage.getErrorMessage();
        expect(errorText).to.not.be.empty;
    });

    it('should successfully log in a valid user and navigate to dashboard', async function () {
        await loginPage.navigateToLogin();
        await loginPage.login(mockData.users.student.email, mockData.users.student.password);
        
        const isDashboardLoaded = await dashboardPage.isDashboardLoaded();
        expect(isDashboardLoaded).to.be.true;
    });

    it('should allow user to logout', async function () {
        await dashboardPage.logout();
        // Assuming logout redirects to login or home
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.include('/login');
    });
});
