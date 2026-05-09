const fs = require('fs');
const path = require('path');

class ScreenshotHelper {
    /**
     * Takes a screenshot of the current browser state.
     * @param {WebDriver} driver 
     * @param {string} testName - Name of the test for the filename
     */
    static async takeScreenshotOnFailure(driver, testName) {
        try {
            const image = await driver.takeScreenshot();
            const screenshotsDir = path.join(__dirname, '../screenshots');
            
            // Ensure directory exists
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
            }

            const safeTestName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const timestamp = new Date().getTime();
            const filename = path.join(screenshotsDir, `${safeTestName}_${timestamp}.png`);
            
            fs.writeFileSync(filename, image, 'base64');
            console.log(`Screenshot saved: ${filename}`);
            return filename;
        } catch (error) {
            console.error("Failed to take screenshot:", error);
        }
    }
}

module.exports = ScreenshotHelper;
