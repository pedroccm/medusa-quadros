"""
Scraping products from Quadrorama via Wayback Machine.
Extracts 30 products from 5 categories (~6 each).
"""
import requests
from bs4 import BeautifulSoup
import json
import os
import time
import re
import sys

# Fix Windows encoding
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

ARCHIVE_BASE = 'https://web.archive.org/web/20250101031521/'
SITE_BASE = 'https://www.quadrorama.com.br/'

CATEGORIES = {
    'Filmes': 'filmes',
    'Series': 'series',
    'Musica': 'musica',
    'Frases': 'frases',
    'Lugares': 'cidades',
}

PRODUCTS_PER_CATEGORY = 7  # Get 7 to have buffer, trim to 6
IMAGE_DIR = './product-images'


def get_archived_url(url):
    if url.startswith('https://web.archive.org'):
        return url
    return ARCHIVE_BASE + url


def get_original_url(archived_url):
    match = re.search(r'https://web\.archive\.org/web/\d+(?:im_)?/(https?://.+)', archived_url)
    if match:
        return match.group(1)
    return archived_url


def fetch_page(url, retries=3):
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            if r.status_code == 200:
                return r.text
            print(f"  Status {r.status_code} for {url[:80]}")
        except Exception as e:
            print(f"  Error: {e}")
        if attempt < retries - 1:
            time.sleep(2)
    return None


def slugify(name):
    slug = name.lower().strip()
    slug = re.sub(r'[àáâãä]', 'a', slug)
    slug = re.sub(r'[èéêë]', 'e', slug)
    slug = re.sub(r'[ìíîï]', 'i', slug)
    slug = re.sub(r'[òóôõö]', 'o', slug)
    slug = re.sub(r'[ùúûü]', 'u', slug)
    slug = re.sub(r'[ç]', 'c', slug)
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug


def parse_price(price_str):
    if not price_str:
        return 0.0
    price_str = re.sub(r'[R$\s]', '', price_str)
    price_str = price_str.replace('.', '').replace(',', '.')
    try:
        return float(price_str)
    except:
        return 0.0


def scrape_category(category_name, category_slug):
    """Scrape products from a category listing page."""
    url = get_archived_url(f'{SITE_BASE}categoria-produto/{category_slug}/')
    print(f"\n--- Category: {category_name} ({category_slug}) ---")
    html = fetch_page(url)
    if not html:
        print("  Failed to load category page")
        return []

    soup = BeautifulSoup(html, 'html.parser')
    products = []

    # Find product grid items
    product_cards = soup.select('.product-grid-item, div[class*="product-grid-item"]')
    if not product_cards:
        # Fallback: find product wrappers
        product_cards = soup.select('.product-wrapper')

    print(f"  Found {len(product_cards)} product cards")

    for card in product_cards[:PRODUCTS_PER_CATEGORY]:
        try:
            # Name
            name_el = card.select_one('h3.wd-entities-title a, .product-element-bottom h3 a, h3 a')
            if not name_el:
                continue
            name = name_el.get_text(strip=True)
            # Clean up encoding artifacts
            name = name.replace('\ufffd', '').replace('�', '').strip()
            name = re.sub(r'\s+', ' ', name)
            if not name:
                continue

            # Product URL
            product_url = get_original_url(name_el.get('href', ''))

            # Price
            price_el = card.select_one('.woocommerce-Price-amount bdi, .price .amount, .price bdi')
            price_text = price_el.get_text(strip=True) if price_el else ''
            base_price = parse_price(price_text) if price_text else 29.90

            # Image
            img_el = card.select_one('.product-image-link img, .product-element-top img')
            image_url = ''
            if img_el:
                image_url = img_el.get('data-src') or img_el.get('src') or ''
                image_url = get_original_url(image_url)
                # Try to get higher resolution by modifying URL
                image_url = re.sub(r'-\d+x\d+\.', '.', image_url)

            slug = slugify(name)

            # Create size variants based on the base price
            if base_price > 0:
                variants = [
                    {'size': '20x30cm', 'price': round(base_price, 2)},
                    {'size': '30x40cm', 'price': round(base_price * 1.33, 2)},
                    {'size': '40x60cm', 'price': round(base_price * 1.78, 2)},
                ]
            else:
                variants = [
                    {'size': '20x30cm', 'price': 29.90},
                    {'size': '30x40cm', 'price': 39.90},
                    {'size': '40x60cm', 'price': 54.90},
                ]

            product = {
                'name': name,
                'slug': slug,
                'description': f'Quadro decorativo {name}. Arte em alta qualidade impressa em papel especial com moldura.',
                'category': category_name,
                'price': base_price if base_price > 0 else 29.90,
                'variants': variants,
                'image': f'./product-images/{slug}.jpg',
                'image_url_original': image_url,
                'product_url': product_url,
            }
            products.append(product)
            print(f"  [OK] {name} - R${product['price']}")

        except Exception as e:
            print(f"  [ERR] Error parsing product: {e}")

    return products


def download_image(url, filepath):
    if not url:
        return False
    try:
        # Try archived version first (more reliable)
        archived_url = get_archived_url(url)
        r = requests.get(archived_url, headers=HEADERS, timeout=30, stream=True)
        if r.status_code == 200 and len(r.content) > 1000:
            with open(filepath, 'wb') as f:
                for chunk in r.iter_content(8192):
                    f.write(chunk)
            return True
        # Try original URL
        r = requests.get(url, headers=HEADERS, timeout=30, stream=True)
        if r.status_code == 200 and len(r.content) > 1000:
            with open(filepath, 'wb') as f:
                for chunk in r.iter_content(8192):
                    f.write(chunk)
            return True
    except Exception as e:
        print(f"  Download failed: {e}")
    return False


def main():
    os.makedirs(IMAGE_DIR, exist_ok=True)
    all_products = []

    for category_name, category_slug in CATEGORIES.items():
        time.sleep(2)
        products = scrape_category(category_name, category_slug)
        all_products.extend(products[:6])  # Max 6 per category

    # Assign IDs
    for i, p in enumerate(all_products, 1):
        p['id'] = i

    print(f"\n--- Downloading {len(all_products)} images ---")
    for p in all_products:
        if p['image_url_original']:
            print(f"  [{p['id']}/{len(all_products)}] {p['slug']}")
            success = download_image(p['image_url_original'], p['image'])
            if success:
                print(f"    Downloaded OK")
            else:
                print(f"    Download failed, will use placeholder")
            time.sleep(1)

    # Remove product_url from final output (internal only)
    for p in all_products:
        p.pop('product_url', None)

    print(f"\n=== RESULTS ===")
    print(f"Total products: {len(all_products)}")
    for cat in CATEGORIES:
        count = sum(1 for p in all_products if p['category'] == cat)
        print(f"  {cat}: {count}")

    with open('products.json', 'w', encoding='utf-8') as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)

    print("\nSaved to products.json")


if __name__ == '__main__':
    main()
