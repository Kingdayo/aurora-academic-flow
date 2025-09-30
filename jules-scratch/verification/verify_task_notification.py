from playwright.sync_api import sync_playwright, expect
import uuid

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Generate unique user credentials
    unique_id = str(uuid.uuid4())[:8]
    email = f"test-user-{unique_id}@example.com"
    password = "password123"

    try:
        page.goto("http://localhost:5173/")

        # --- Sign Up ---
        page.get_by_role("button", name="Sign up here").click()

        # Use specific IDs to avoid ambiguity between mobile and desktop inputs
        page.locator("#auth-name").fill("Test User")
        page.locator("#auth-email").fill(email)
        page.locator("#auth-password").fill(password)

        page.get_by_role("button", name="Create Account").click()

        # Add a delay and take a screenshot to debug the sign-up process
        page.wait_for_timeout(3000)
        page.screenshot(path="jules-scratch/verification/signup_debug.png")

        # --- Sign In ---
        # Use specific IDs for login as well
        page.locator("#auth-email").fill(email)
        page.locator("#auth-password").fill(password)
        page.get_by_role("button", name="Sign In").click()

        # --- Dashboard & Task Creation ---
        # Wait for the dashboard to load
        expect(page.get_by_role("heading", name="Tasks")).to_be_visible(timeout=10000)

        # Open the add task dialog
        page.get_by_role("button", name="Add Task").click()

        # Fill in the task details
        page.get_by_label("Title *").fill("Overdue Task")
        page.get_by_label("Description").fill("This task should be overdue.")

        # Set a due date in the past
        page.get_by_role("button", name="Select due date").click()
        page.get_by_role("button", name="‹").click() # Go to previous month
        page.get_by_role("gridcell", name="15").first.click() # Select a day

        # Add the task
        page.get_by_role("button", name="Add Task").click()

        # Wait for the "Task added" toast to appear and disappear
        expect(page.get_by_text("Task added successfully!")).to_be_visible()
        expect(page.get_by_text("Task added successfully!")).not_to_be_visible()

        # Expect the task to be visible in the countdown timer as overdue
        overdue_countdown = page.locator(".card", has_text="Overdue Task!")
        expect(overdue_countdown).to_be_visible()
        expect(overdue_countdown.locator("h3", has_text="Overdue Task")).to_be_visible()

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/task_notification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)