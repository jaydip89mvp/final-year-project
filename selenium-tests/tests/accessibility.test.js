const { expect } = require('chai');
const { getDriver } = require('../config/driverSetup');
const LandingPage = require('../pages/LandingPage');
const ScreenshotHelper = require('../utils/screenshotHelper');
const { By } = require('selenium-webdriver');
const WaitHelpers = require('../utils/waitHelpers');

describe('Accessibility Features E2E', function () {
    let driver;
    let landingPage;

    // Locators for Accessibility Features
    const a11yMenuBtn = By.css('button[title*="Access"], .fixed.bottom-6.right-6'); // usually fixed bottom right
    const readingRulerBtn = By.xpath("//button[contains(., 'Reading Ruler')]");
    const attentionTrackerBtn = By.xpath("//button[contains(., 'Attention')]");

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

    it('should be able to toggle accessibility menu globally', async function () {
        await landingPage.navigateToLanding();
        
        try {
            await WaitHelpers.waitForElementClickable(driver, a11yMenuBtn, 5000);
            await driver.findElement(a11yMenuBtn).click();
            
            // Wait for menu to open, we assume there are feature toggle buttons
            await WaitHelpers.waitForElementVisible(driver, readingRulerBtn, 3000);
            const isMenuOpen = await driver.findElement(readingRulerBtn).isDisplayed();
            expect(isMenuOpen).to.be.true;
        } catch (e) {
            // If the accessibility button doesn't exist on landing page, this test might skip or fail.
            // But App.jsx shows it's globally wrapped outside Routes.
            console.warn("Accessibility menu not found or not clickable", e);
            throw e;
        }
    });
});
