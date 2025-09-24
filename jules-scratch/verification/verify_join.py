from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context1 = browser.new_context()
        page1 = context1.new_page()

        # --- User 1: Create a group and get the join code ---
        page1.goto("http://127.0.0.1:8080/")

        # Log in as user 1
        page1.wait_for_selector('input[name="email"]')
        page1.get_by_label("Email").first.fill("user1@example.com")
        page1.get_by_label("Password").first.fill("password")
        page1.get_by_role("button", name="Sign In with Email").first.click()
        expect(page1).to_have_url("http://127.0.0.1:8080/dashboard")

        # Create a new group
        page1.get_by_placeholder("Group name").fill("Test Group")
        page1.get_by_role("button", name="Create Group").click()

        # Get the join code
        join_code_element = page1.locator('code').first
        expect(join_code_element).to_be_visible()
        join_code = join_code_element.inner_text()

        page1.screenshot(path="jules-scratch/verification/user1_creates_group.png")

        # --- User 2: Join the group ---
        context2 = browser.new_context()
        page2 = context2.new_page()
        page2.goto("http://127.0.0.1:8080/")

        # Log in as user 2
        page2.wait_for_selector('input[name="email"]')
        page2.get_by_label("Email").first.fill("user2@example.com")
        page2.get_by_label("Password").first.fill("password")
        page2.get_by_role("button", name="Sign In with Email").first.click()
        expect(page2).to_have_url("http://127.0.0.1:8080/dashboard")

        # Join the group
        page2.get_by_placeholder("Enter group join code").fill(join_code)
        page2.get_by_role("button", name="Join Group").click()

        # Verify that the group is now visible to user 2
        expect(page2.get_by_text("Test Group")).to_be_visible()
        page2.screenshot(path="jules-scratch/verification/user2_joins_group.png")

        browser.close()

if __name__ == "__main__":
    run_verification()