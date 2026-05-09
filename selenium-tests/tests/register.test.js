const { expect } = require('chai');
const { getDriver } = require('../config/driverSetup');
const RegisterPage = require('../pages/RegisterPage');
const DashboardPage = require('../pages/DashboardPage');
const mockData = require('../test-data/mockData.json');
const ScreenshotHelper = require('../utils/screenshotHelper');

describe('Registration Flow E2E', function () {
    let driver;
    let registerPage;
    let dashboardPage;

    this.timeout(45000);

    before(async function () {
        driver = await getDriver();
        registerPage = new RegisterPage(driver);
        dashboardPage = new DashboardPage(driver);
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

    it('should fail registration with an already existing email', async function () {
        await registerPage.navigateToRegister();
        // Use the existing student email from mockData
        await registerPage.fillRegistrationForm(
            'Test User',
            mockData.users.student.email,
            mockData.users.student.password
        );
        await registerPage.submitRegistration();

        // Wait a bit for the API call and error to render
        await driver.sleep(2000);
        const isErrorVisible = await registerPage.isErrorMessageDisplayed();
        expect(isErrorVisible).to.be.true;
    });

    it('should successfully register a new user and redirect to dashboard', async function () {
        await registerPage.navigateToRegister();
        
        // Generate a random email to ensure successful registration
        const randomEmail = `selenium.new.${Date.now()}@example.com`;
        
        await registerPage.fillRegistrationForm(
            mockData.users.newStudent.name,
            randomEmail,
            mockData.users.newStudent.password
        );
        await registerPage.submitRegistration();

        // Check if redirected to dashboard or login
        await driver.wait(async () => {
            const url = await driver.getCurrentUrl();
            return url.includes('/dashboard') || url.includes('/login');
        }, 15000);
        
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.satisfy(url => url.includes('/dashboard') || url.includes('/login'));
    });
});
