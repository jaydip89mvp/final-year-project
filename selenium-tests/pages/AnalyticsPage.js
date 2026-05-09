const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const WaitHelpers = require('../utils/waitHelpers');

class AnalyticsPage extends BasePage {
    constructor(driver) {
        super(driver);
        this.pageTitle = By.xpath("//h1[contains(., 'Analytics') or contains(., 'Progress')]");
        this.chartContainer = By.css('.recharts-wrapper, canvas'); // Assuming recharts or chart.js is used
        this.statsCards = By.css('.stat-card, .glass-panel');
    }

    async navigateToAnalytics(studentId) {
        await this.navigate(`/analytics/${studentId}`);
    }

    async navigateToMyProgress() {
        // Students usually have a generic /analytics or /progress route
        // Fallback or explicit route based on App.jsx (e.g. /analytics/:studentId)
        // If we don't know the ID, the UI probably has a link in the sidebar
        // For E2E we might just rely on clicking the sidebar, but here is a helper if ID is known
    }

    async isAnalyticsLoaded() {
        return await this.isElementDisplayed(this.pageTitle);
    }

    async getStatsCardsCount() {
        try {
            await WaitHelpers.waitForElementVisible(this.driver, this.statsCards, 5000);
            const cards = await this.driver.findElements(this.statsCards);
            return cards.length;
        } catch (e) {
            return 0;
        }
    }

    async isChartDisplayed() {
        try {
            return await this.isElementDisplayed(this.chartContainer);
        } catch (e) {
            return false;
        }
    }
}

module.exports = AnalyticsPage;
