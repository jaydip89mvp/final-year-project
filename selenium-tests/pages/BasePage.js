const WaitHelpers = require('../utils/waitHelpers');

class BasePage {
    constructor(driver) {
        this.driver = driver;
        this.baseUrl = process.env.BASE_URL || 'http://localhost:5173'; // Vite default port
    }

    async navigate(path) {
        await this.driver.get(`${this.baseUrl}${path}`);
    }

    async click(locator) {
        const el = await WaitHelpers.waitForElementClickable(this.driver, locator);
        await el.click();
    }

    async type(locator, text) {
        const el = await WaitHelpers.waitForElementVisible(this.driver, locator);
        await el.clear();
        await el.sendKeys(text);
    }

    async getText(locator) {
        const el = await WaitHelpers.waitForElementVisible(this.driver, locator);
        return await el.getText();
    }

    async isElementDisplayed(locator) {
        try {
            await WaitHelpers.waitForElementVisible(this.driver, locator, 5000);
            return true;
        } catch (e) {
            return false;
        }
    }
}

module.exports = BasePage;
