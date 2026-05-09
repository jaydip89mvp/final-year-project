const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const WaitHelpers = require('../utils/waitHelpers');

class SubjectLearningPage extends BasePage {
    constructor(driver) {
        super(driver);
        this.lessonLoadingSpinner = By.css('.animate-spin');
        this.startQuizButton = By.xpath("//button[contains(., 'Start Quiz for this item')]");
        this.quizOptions = By.css('button.w-full.text-left');
        this.nextQuestionButton = By.xpath("//button[contains(text(), 'Next')]");
        this.submitQuizButton = By.xpath("//button[contains(text(), 'Submit Quiz')]");
        this.speechButton = By.css('button[title="Read aloud"]');
        this.enterChildButton = By.xpath("//button[contains(., 'Enter →')]");
        this.quizResultScore = By.css('.text-4xl.font-bold');
        this.goToNextTopicButton = By.xpath("//button[contains(text(), 'Go to next topic') or contains(text(), 'Back to Subjects')]");
    }

    async waitForLessonToLoad() {
        await WaitHelpers.waitForElementToDisappear(this.driver, this.lessonLoadingSpinner, 30000); // AI might take a while
    }

    async startQuiz() {
        await WaitHelpers.waitForElementClickable(this.driver, this.startQuizButton);
        await this.click(this.startQuizButton);
    }

    async selectFirstQuizOption() {
        await WaitHelpers.waitForElementToDisappear(this.driver, this.lessonLoadingSpinner, 30000);
        const options = await this.driver.findElements(this.quizOptions);
        if (options.length > 0) {
            await options[0].click();
        }
    }

    async submitQuizIfAvailable() {
        try {
            await WaitHelpers.waitForElementClickable(this.driver, this.submitQuizButton, 5000);
            await this.click(this.submitQuizButton);
        } catch (error) {
            // Might not be the last question
        }
    }

    async completeQuiz() {
        let isComplete = false;
        while (!isComplete) {
            await this.selectFirstQuizOption();
            try {
                // Check if Next button exists
                const nextBtns = await this.driver.findElements(this.nextQuestionButton);
                if (nextBtns.length > 0 && await nextBtns[0].isDisplayed()) {
                    await nextBtns[0].click();
                } else {
                    // Try to click Submit
                    await this.submitQuizIfAvailable();
                    isComplete = true;
                }
            } catch (err) {
                isComplete = true;
            }
        }
    }

    async enterFirstSubtopic() {
        await WaitHelpers.waitForElementClickable(this.driver, this.enterChildButton);
        const buttons = await this.driver.findElements(this.enterChildButton);
        if (buttons.length > 0) {
            await buttons[0].click();
        }
    }

    async isQuizResultDisplayed() {
        await WaitHelpers.waitForElementVisible(this.driver, this.quizResultScore);
        return await this.isElementDisplayed(this.quizResultScore);
    }
}

module.exports = SubjectLearningPage;
