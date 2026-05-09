const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const WaitHelpers = require('../utils/waitHelpers');

class LandingPage extends BasePage {
    constructor(driver) {
        super(driver);
        // Assuming navbar or main hero has generic buttons
        this.getStartedBtn = By.xpath("//a[contains(@href, '/register')] | //button[contains(., 'Get Started') or contains(., 'Start Learning')]");
        this.loginBtn = By.xpath("//a[contains(@href, '/login')] | //button[contains(., 'Login') or contains(., 'Sign In')]");
        this.heroTitle = By.xpath("//h1"); // Main heading of landing page
    }

    async navigateToLanding() {
        await this.navigate('/');
    }

    async isLandingPageDisplayed() {
        return await this.isElementDisplayed(this.heroTitle);
    }

    async clickGetStarted() {
        await WaitHelpers.waitForElementClickable(this.driver, this.getStartedBtn);
        await this.click(this.getStartedBtn);
    }

    async clickLogin() {
        await WaitHelpers.waitForElementClickable(this.driver, this.loginBtn);
        await this.click(this.loginBtn);
    }
}

module.exports = LandingPage;
