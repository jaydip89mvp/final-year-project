const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
    constructor(driver) {
        super(driver);
        // Locators based on standard MERN auth forms (falling back to CSS selectors based on input types if missing data-testid)
        this.emailInput = By.css('input[type="email"]');
        this.passwordInput = By.css('input[type="password"]');
        this.submitButton = By.css('button[type="submit"]');
        this.errorMessage = By.css('.text-red-500, .bg-red-900\\/20'); // Tailwind classes for errors
    }

    async navigateToLogin() {
        await this.navigate('/login');
    }

    async login(email, password) {
        await this.type(this.emailInput, email);
        await this.type(this.passwordInput, password);
        await this.click(this.submitButton);
    }

    async getErrorMessage() {
        return await this.getText(this.errorMessage);
    }
}

module.exports = LoginPage;
