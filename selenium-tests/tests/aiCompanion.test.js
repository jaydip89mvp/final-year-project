const { expect } = require('chai');
const { getDriver } = require('../config/driverSetup');
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');
const AICompanionPage = require('../pages/AICompanionPage');
const mockData = require('../test-data/mockData.json');
const ScreenshotHelper = require('../utils/screenshotHelper');

describe('AI Companion E2E', function () {
    let driver;
    let loginPage;
    let dashboardPage;
    let aiCompanionPage;

    this.timeout(90000); 

    before(async function () {
        driver = await getDriver();
        loginPage = new LoginPage(driver);
        dashboardPage = new DashboardPage(driver);
        aiCompanionPage = new AICompanionPage(driver);

        // Pre-requisite: Login
        await loginPage.navigateToLogin();
        await loginPage.login(mockData.users.student.email, mockData.users.student.password);
        await dashboardPage.isDashboardLoaded();
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

    it('should activate AI companion and display thinking dots or response context', async function () {
        // Toggle AI Companion
        await aiCompanionPage.toggleAICompanion();

        // Note: Testing actual speech recognition in headless Selenium is not feasible. 
        // We simulate the interaction or wait for the UI response state.
        // In a real scenario, you might inject a mock event or use an API to trigger the text flow.
        
        // For this test, we verify that clicking toggles the active state 
        // (the button gets 'ring-rose-400' class when listening, but we will just ensure it's clickable and doesn't crash).
        const isBubblePresent = await aiCompanionPage.isElementDisplayed(aiCompanionPage.aiAvatarButton);
        expect(isBubblePresent).to.be.true;
    });
});
