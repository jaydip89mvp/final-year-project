const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const WaitHelpers = require('../utils/waitHelpers');

class ClassroomsPage extends BasePage {
    constructor(driver) {
        super(driver);
        // Teacher Elements
        this.createClassroomBtn = By.xpath("//button[contains(., 'Create Classroom') or contains(., 'New Classroom')]");
        this.nameInput = By.css('input[name="name"], input[placeholder*="name"]');
        this.descriptionInput = By.css('textarea[name="description"], textarea[placeholder*="escription"]');
        this.submitCreateBtn = By.xpath("//button[@type='submit' and contains(., 'Create')]");
        this.classroomCards = By.css('.classroom-card, .glass-panel');
        
        // Student Elements (if applicable, though students might only see assigned ones)
        // Adjust these as needed if there is a 'join' flow
        this.joinClassroomBtn = By.xpath("//button[contains(., 'Join')]");
        this.inviteCodeInput = By.css('input[name="inviteCode"]');
    }

    async navigateToTeacherClassrooms() {
        await this.navigate('/teacher/classrooms');
    }

    async navigateToStudentClassrooms() {
        await this.navigate('/classrooms'); // Adjust path if needed
    }

    async createClassroom(name, description) {
        await WaitHelpers.waitForElementClickable(this.driver, this.createClassroomBtn);
        await this.click(this.createClassroomBtn);
        
        await WaitHelpers.waitForElementVisible(this.driver, this.nameInput);
        await this.type(this.nameInput, name);
        if (description) {
            await this.type(this.descriptionInput, description);
        }
        
        await this.click(this.submitCreateBtn);
    }

    async getClassroomsCount() {
        try {
            await WaitHelpers.waitForElementVisible(this.driver, this.classroomCards, 5000);
            const cards = await this.driver.findElements(this.classroomCards);
            return cards.length;
        } catch (e) {
            return 0; // If timeout, return 0
        }
    }
}

module.exports = ClassroomsPage;
