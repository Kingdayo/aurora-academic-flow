from playwright.sync_api import sync_playwright, Page, expect

def test_layout(page: Page):
    # 1. Arrange: Go to the application's home page.
    page.goto("http://127.0.0.1:8080")

    # Wait for the main content to load
    expect(page.get_by_role("heading", name="Aurora")).to_be_visible(timeout=120000)

    # 2. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/verification.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.set_viewport_size({"width": 1920, "height": 1080})
    test_layout(page)
    browser.close()
