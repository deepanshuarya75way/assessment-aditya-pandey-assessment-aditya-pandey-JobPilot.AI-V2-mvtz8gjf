import os
import time
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

# File where ALL cookies and session tokens will be permanently saved
AUTH_FILE = Path(__file__).resolve().parent / "auth_state.json"

# ==========================================
# 1. GREENHOUSE STRATEGY
# ==========================================
def apply_greenhouse(page, profile_data: dict) -> dict:
    filled_fields = []

    if profile_data.get("first_name"):
        page.fill("input[id='first_name']", profile_data["first_name"])
        filled_fields.append("first_name")

    if profile_data.get("last_name"):
        page.fill("input[id='last_name']", profile_data["last_name"])
        filled_fields.append("last_name")

    if profile_data.get("email"):
        page.fill("input[id='email']", profile_data["email"])
        filled_fields.append("email")

    if profile_data.get("phone"):
        page.fill("input[id='phone']", profile_data["phone"])
        filled_fields.append("phone")

    if profile_data.get("linkedin"):
        linkedin_inputs = page.locator("input[name*='linkedin' i], input[id*='linkedin' i]").all()
        if linkedin_inputs:
            linkedin_inputs[0].fill(profile_data["linkedin"])
            filled_fields.append("linkedin")

    required_empty = page.locator("input[aria-required='true'], input[required]").all()
    missing_fields = [
        req.get_attribute("id") or req.get_attribute("name") or "Unknown"
        for req in required_empty if not req.input_value()
    ]
    
    if missing_fields:
        return {"success": False, "error": f"Missing required fields: {', '.join(missing_fields)}"}
    
    return {"success": True, "message": f"Greenhouse form filled successfully ({', '.join(filled_fields)})!"}


# ==========================================
# 2. ADZUNA STRATEGY (Native Forms)
# ==========================================
def apply_adzuna(page, profile_data: dict) -> dict:
    filled_fields = []
    
    # Exclude the annoying job alert boxes!
    email_inputs = page.locator("input[type='email']:not([placeholder*='alert' i])").all()
    if email_inputs and profile_data.get("email"):
        email_inputs[0].fill(profile_data["email"])
        filled_fields.append("email")

    if not filled_fields:
        return {"success": False, "error": "No actual application form found on this Adzuna page."}

    return {"success": True, "message": f"Filled fields: {', '.join(filled_fields)}"}


# ==========================================
# MASTER ROUTER
# ==========================================
# ==========================================
# MASTER ROUTER
# ==========================================
def auto_apply_master(job_url: str, profile_data: dict) -> dict:
    try:
        with sync_playwright() as p:
            # Ensure the persistent profile directory exists
            USER_DATA_DIR = Path(__file__).resolve().parent / "browser_profile"
            USER_DATA_DIR.mkdir(parents=True, exist_ok=True)

            # 1. Launch a True Persistent Browser (Saves everything, including IndexedDB)
            context = p.chromium.launch_persistent_context(
                user_data_dir=str(USER_DATA_DIR),
                headless=False,
                args=["--disable-blink-features=AutomationControlled"],
            )

            # Use the default page created by the persistent context
            page = context.pages[0] if context.pages else context.new_page()
            
            page.goto(job_url, timeout=60000)
            page.wait_for_load_state("domcontentloaded")
            time.sleep(2)

            # --- AGGREGATOR REDIRECT LOGIC ---
            if "adzuna" in page.url.lower():
                apply_btn = page.locator("a:has-text('Apply for this job'), button:has-text('Apply for this job')").first
                
                if apply_btn.is_visible():
                    old_page_count = len(context.pages)
                    apply_btn.click()
                    time.sleep(4) 
                    
                    if len(context.pages) > old_page_count:
                        page = context.pages[-1]
                    
                    page.wait_for_load_state("domcontentloaded")
                    time.sleep(2)

            # Check final destination
            final_url = page.url.lower()

            if "greenhouse.io" in final_url:
                result = apply_greenhouse(page, profile_data)
            elif "adzuna" in final_url:
                result = apply_adzuna(page, profile_data)
            else:
                result = {"success": False, "error": f"Unsupported ATS. Bot landed on: {final_url}"}

            page.screenshot(path="last_apply_attempt.png", full_page=True)

            # 2. INFINITE PAUSE FOR LOGIN
            # This will pop up a Playwright Inspector window. 
            # Take your time, log in, and then click the "Resume" (Play) button in the Inspector!
            page.pause()

            context.close()
            return result

    except Exception as e:
        traceback.print_exc()
        return {"success": False, "error": str(e)}