from playwright.sync_api import sync_playwright, expect
import time

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # --- User 1: Create a group and get the join code ---
        print("--- Starting User 1: Create Group ---")
        context1 = browser.new_context()
        page1 = context1.new_page()

        try:
            page1.goto("http://127.0.0.1:8080/", timeout=60000)
            print("User 1: Navigated to home page.")

            # Use a more robust selector for the email input
            email_input1 = page1.locator('input[name="email"]').first
            expect(email_input1).to_be_visible(timeout=30000)
            print("User 1: Email input is visible.")

            email_input1.fill("user1@example.com")
            page1.get_by_label("Password").first.fill("password")

            # Click the sign-in button
            sign_in_button1 = page1.get_by_role("button", name="Sign In with Email").first
            expect(sign_in_button1).to_be_enabled()
            sign_in_button1.click()
            print("User 1: Clicked sign in.")

            # Wait for navigation to the dashboard
            page1.wait_for_url("http://127.0.0.1:8080/dashboard", timeout=60000)
            print("User 1: Navigated to dashboard.")

            # Create a new group
            group_name_input = page1.get_by_placeholder("Group name")
            expect(group_name_input).to_be_visible()
            group_name_input.fill("Final Test Group")

            create_group_button = page1.get_by_role("button", name="Create Group")
            expect(create_group_button).to_be_enabled()
            create_group_button.click()
            print("User 1: Clicked create group.")

            # Get the join code, waiting for it to appear
            join_code_element = page1.locator('code').first
            expect(join_code_element).to_be_visible(timeout=30000)
            join_code = join_code_element.inner_text()
            print(f"User 1: Got join code: {join_code}")

            page1.screenshot(path="jules-scratch/verification/user1_creates_group.png")
            print("User 1: Screenshot taken.")

        except Exception as e:
            print(f"User 1 failed: {e}")
            page1.screenshot(path="jules-scratch/verification/user1_error.png")
            browser.close()
            return

        # --- User 2: Join the group ---
        print("\n--- Starting User 2: Join Group ---")
        context2 = browser.new_context()
        page2 = context2.new_page()

        try:
            page2.goto("http://127.0.0.1:8080/", timeout=60000)
            print("User 2: Navigated to home page.")

            email_input2 = page2.locator('input[name="email"]').first
            expect(email_input2).to_be_visible(timeout=30000)
            print("User 2: Email input is visible.")

            email_input2.fill("user2@example.com")
            page2.get_by_label("Password").first.fill("password")

            sign_in_button2 = page2.get_by_role("button", name="Sign In with Email").first
            expect(sign_in_button2).to_be_enabled()
            sign_in_button2.click()
            print("User 2: Clicked sign in.")

            page2.wait_for_url("http://127.0.0.1:8080/dashboard", timeout=60000)
            print("User 2: Navigated to dashboard.")

            # Join the group
            join_code_input = page2.get_by_placeholder("Enter group join code")
            expect(join_code_input).to_be_visible()
            join_code_input.fill(join_code)

            join_group_button = page2.get_by_role("button", name="Join Group")
            expect(join_group_button).to_be_enabled()
            join_group_button.click()
            print("User 2: Clicked join group.")

            # Verify that the group is now visible to user 2
            group_title = page2.get_by_text("Final Test Group")
            expect(group_title).to_be_visible(timeout=30000)
            print("User 2: Group is visible.")

            page2.screenshot(path="jules-scratch/verification/user2_joins_group.png")
            print("User 2: Screenshot taken. Verification successful!")

        except Exception as e:
            print(f"User 2 failed: {e}")
            page2.screenshot(path="jules-scratch/verification/user2_error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()