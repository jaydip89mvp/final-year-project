const { expect } = require('chai');
const { getDriver } = require('../config/driverSetup');
const SubjectsPage = require('../pages/SubjectsPage');
const LoginPage = require('../pages/LoginPage');
const mockData = require('../test-data/mockData.json');
const ScreenshotHelper = require('../utils/screenshotHelper');

describe('Subjects List E2E', function () {
    let driver;
    let subjectsPage;
    let loginPage;

    this.timeout(45000);

    before(async function () {
        driver = await getDriver();
        subjectsPage = new SubjectsPage(driver);
        loginPage = new LoginPage(driver);

        // Pre-requisite: Login
        await loginPage.navigateToLogin();
        await loginPage.login(mockData.users.student.email, mockData.users.student.password);
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

    it('should navigate to subjects page and load subjects', async function () {
        await subjectsPage.navigateToSubjects();
        
        const isLoaded = await subjectsPage.isSubjectsLoaded();
        expect(isLoaded).to.be.true;

        const count = await subjectsPage.getSubjectsCount();
        expect(count).to.be.greaterThan(0);
    });

    it('should navigate to learning page when a subject is clicked', async function () {
        await subjectsPage.navigateToSubjects();
        await subjectsPage.clickFirstSubject();
        
        await driver.wait(async () => {
            const url = await driver.getCurrentUrl();
            return url.includes('/learning/subject/');
        }, 10000);
        
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.include('/learning/subject/');
    });
});
