import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1587, 'height': 1122}) # A3 px

        file_path = 'file://' + os.path.abspath('results/report.html')
        await page.goto(file_path)
        await page.wait_for_timeout(1000)

        await page.screenshot(path='verification/report_final.png', full_page=True)
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
