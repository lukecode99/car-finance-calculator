import XCTest

// Real iOS Simulator screenshots, driven as a genuine XCUITest.
// The app launches with a pre-populated comparison (carPrice default 26918,
// PCP/HP/PCH enabled), so the Calculator tab is meaningful on cold launch.
// We navigate the bottom tab bar by normalized coordinate so we don't depend
// on React Native's accessibility tree exposing the tab labels.
final class ScreenshotUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    private func tapTab(_ app: XCUIApplication, x: CGFloat) {
        // Bottom tab bar sits ~97% down the screen; three equal thirds.
        let pt = app.coordinate(withNormalizedOffset: CGVector(dx: x, dy: 0.965))
        pt.tap()
        sleep(1)
    }

    @MainActor
    func testScreenshots() throws {
        let app = XCUIApplication()
        setupSnapshot(app)
        app.launch()
        sleep(3) // let RN bundle render + results compute

        // 1. Calculator — top of the populated comparison (hero).
        snapshot("01_Calculator")

        // 2. Calculator — scrolled to the results/cheapest-option section.
        app.swipeUp()
        sleep(1)
        app.swipeUp()
        sleep(1)
        snapshot("02_Results")

        // 3. Guide tab (right third of the tab bar).
        tapTab(app, x: 0.83)
        snapshot("03_Guide")

        // 4. Saved tab (middle third).
        tapTab(app, x: 0.5)
        snapshot("04_Saved")
    }
}
