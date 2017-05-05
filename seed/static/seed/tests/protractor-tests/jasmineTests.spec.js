// run jasmine tests

var EC = protractor.ExpectedConditions;


// Older Jasmine unit tests:
describe('When I go to jasmine tests', function () {

    // manually
    it ('should reset sync', function () {
        browser.ignoreSynchronization = true;
    });

	it('should run jasmine unit tests and pass', function () {
		browser.get("/app/angular_js_tests");
        var passingBar = $('.passingAlert.bar');
        browser.wait(EC.presenceOf(passingBar), 20000);
        expect($('.passingAlert.bar').isPresent()).toBe(true);
     });

	    // manually
    it ('should reset sync', function () {
        browser.ignoreSynchronization = false;
    });
});