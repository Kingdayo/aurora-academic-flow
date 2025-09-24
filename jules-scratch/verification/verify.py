from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        page.goto("http://127.0.0.1:8080/")

        # Log in
        page.wait_for_selector('input[name="email"]')
        page.get_by_label("Email").first.fill("test@example.com")
        page.get_by_label("Password").first.fill("password")
        page.get_by_role("button", name="Sign In with Email").first.click()

        # Wait for dashboard to load
        expect(page).to_have_url("http://127.0.0.1:8080/dashboard")

        # Verify notification button and take screenshot
        notification_button = page.get_by_role("button", name="Enable Notifications")
        expect(notification_button).to_be_visible()
        page.screenshot(path="jules-scratch/verification/notification_button.png")

        # Click the button to trigger permission prompt (we can't interact with the prompt itself)
        notification_button.click()

        # Verify group join functionality
        page.get_by_placeholder("Enter group join code").fill("FAKECODE")
        page.get_by_role("button", name="Join Group").click()
        expect(page.get_by_text("Invalid join code")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/join_group_error.png")

        browser.close()

if __name__ == "__main__":
    run_verification()