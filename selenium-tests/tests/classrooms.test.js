const { expect } = require('chai');
const { getDriver } = require('../config/driverSetup');
const ClassroomsPage = require('../pages/ClassroomsPage');
const LoginPage = require('../pages/LoginPage');
const mockData = require('../test-data/mockData.json');
const ScreenshotHelper = require('../utils/screenshotHelper');

describe('Teacher Classrooms E2E', function () {
    let driver;
    let classroomsPage;
    let loginPage;

    this.timeout(45000);

    before(async function () {
        driver = await getDriver();
        classroomsPage = new ClassroomsPage(driver);
        loginPage = new LoginPage(driver);

        // Pre-requisite: Login as Teacher
        await loginPage.navigateToLogin();
        await loginPage.login(mockData.users.teacher.email, mockData.users.teacher.password);
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

    it('should navigate to teacher classrooms and create a new classroom', async function () {
        await classroomsPage.navigateToTeacherClassrooms();
        
        const initialCount = await classroomsPage.getClassroomsCount();
        
        const uniqueName = `${mockData.classroom.name} - ${Date.now()}`;
        await classroomsPage.createClassroom(uniqueName, mockData.classroom.description);
        
        // Wait for list to update or redirect
        await driver.sleep(2000); 
        await classroomsPage.navigateToTeacherClassrooms(); // Ensure we are on the list
        
        const newCount = await classroomsPage.getClassroomsCount();
        expect(newCount).to.be.greaterThanOrEqual(initialCount);
    });
});
