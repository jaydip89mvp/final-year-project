const { until } = require('selenium-webdriver');

class WaitHelpers {
    /**
     * Waits for an element to be located and visible in the DOM.
     * @param {WebDriver} driver 
     * @param {Locator} locator 
     * @param {number} timeoutMs 
     */
    static async waitForElementVisible(driver, locator, timeoutMs = 15000) {
        const element = await driver.wait(until.elementLocated(locator), timeoutMs, `Element not located: ${locator}`);
        await driver.wait(until.elementIsVisible(element), timeoutMs, `Element not visible: ${locator}`);
        return element;
    }

    /**
     * Waits for an element to disappear from the DOM or become invisible.
     * Useful for loading spinners (e.g. .animate-spin).
     */
    static async waitForElementToDisappear(driver, locator, timeoutMs = 20000) {
        try {
            const elements = await driver.findElements(locator);
            if (elements.length > 0) {
                await driver.wait(until.elementIsNotVisible(elements[0]), timeoutMs, `Element still visible: ${locator}`);
            }
        } catch (error) {
            // Element might already be gone (StaleElementReference) or not found, which is fine
        }
    }

    /**
     * Waits for an element to be clickable.
     */
    static async waitForElementClickable(driver, locator, timeoutMs = 15000) {
        const element = await this.waitForElementVisible(driver, locator, timeoutMs);
        await driver.wait(until.elementIsEnabled(element), timeoutMs, `Element not enabled: ${locator}`);
        return element;
    }

    /**
     * Waits for text to be present in an element.
     */
    static async waitForTextToBePresent(driver, locator, text, timeoutMs = 15000) {
        const element = await this.waitForElementVisible(driver, locator, timeoutMs);
        await driver.wait(until.elementTextContains(element, text), timeoutMs, `Text '${text}' not found in element: ${locator}`);
        return element;
    }
}

module.exports = WaitHelpers;
