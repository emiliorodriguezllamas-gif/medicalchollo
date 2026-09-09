import sys
import asyncio
import json
from playwright.async_api import async_playwright

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

async def inspect():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            locale="es-ES"
        )
        print("Cargando dentaltix...")
        await page.goto("https://www.dentaltix.com/es/guantes", wait_until="networkidle", timeout=30000)

        # Extraer selectores candidatos
        links = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a[href]'))
                .map(a => ({
                    href: a.href,
                    text: a.innerText.trim().substring(0, 50),
                    className: a.className,
                    parentClass: a.parentElement ? a.parentElement.className : ""
                }))
                .filter(x => x.href.includes('/es/') && x.text.length > 8 && !x.href.includes('/cart') && !x.href.includes('/checkout'))
                .slice(0, 10);
        }''')

        print(json.dumps(links, indent=2, ensure_ascii=False))
        await b.close()

if __name__ == "__main__":
    asyncio.run(inspect())
