// --- VERİ ÇEKME FONKSİYONU (HATA AYIKLAMA KODU EKLENMİŞ HALİ) ---
export async function getServerSideProps() {
  // --- YENİ EKLENEN HATA AYIKLAMA KODU BAŞLANGICI ---
  console.log("--- VERCEL SERVER-SIDE ENV CHECK ---");
  console.log("Firebase Project ID from ENV:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  // --- HATA AYIKLAMA KODU SONU ---

    try {
        const siteRef = doc(db, 'sites', 'test-sitesi');
        const docSnap = await getDoc(siteRef);

        let siteData = { rssKaynaklari: [], deeplKeys: [], geminiKeys: [] };

        if (docSnap.exists()) {
            const data = docSnap.data();
            siteData.rssKaynaklari = data.rssKaynaklari || [];
            siteData.deeplKeys = data.deepl_keys || [];
            siteData.geminiKeys = data.gemini_keys || [];
        }
        
        return { props: { siteData } };

    } catch (error) {
        console.error("Firebase'den veri çekerken hata:", error);
        return { props: { siteData: { rssKaynaklari: [], deeplKeys: [], geminiKeys: [] } } };
    }
}
