const { expect } = require('chai');
const { getDriver } = require('../config/driverSetup');
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');
const SubjectLearningPage = require('../pages/SubjectLearningPage');
const mockData = require('../test-data/mockData.json');
const ScreenshotHelper = require('../utils/screenshotHelper');

describe('Adaptive Learning Flow E2E', function () {
    let driver;
    let loginPage;
    let subjectLearningPage;
    let dashboardPage;

    // Extend timeout for AI generation tests
    this.timeout(120000); 

    before(async function () {
        driver = await getDriver();
        loginPage = new LoginPage(driver);
        dashboardPage = new DashboardPage(driver);
        subjectLearningPage = new SubjectLearningPage(driver);

        // Pre-requisite: Login
        await loginPage.navigateToLogin();
        await loginPage.login(mockData.users.student.email, mockData.users.student.password);
        await dashboardPage.isDashboardLoaded();
    });

    afterEach(async function () {
        if (this.currentTest.state === 'failed') {
            await ScreenshotHelper.takeScreenshotOnFailure(driver, this.currentTest.title);
        }
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it('should navigate to a subject and wait for AI lesson content to load', async function () {
        // Navigate directly to the test subject node
        await subjectLearningPage.navigate(`/learning/subject/${mockData.testSubjectId}`);
        
        // This will wait for the `.animate-spin` loader to disappear (AI content loading)
        await subjectLearningPage.waitForLessonToLoad();
        
        // Assert the quiz button is now available after lesson loaded
        const isQuizButtonDisplayed = await subjectLearningPage.isElementDisplayed(subjectLearningPage.startQuizButton);
        expect(isQuizButtonDisplayed).to.be.true;
    });

    it('should navigate to a subtopic and wait for AI lesson content to load', async function () {
        // If there are subtopics, enter the first one
        const hasSubtopics = await subjectLearningPage.isElementDisplayed(subjectLearningPage.enterChildButton);
        if (hasSubtopics) {
            await subjectLearningPage.enterFirstSubtopic();
            await subjectLearningPage.waitForLessonToLoad();
            const isQuizButtonDisplayed = await subjectLearningPage.isElementDisplayed(subjectLearningPage.startQuizButton);
            expect(isQuizButtonDisplayed).to.be.true;
        } else {
            console.log('No subtopics found for this subject, skipping subtopic navigation.');
        }
    });

    it('should start an AI-generated quiz, complete it, and view results', async function () {
        await subjectLearningPage.startQuiz();
        
        // Complete the quiz by selecting options and navigating next/submit
        await subjectLearningPage.completeQuiz();
        
        // Assert that the result screen is displayed
        const isResultDisplayed = await subjectLearningPage.isQuizResultDisplayed();
        expect(isResultDisplayed).to.be.true;
    });
});
