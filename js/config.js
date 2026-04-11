// config.js
// 1. Zjistíme, jestli jsme ve vývojovém prostředí (localhost nebo dev doména)
const isDev = window.location.hostname === 'localhost' || 
              window.location.hostname === '127.0.0.1' || 
              window.location.hostname.includes('dev.');

// 2. Vytvoříme globální objekt s adresami
const CONFIG = {
    // API pro veřejnost (čtení představení atd.)
    API_PUBLIC_URL: isDev ? 'https://dev.api.vitium.art' : 'https://api.vitium.art',
    
    // API pro administraci a zápis
    API_ADMIN_URL: isDev ? 'https://dev.api.vitium.art' : 'https://api-admin.vitium.art',
    
    // API pro odesílání e-mailů (pokud má dev verzi, změň ji tu, jinak nech stejnou)
    API_MAIL_URL: 'https://post-api.vitium.art' 
};