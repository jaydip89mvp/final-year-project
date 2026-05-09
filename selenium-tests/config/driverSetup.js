const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('dotenv').config();

/**
 * Initializes and returns a Selenium WebDriver instance.
 * Supports headless execution via HEADLESS env variable.
 */
async function getDriver() {
    let options = new chrome.Options();
    
    // Use environment variable for headless mode, essential for CI/CD
    if (process.env.HEADLESS === 'true') {
        options.addArguments('--headless');
        options.addArguments('--disable-gpu');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
    }

    // Set default window size to ensure responsive UI elements are visible
    options.addArguments('window-size=1920,1080');

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    return driver;
}

module.exports = { getDriver };
