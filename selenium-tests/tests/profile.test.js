const { expect } = require('chai');
const { getDriver } = require('../config/driverSetup');
const ProfilePage = require('../pages/ProfilePage');
const LoginPage = require('../pages/LoginPage');
const mockData = require('../test-data/mockData.json');
const ScreenshotHelper = require('../utils/screenshotHelper');

describe('Profile E2E', function () {
    let driver;
    let profilePage;
    let loginPage;

    this.timeout(45000);

    before(async function () {
        driver = await getDriver();
        profilePage = new ProfilePage(driver);
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

    it('should navigate to profile edit, fill form, and save', async function () {
        await profilePage.navigateToProfileEdit();
        
        await profilePage.fillProfile(
            mockData.profile.age,
            mockData.profile.grade,
            mockData.profile.bio
        );
        
        await profilePage.saveProfile();

        // After save, it should either show a success message or redirect to profile view
        await driver.wait(async () => {
            const url = await driver.getCurrentUrl();
            return url.includes('/profile/');
        }, 15000);
        
        const isLoaded = await profilePage.isProfileViewLoaded();
        expect(isLoaded).to.be.true;
    });
});
