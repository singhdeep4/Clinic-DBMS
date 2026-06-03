import React, { useEffect } from "react";

export default function SEO({ title, description, schema }) {
  useEffect(() => {
    // 1. Update Title
    document.title = title ? `${title} | Ayurkaya Clinic` : "Ayurkaya | Premium Ayurvedic Clinic & Healing";

    // 2. Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description || "Ayurkaya Clinic offers premium, personalized Ayurvedic treatments, Panchakarma detoxification, and natural health consults in Bangalore.");

    // 3. Update Open Graph Tags
    const ogTags = {
      "og:title": title ? `${title} | Ayurkaya` : "Ayurkaya | Premium Ayurvedic Clinic",
      "og:description": description || "Rooted in Ayurveda, Focused on Healing.",
      "og:type": "website",
      "og:url": window.location.href,
      "og:image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800",
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    });

    // 4. Update JSON-LD Structured Data
    let schemaScript = document.getElementById("json-ld-schema");
    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.setAttribute("type", "application/ld+json");
      schemaScript.setAttribute("id", "json-ld-schema");
      document.head.appendChild(schemaScript);
    }

    const defaultSchema = {
      "@context": "https://schema.org",
      "@type": "MedicalBusiness",
      "name": "Ayurkaya Ayurvedic Clinic",
      "alternateName": "Ayurkaya",
      "description": "Premium Ayurvedic wellness center and Panchakarma treatment clinic.",
      "logo": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800",
      "url": window.location.origin,
      "telephone": "+918023456789",
      "email": "info@ayurkaya.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "108 Lotus Pavilion Rd, Wellness District, Suite 500",
        "addressLocality": "Bangalore",
        "addressRegion": "KA",
        "postalCode": "560001",
        "addressCountry": "IN"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "08:00",
          "closes": "19:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Sunday",
          "opens": "09:00",
          "closes": "13:00"
        }
      ]
    };

    schemaScript.textContent = JSON.stringify(schema || defaultSchema);

    // Cleanup schema on unmount to prevent duplicate schemas
    return () => {
      // Keep main schema, but clear custom ones if needed
    };
  }, [title, description, schema]);

  return null;
}
