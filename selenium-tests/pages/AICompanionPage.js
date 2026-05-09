const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const WaitHelpers = require('../utils/waitHelpers');

class AICompanionPage extends BasePage {
    constructor(driver) {
        super(driver);
        this.aiAvatarButton = By.css('button[title="Talk to AI Companion (Drag to move)"]');
        this.thinkingDots = By.css('.animate-pulse > span');
        this.responseContextBubble = By.css('.bg-slate-800\\/95'); // Context bubble container
    }

    async toggleAICompanion() {
        await this.click(this.aiAvatarButton);
    }

    async waitForAIThinking() {
        // Wait for the thinking dots to appear, then disappear
        try {
            await WaitHelpers.waitForElementVisible(this.driver, this.thinkingDots, 10000);
            await WaitHelpers.waitForElementToDisappear(this.driver, this.thinkingDots, 30000);
        } catch (e) {
            // It might process very fast or the dots might not be caught, just proceed to check response
        }
    }

    async getAIResponseText() {
        const bubble = await WaitHelpers.waitForElementVisible(this.driver, this.responseContextBubble, 15000);
        return await bubble.getText();
    }
}

module.exports = AICompanionPage;
