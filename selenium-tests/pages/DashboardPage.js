const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
    constructor(driver) {
        super(driver);
        // Assuming navigation bar has links to these based on standard patterns
        this.dashboardLink = By.xpath("//a[contains(@href, '/dashboard') or contains(text(), 'Dashboard')]");
        this.subjectsLink = By.xpath("//a[contains(@href, '/subjects') or contains(text(), 'Subjects')]");
        this.profileLink = By.xpath("//a[contains(@href, '/profile')]");
        this.analyticsLink = By.xpath("//a[contains(@href, '/analytics') or contains(text(), 'Analytics') or contains(text(), 'Progress')]");
        this.classroomsLink = By.xpath("//a[contains(@href, '/classrooms') or contains(text(), 'Classrooms')]");
        this.logoutButton = By.xpath("//button[contains(text(), 'Logout')]");
    }

    async isDashboardLoaded() {
        return await this.isElementDisplayed(this.dashboardLink);
    }

    async navigateToSubjects() {
        await this.click(this.subjectsLink);
    }

    async navigateToAnalytics() {
        await this.click(this.analyticsLink);
    }

    async navigateToClassrooms() {
        await this.click(this.classroomsLink);
    }

    async logout() {
        await this.click(this.logoutButton);
    }
}

module.exports = DashboardPage;
