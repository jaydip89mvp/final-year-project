const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const WaitHelpers = require('../utils/waitHelpers');

class ProfilePage extends BasePage {
    constructor(driver) {
        super(driver);
        this.ageInput = By.css('input[name="age"], input[id="age"]');
        this.gradeInput = By.css('input[name="grade"], input[id="grade"], select[name="grade"]');
        this.bioInput = By.css('textarea[name="bio"], textarea[id="bio"]');
        this.saveButton = By.css('button[type="submit"]');
        this.editProfileBtn = By.xpath("//a[contains(@href, '/profile/edit')] | //button[contains(., 'Edit Profile')]");
        this.profileName = By.css('h1'); // Assuming h1 is the name on the profile view
    }

    async navigateToProfileEdit() {
        await this.navigate('/profile/edit');
    }

    async navigateToProfileView(userId) {
        await this.navigate(`/profile/${userId}`);
    }

    async fillProfile(age, grade, bio) {
        if (age) await this.type(this.ageInput, age);
        if (grade) await this.type(this.gradeInput, grade);
        if (bio) await this.type(this.bioInput, bio);
    }

    async saveProfile() {
        await WaitHelpers.waitForElementClickable(this.driver, this.saveButton);
        await this.click(this.saveButton);
    }

    async isProfileViewLoaded() {
        return await this.isElementDisplayed(this.profileName);
    }
}

module.exports = ProfilePage;
