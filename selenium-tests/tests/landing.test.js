const { expect } = require('chai');
const { getDriver } = require('../config/driverSetup');
const LandingPage = require('../pages/LandingPage');
const ScreenshotHelper = require('../utils/screenshotHelper');

describe('Landing Page E2E', function () {
    let driver;
    let landingPage;

    this.timeout(30000);

    before(async function () {
        driver = await getDriver();
        landingPage = new LandingPage(driver);
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

    it('should display the landing page successfully', async function () {
        await landingPage.navigateToLanding();
        const isDisplayed = await landingPage.isLandingPageDisplayed();
        expect(isDisplayed).to.be.true;
    });

    it('should navigate to login page when Login button is clicked', async function () {
        await landingPage.navigateToLanding();
        await landingPage.clickLogin();
        
        // Verify URL
        await driver.wait(async () => {
            const url = await driver.getCurrentUrl();
            return url.includes('/login');
        }, 5000);
        const url = await driver.getCurrentUrl();
        expect(url).to.include('/login');
    });

    it('should navigate to register page when Get Started is clicked', async function () {
        await landingPage.navigateToLanding();
        await landingPage.clickGetStarted();
        
        // Verify URL
        await driver.wait(async () => {
            const url = await driver.getCurrentUrl();
            return url.includes('/register');
        }, 5000);
        const url = await driver.getCurrentUrl();
        expect(url).to.include('/register');
    });
});
