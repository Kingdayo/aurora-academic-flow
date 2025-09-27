from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the login page
        page.goto("http://localhost:5173/")

        # Expect the page to have the title "aurora-academic-flow"
        expect(page).to_have_title("aurora-academic-flow")

        # Fill in the email and password using unique IDs
        page.locator("#auth-email").fill("1kingdayo@gmail.com")
        page.locator("#auth-password").fill("1kingdayo@gmail.com")

        # Click the login button
        page.get_by_role("button", name="Sign In").click()

        # Wait for navigation to the dashboard
        expect(page.get_by_role("heading", name="Tasks")).to_be_visible(timeout=10000)

        # Navigate to the "Groups" tab
        page.get_by_role("button", name="Groups").click()

        # Wait for the "Loading groups..." message to disappear
        loading_text = page.get_by_text("Loading groups...")
        expect(loading_text).to_be_hidden(timeout=10000)

        # Click on the "Open Chat" button within the first group card
        group_card = page.locator('[data-testid^="group-card-"]').first
        group_card.get_by_role("button", name="Open Chat").click()

        # Wait for the chat to load by checking for the message input field
        expect(page.locator('input[placeholder="Type a message..."]')).to_be_visible(timeout=10000)

        # Take a screenshot of the chat interface
        page.screenshot(path="jules-scratch/verification/verification.png")

        print("Screenshot taken successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        # Clean up
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)