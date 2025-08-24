#!/usr/bin/env python3
"""
Update sitemap.xml with additional Indian cities
"""
import json
import xml.etree.ElementTree as ET
from datetime import datetime

# New cities to add from the provided list
new_cities = [
    {"name": "Tiruchirappalli", "slug": "tiruchirappalli"},
    {"name": "Tiruppur", "slug": "tiruppur"},
    {"name": "Gurugram", "slug": "gurugram"},
    {"name": "Aligarh", "slug": "aligarh"},
    {"name": "Jalandhar", "slug": "jalandhar"},
    {"name": "Salem", "slug": "salem"},
    {"name": "Mira-Bhayandar", "slug": "mira-bhayandar"},
    {"name": "Warangal", "slug": "warangal"},
    {"name": "Thiruvananthapuram", "slug": "thiruvananthapuram"},
    {"name": "Guntur", "slug": "guntur"},
    {"name": "Bhiwandi", "slug": "bhiwandi"},
    {"name": "Saharanpur", "slug": "saharanpur"},
    {"name": "Gorakhpur", "slug": "gorakhpur"},
    {"name": "Bikaner", "slug": "bikaner"},
    {"name": "Amravati", "slug": "amravati"},
    {"name": "Noida", "slug": "noida"},
    {"name": "Jamshedpur", "slug": "jamshedpur"},
    {"name": "Bhilai", "slug": "bhilai"},
    {"name": "Cuttack", "slug": "cuttack"},
    {"name": "Kochi", "slug": "kochi"},
    {"name": "Nellore", "slug": "nellore"},
    {"name": "Bhavnagar", "slug": "bhavnagar"},
    {"name": "Durgapur", "slug": "durgapur"},
    {"name": "Asansol", "slug": "asansol"},
    {"name": "Rourkela", "slug": "rourkela"},
    {"name": "Nanded", "slug": "nanded"},
    {"name": "Kolhapur", "slug": "kolhapur"},
    {"name": "Ajmer", "slug": "ajmer"},
    {"name": "Akola", "slug": "akola"},
    {"name": "Kalaburagi", "slug": "kalaburagi"},
    {"name": "Jamnagar", "slug": "jamnagar"},
    {"name": "Ujjain", "slug": "ujjain"},
    {"name": "Siliguri", "slug": "siliguri"},
    {"name": "Jhansi", "slug": "jhansi"},
    {"name": "Ulhasnagar", "slug": "ulhasnagar"},
    {"name": "Jammu", "slug": "jammu"},
    {"name": "Sangli-Miraj-Kupwad", "slug": "sangli-miraj-kupwad"},
    {"name": "Mangaluru", "slug": "mangaluru"},
    {"name": "Erode", "slug": "erode"},
    {"name": "Belagavi", "slug": "belagavi"},
    {"name": "Kurnool", "slug": "kurnool"},
    {"name": "Malegaon", "slug": "malegaon"},
    {"name": "Gaya", "slug": "gaya"},
    {"name": "Tirunelveli", "slug": "tirunelveli"},
    {"name": "Udaipur", "slug": "udaipur"},
    {"name": "Rohtak", "slug": "rohtak"},
    {"name": "Korba", "slug": "korba"},
    {"name": "Bokaro Steel City", "slug": "bokaro-steel-city"},
    {"name": "Patiala", "slug": "patiala"},
    {"name": "Bhagalpur", "slug": "bhagalpur"},
    {"name": "Muzaffarnagar", "slug": "muzaffarnagar"},
    {"name": "Ahmednagar", "slug": "ahmednagar"},
    {"name": "Mathura", "slug": "mathura"},
    {"name": "Jalgaon", "slug": "jalgaon"},
    {"name": "Latur", "slug": "latur"},
    {"name": "Dhule", "slug": "dhule"},
    {"name": "Tirupati", "slug": "tirupati"},
    {"name": "Burhanpur", "slug": "burhanpur"},
    {"name": "Vellore", "slug": "vellore"},
    {"name": "Thoothukudi", "slug": "thoothukudi"},
    {"name": "Rewa", "slug": "rewa"},
    {"name": "Satna", "slug": "satna"},
    {"name": "Dindigul", "slug": "dindigul"},
    {"name": "Nagercoil", "slug": "nagercoil"},
    {"name": "Kakinada", "slug": "kakinada"},
    {"name": "Karimnagar", "slug": "karimnagar"},
    {"name": "Hapur", "slug": "hapur"},
    {"name": "Imphal", "slug": "imphal"},
    {"name": "Shillong", "slug": "shillong"},
    {"name": "Aizawl", "slug": "aizawl"},
    {"name": "Itanagar", "slug": "itanagar"},
    {"name": "Agartala", "slug": "agartala"},
    {"name": "Panaji", "slug": "panaji"},
    {"name": "Puducherry", "slug": "puducherry"},
    {"name": "Sambalpur", "slug": "sambalpur"},
    {"name": "Bilaspur", "slug": "bilaspur"},
    {"name": "Gandhinagar", "slug": "gandhinagar"},
    {"name": "Bhuj", "slug": "bhuj"},
    {"name": "Anand", "slug": "anand"},
    {"name": "Tiruvannamalai", "slug": "tiruvannamalai"},
    {"name": "Palakkad", "slug": "palakkad"},
    {"name": "Thrissur", "slug": "thrissur"},
    {"name": "Alappuzha", "slug": "alappuzha"},
    {"name": "Kozhikode", "slug": "kozhikode"},
    {"name": "Kannur", "slug": "kannur"},
    {"name": "Gulbarga", "slug": "gulbarga"},
    {"name": "Rajahmundry", "slug": "rajahmundry"},
    {"name": "Eluru", "slug": "eluru"},
    {"name": "Vizianagaram", "slug": "vizianagaram"},
    {"name": "Silchar", "slug": "silchar"},
    {"name": "Muzaffarpur", "slug": "muzaffarpur"},
    {"name": "Begusarai", "slug": "begusarai"},
    {"name": "Ambala", "slug": "ambala"},
    {"name": "Panipat", "slug": "panipat"},
    {"name": "Hisar", "slug": "hisar"},
    {"name": "Karnal", "slug": "karnal"},
    {"name": "Haldwani", "slug": "haldwani"},
    {"name": "Haridwar", "slug": "haridwar"}
]

# Services to generate for each city
services = [
    "haircut", "spa", "bridal-makeup", "facial", "hair-color", 
    "manicure", "pedicure", "waxing", "men's-haircut", "kids-haircut", 
    "massage", "threading", "hair-spa", "beard-grooming", "makeup"
]

def update_sitemap():
    # Load existing sitemap
    tree = ET.parse('public/seo/sitemap.xml')
    root = tree.getroot()
    
    # Get current date
    lastmod = datetime.now().strftime('%Y-%m-%d')
    
    # Track existing URLs to avoid duplicates
    existing_urls = set()
    for url_elem in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
        existing_urls.add(url_elem.text)
    
    # Add new cities and services
    namespace = {'': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    
    added_count = 0
    for city in new_cities:
        city_slug = city['slug']
        
        # Add city page
        city_url = f"https://sanwarhub.in/seo/salons/{city_slug}/"
        if city_url not in existing_urls:
            url_elem = ET.SubElement(root, 'url')
            ET.SubElement(url_elem, 'loc').text = city_url
            ET.SubElement(url_elem, 'lastmod').text = lastmod
            ET.SubElement(url_elem, 'changefreq').text = 'weekly'
            ET.SubElement(url_elem, 'priority').text = '0.8'
            existing_urls.add(city_url)
            added_count += 1
        
        # Add service pages for this city
        for service in services:
            service_url = f"https://sanwarhub.in/seo/salons/{city_slug}/{service}/"
            if service_url not in existing_urls:
                url_elem = ET.SubElement(root, 'url')
                ET.SubElement(url_elem, 'loc').text = service_url
                ET.SubElement(url_elem, 'lastmod').text = lastmod
                ET.SubElement(url_elem, 'changefreq').text = 'weekly'
                ET.SubElement(url_elem, 'priority').text = '0.8'
                existing_urls.add(service_url)
                added_count += 1
    
    # Write updated sitemap
    tree.write('public/seo/sitemap.xml', encoding='utf-8', xml_declaration=True)
    
    print(f"Added {added_count} new URLs to sitemap.xml")
    print(f"Total URLs in sitemap: {len(existing_urls)}")

if __name__ == "__main__":
    update_sitemap()