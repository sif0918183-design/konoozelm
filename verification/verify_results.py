from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 375, 'height': 812})

        print("Opening search results for 'islam'...")
        page.goto("http://localhost:3001")
        page.fill("input[type='text']", "islam")
        page.keyboard.press("Enter")
        page.wait_for_timeout(5000)
        page.screenshot(path="verification/search_results_mobile.png")

        browser.close()

if __name__ == "__main__":
    verify()
