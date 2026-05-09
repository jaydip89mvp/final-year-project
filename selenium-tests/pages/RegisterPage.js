const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const WaitHelpers = require('../utils/waitHelpers');

class RegisterPage extends BasePage {
    constructor(driver) {
        super(driver);
        this.nameInput = By.css('input[name="name"]');
        this.emailInput = By.css('input[name="email"]');
        this.passwordInput = By.css('input[name="password"]');
        this.roleSelect = By.css('select[name="role"]');
        this.submitButton = By.css('button[type="submit"]');
        this.errorMessage = By.css('.text-red-500, .error-message'); // Generic error class
    }

    async navigateToRegister() {
        await this.navigate('/register');
    }

    async fillRegistrationForm(name, email, password, role = 'student') {
        await this.type(this.nameInput, name);
        await this.type(this.emailInput, email);
        await this.type(this.passwordInput, password);
        
        // Handle role selection if applicable
        const roles = await this.driver.findElements(this.roleSelect);
        if (roles.length > 0) {
            await this.type(this.roleSelect, role);
        }
    }

    async submitRegistration() {
        await WaitHelpers.waitForElementClickable(this.driver, this.submitButton);
        await this.click(this.submitButton);
    }

    async isErrorMessageDisplayed() {
        try {
            return await this.isElementDisplayed(this.errorMessage);
        } catch (e) {
            return false;
        }
    }
}

module.exports = RegisterPage;
