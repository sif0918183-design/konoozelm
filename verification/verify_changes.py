from playwright.sync_api import sync_playwright, expect

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 375, 'height': 812}) # Mobile view
        page = context.new_page()

        # 1. Check Homepage (AR) and Search
        print("Searching on Arabic Homepage...")
        page.goto("http://localhost:3001")
        page.fill("input[type='text']", "اسلام")
        page.click("button[type='submit']")
        page.wait_for_timeout(5000) # Wait for results
        page.screenshot(path="verification/search_ar.png")

        # 2. Check English Homepage and Search
        print("Searching on English Homepage...")
        page.goto("http://localhost:3001/en")
        page.fill("input[type='text']", "islam")
        page.click("button[type='submit']")
        page.wait_for_timeout(5000) # Wait for results
        page.screenshot(path="verification/search_en.png")

        browser.close()

if __name__ == "__main__":
    verify_changes()
