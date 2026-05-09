const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const WaitHelpers = require('../utils/waitHelpers');

class SubjectsPage extends BasePage {
    constructor(driver) {
        super(driver);
        this.pageTitle = By.xpath("//h1[contains(., 'Subjects')]");
        this.subjectCards = By.css('.subject-card, .glass-panel'); // Trying to be generic based on UI patterns
        this.firstSubjectLink = By.xpath("(//a[contains(@href, '/learning/subject/')])[1]");
    }

    async navigateToSubjects() {
        await this.navigate('/subjects');
    }

    async isSubjectsLoaded() {
        return await this.isElementDisplayed(this.pageTitle);
    }

    async getSubjectsCount() {
        await WaitHelpers.waitForElementVisible(this.driver, this.subjectCards);
        const cards = await this.driver.findElements(this.subjectCards);
        return cards.length;
    }

    async clickFirstSubject() {
        await WaitHelpers.waitForElementClickable(this.driver, this.firstSubjectLink);
        await this.click(this.firstSubjectLink);
    }
}

module.exports = SubjectsPage;
