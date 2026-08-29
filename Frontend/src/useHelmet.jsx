import { Helmet } from "react-helmet-async";
import logo from "./Images/Logo.jpg";

const currentYear = new Date().getFullYear();
const nextYearShort = (currentYear + 1).toString().slice(-2);
const defaultDescription = `National Polytechnic Institute (NPI) Dhaka is the leading private polytechnic in Bangladesh. Join for Diploma in Engineering under BTEB. Apply online for admission ${currentYear}-${nextYearShort}.`;

const useHelmet = (
  title,
  {
    description = defaultDescription,
    keywords = "Best Private Polytechnic Dhaka, NPI Dhaka, Diploma Engineering Bangladesh, BTEB Admission, Top Polytechnic Institute",
    image = logo,
    type = "website",
    canonical,
    locale = "en_US",
    twitterSite = "@npi_dhaka",
  } = {}
  ) => {
  return function HelmetComponent() {
    const HelmetWrapper = () => {
    const url = canonical || (typeof window !== "undefined" ? window.location.href : "");
    const siteName = "National Polytechnic Institute (NPI)";
    const orgLd = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "National Polytechnic Institute (NPI)",
      "alternateName": "NPI Dhaka",
      "url": "https://npi.edu.bd",
      "logo": image,
      "foundingDate": "2001",
      "founder": {
        "@type": "Person",
        "name": "Engr. Nirmal Chandra Sikder"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+8801799445774",
        "contactType": "Admission Office",
        "areaServed": "BD",
        "availableLanguage": ["Bengali", "English"]
      },
      "sameAs": [
        "https://www.facebook.com/npidhaka",
        "https://www.youtube.com/npidhaka",
        "https://www.linkedin.com/school/national-polytechnic-institute/"
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Farmgate, Dhaka",
        "addressLocality": "Dhaka",
        "postalCode": "1215",
        "addressCountry": "BD"
      }
    };
    const websiteLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteName,
      "url": url || "https://npi.edu.bd",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${url || "https://npi.edu.bd"}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };
    const path = typeof window !== "undefined" ? window.location.pathname : "/";
    const segments = path.split("/").filter(Boolean);
    const baseUrl = "https://npi.edu.bd";
    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        },
        ...segments.map((seg, idx) => ({
          "@type": "ListItem",
          "position": idx + 2,
          "name": seg.replace(/_/g, " ").replace(/-/g, " "),
          "item": `${baseUrl}/${segments.slice(0, idx + 1).join("/")}`
        }))
      ]
    };
    return (
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:type" content={type} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content={locale} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <meta name="twitter:site" content={twitterSite} />
        <link rel="icon" type="image/jpeg" href={logo} />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <script type="application/ld+json">{JSON.stringify(orgLd)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteLd)}</script>
        {segments.length > 0 && <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>}
      </Helmet>
    );
    };
    HelmetWrapper.displayName = "HelmetWrapper";
    return <HelmetWrapper />;
  }
};

export default useHelmet;
