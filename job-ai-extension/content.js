// Listener for messages sent from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SCRAPE_JOB_DETAILS") {
    const details = scrapePageJobDetails();
    sendResponse({ success: true, data: details });
  }

  if (request.action === "AUTO_FILL_FORM") {
    const fillResult = executeSafeAutofill(request.profile);
    sendResponse({ success: true, result: fillResult });
  }
  return true;
});

function scrapePageJobDetails() {
  const url = window.location.href;
  let title = "";
  let company = "";
  let description = "";

  // 1. LinkedIn Selectors (Added a[href*='/company/'] to catch missing names)
  if (url.includes("linkedin.com")) {
    title = document.querySelector(".job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1, .topcard__title")?.innerText || "";
    company = document.querySelector(".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .topcard__org-name-link, a[href*='/company/']")?.innerText || "";
    description = document.querySelector("#job-details, .jobs-description-content__text, .jobs-box__html-content, .description__text")?.innerText || "";
  } 
  // 2. Indeed Selectors
  else if (url.includes("indeed.com")) {
    title = document.querySelector("h1.jobsearch-JobInfoHeader-title, [data-testid='jobsearch-JobInfoHeader-title']")?.innerText || "";
    company = document.querySelector("[data-testid='inlineHeader-companyName'], .jobsearch-CompanyInfoContainer, a[href*='/cmp/']")?.innerText || "";
    description = document.querySelector("#jobDescriptionText")?.innerText || "";
  } 
  // 3. Naukri Selectors
  else if (url.includes("naukri.com")) {
    title = document.querySelector(".styles_jd-header-title__rZwM1, h1")?.innerText || "";
    company = document.querySelector(".styles_jd-header-comp-name__MvqAI a")?.innerText || "";
    description = document.querySelector(".styles_job-desc-container__jvqzk, .dang-inner-html")?.innerText || "";
  }

  // --- BULLETPROOF FALLBACKS ---
  if (!title) title = document.querySelector("h1")?.innerText || document.title || "Unknown Title";
  
  // If we STILL don't have a company name, extract it from the Browser Tab Title
  // e.g., "Software Engineer | Amazon | LinkedIn" -> Grabs "Amazon"
  if (!company || company.trim() === "") {
    const pageTitle = document.title;
    if (pageTitle.includes("|")) {
      const parts = pageTitle.split("|");
      if (parts.length >= 2) company = parts[1].trim();
    } else if (pageTitle.includes("-")) {
      const parts = pageTitle.split("-");
      if (parts.length >= 2) company = parts[1].trim();
    }
  }

  if (!company) company = "Unknown Company";
  
  if (!description || description.trim().length < 40) {
    description = document.body.innerText.slice(0, 5000); 
  }

  // Clean up any extra whitespace or newlines
  return {
    job_title: title.trim().split('\n')[0],
    company_name: company.trim().split('\n')[0],
    job_description: description.trim(),
    page_url: url
  };
}

function executeSafeAutofill(profile) {
  if (!profile) return { filledCount: 0, fields: [] };

  const filledFields = [];

  function setInputValue(input, value) {
    if (!input || !value) return;
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.blur();
  }

  const allInputs = Array.from(document.querySelectorAll("input, textarea"));

  allInputs.forEach((el) => {
    const nameAttr = (el.name || "").toLowerCase();
    const idAttr = (el.id || "").toLowerCase();
    const placeholder = (el.placeholder || "").toLowerCase();
    const label = (el.getAttribute("aria-label") || "").toLowerCase();
    const combined = `${nameAttr} ${idAttr} ${placeholder} ${label}`;

    // Fill First Name
    if (combined.includes("first") && (combined.includes("name") || combined.includes("fname"))) {
      if (profile.first_name && !el.value) {
        setInputValue(el, profile.first_name);
        filledFields.push("First Name");
      }
    }
    // Fill Last Name
    else if (combined.includes("last") && (combined.includes("name") || combined.includes("lname"))) {
      if (profile.last_name && !el.value) {
        setInputValue(el, profile.last_name);
        filledFields.push("Last Name");
      }
    }
    // Fill Full Name
    else if (combined.includes("fullname") || (combined.includes("name") && !combined.includes("company") && !combined.includes("user"))) {
      if (profile.full_name && !el.value) {
        setInputValue(el, profile.full_name);
        filledFields.push("Full Name");
      }
    }
    // Fill Email
    else if (el.type === "email" || combined.includes("email")) {
      if (profile.email && !el.value && !combined.includes("alert")) {
        setInputValue(el, profile.email);
        filledFields.push("Email");
      }
    }
    // Fill Phone
    else if (el.type === "tel" || combined.includes("phone") || combined.includes("mobile")) {
      if (profile.phone && !el.value) {
        setInputValue(el, profile.phone);
        filledFields.push("Phone");
      }
    }
    // Fill LinkedIn URL
    else if (combined.includes("linkedin")) {
      if (profile.linkedin && !el.value) {
        setInputValue(el, profile.linkedin);
        filledFields.push("LinkedIn Profile");
      }
    }
  });

  // DO NOT click submit. Form is left for manual review.
  return {
    filledCount: filledFields.length,
    fields: [...new Set(filledFields)]
  };
}