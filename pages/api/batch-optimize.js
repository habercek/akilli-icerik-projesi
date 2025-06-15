// pages/api/batch-optimize.js
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Birlikte hazırladığımız nihai "süper-prompt".
// Artık tek bir yerde tanımlı ve hem tekil hem de toplu işlemde kullanılıyor.
function getOptimisationPrompt(translated_content) {
  return `
Sen; hem bir SEO uzmanı, hem bir kültürel adaptasyon editörü, hem de bir web içerik geliştiricisisin. Görevin, aşağıda verilen Türkçe makale metnini analiz edip, onu hem okuyucu hem de arama motorları için mükemmel hale getirmektir.

Cevabın, SADECE ve SADECE aşağıda tanımlanan yapıya sahip TEK BİR GEÇERLİ JSON objesi olmalıdır. JSON objesinin dışına KESİNLİKLE hiçbir metin veya karakter ekleme.

{
  "enriched_content": "HTML formatında, aşağıda detaylandırılan tüm zenginleştirmelerin yapıldığı metnin yeni hali.",
  "seo_data": {
    "h1_title": "SEO uyumlu başlık.",
    "meta_description": "SEO uyumlu meta açıklaması.",
    "keywords": ["anahtar", "kelime", "listesi"],
    "subheadings": ["alt", "başlık", "listesi"],
    "schema_markup": {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": "Generated H1 Title",
        "description": "Generated Meta Description"
    }
  }
}

---
GÖREV DETAYLARI:
Aşağıdaki tüm görevleri, sana verilen metin üzerinde eksiksiz olarak uygulamalısın.

**BÖLÜM 1: GENEL KURALLAR (EN ÖNEMLİ)**

   a. YORUM KATMA ve YENİ BİLGİ EKLEME: Sana verilen metnin dışına ASLA çıkma. Kendi yorumunu, fikrini veya metinde olmayan bir bilgiyi ekleme. Görevin, var olan metni zenginleştirmek, yeni bir metin yazmak değil.
   
   b. KAYNAK ve PROMOSYON TEMİZLİĞİ: Metnin orijinal kaynağını belirten "Bu haber X sitesinden alınmıştır" gibi ifadeleri veya "Bollywood Hungama" gibi kaynak site isimlerini tamamen kaldır. Ancak, haberin bir parçası olan ve dünyaya mal olmuş (örneğin Nike, Apple, Coca-Cola gibi) meşru marka isimlerini metinde koru. Amaç, kaynak sitenin reklamını temizlemektir, haberin içindeki meşru isimleri silmek değil.
   
   c. GÜVENİLİRLİK (E-E-A-T SİNYALİ): Metin içinde istatistiksel bir veri, önemli bir bilimsel iddia veya spesifik bir araştırma sonucu varsa, bu ifadenin sonuna "(Kaynak: İlgili Raporlar)" gibi genel ama güvenilirliği artıran bir not ekle. Belirli bir kaynak ismi uydurma.

**BÖLÜM 2: ZENGİNLEŞTİRİLMİŞ İÇERİK ("enriched_content") GÖREVLERİ**

   a. ÖZET KUTUSU EKLE: Metnin EN BAŞINA, içeriğin ana konularını listeleyen bir 'Özet Kutusu' ekle. Bu kutu, <div class="summary-box"> etiketi içinde olmalı ve bir başlık ile madde imli bir liste (<ul><li>) içermelidir.

   b. KÜLTÜREL NOTLAR EKLE: Metnin içinde geçen, Türk okuyucunun yabancı olabileceği kültürel, yerel veya teknik terimleri tespit et. Bu terimlerin yanına, PARANTEZ İÇİNDE, herkesin anlayacağı basit bir dille açıklamasını ekle.
      - Örnek 1 (Festival): "Divali" metnini "Divali (Hindistan'da her yıl düzenlenen ışık festivali)" olarak değiştir.
      - Örnek 2 (Para Birimi): "100 Rupi" metnini "100 Rupi (Hindistan'ın para birimi)" olarak değiştir. ANLIK KUR BİLGİSİ VERMEYE ÇALIŞMA.
      - Örnek 3 (Yerel İsim): "Taj Mahal" metnini "Taj Mahal (Hindistan'da bir anıt mezar)" olarak değiştir.
      - Örnek 4 (Lakap/Kısaltma): "SRK" metnini "SRK (ünlü Hint aktör Shah Rukh Khan'ın lakabı)" olarak değiştir.
      - Örnek 5 (Film Kısaltması): "KKHH" metnini "KKHH (popüler Hint filmi 'Kuch Kuch Hota Hai'nin kısaltması)" olarak değiştir.
   
   c. SSS BÖLÜMÜ EKLE: Metnin EN SONUNA, içeriğiyle ilgili en olası 3 soruyu ve cevabını içeren bir "Sıkça Sorulan Sorular" bölümü ekle. Bu bölüm <div class="faq-section"> etiketi içinde olmalı ve her soru <h4>, her cevap <p> etiketiyle yapılandırılmalıdır.
   
   d. ANLAM ve AKIŞI KORU: Bu eklemeleri yaparken metnin orijinal anlamını ve akıcılığını kesinlikle bozma. Kelimeleri basitleştirip daha anlaşılır hale getirebilirsin ama anlamı değiştiremezsin.

**BÖLÜM 3: SEO VERİSİ ("seo_data") GÖREVLERİ**

   a. h1_title: Makale için SEO uyumlu ve 60 KARAKTERİ GEÇMEYEN bir başlık üret.
   b. meta_description: Okuyucuyu tıklamaya teşvik edecek ve 160 KARAKTERİ GEÇMEYEN bir meta açıklaması üret.
   c. keywords: Makalenin odaklandığı 5-7 adet anahtar kelimeden oluşan bir liste oluştur.
   d. subheadings: Metni daha okunabilir kılacak, en az 3 adet mantıklı alt başlık (H2/H3) önerisi sun.
   e. schema_markup: Google için, aşağıda belirtilen şablona uygun bir 'NewsArticle' yapısal verisi (JSON-LD formatında) oluştur. Değerleri, ürettiğin diğer SEO verilerinden veya aşağıdaki placeholder'lardan (yer tutuculardan) al.

      {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": "Bu alana yukarıda ürettiğin h1_title'ı koy",
        "description": "Bu alana yukarıda ürettiğin meta_description'ı koy",
        "image": [ "Lütfen buraya makalenin ana görselinin tam URL'sini ekleyin" ],
        "datePublished": "YYYY-AA-GGTHH:MM:SSZ",
        "dateModified": "YYYY-AA-GGTHH:MM:SSZ",
        "author": [{ "@type": "Person", "name": "Yazar Adı", "url": "Yazarın profil URL'si (varsa)" }],
        "publisher": { "@type": "Organization", "name": "Site Adı", "logo": { "@type": "ImageObject", "url": "Site logosunun tam URL'si" } }
      }

---
ÜZERİNDE ÇALIŞILACAK METİN:
${translated_content}
---
`;
}


// Tek bir makaleyi zenginleştirecek yardımcı fonksiyon
async function getOptimizedData(content, apiKeys) {
    let firstError = null;

    for (const key of apiKeys) {
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
            const prompt = getOptimisationPrompt(content);
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();
            
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("Yapay zeka yanıtında geçerli bir JSON bulunamadı.");
            }
            text = jsonMatch[0];
            const parsedResult = JSON.parse(text);

            if (!parsedResult.enriched_content || !parsedResult.seo_data) {
                throw new Error("JSON formatı hatalı: 'enriched_content' veya 'seo_data' anahtarları eksik.");
            }
            return parsedResult;

        } catch (error) {
            console.warn(`Anahtar ...${key.slice(-4)} ile deneme başarısız:`, error.message);
            if (!firstError) firstError = error.message;
            continue;
        }
    }
    
    throw new Error(`Tüm API anahtarları denendi fakat optimizasyon başarısız oldu. İlk alınan hata: ${firstError || 'Bilinmiyor'}`);
}


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Optimize edilecek makale ID listesi eksik.' });
    }

    try {
        // API anahtarlarını işlem başlamadan önce bir kez al
        const siteRef = doc(db, 'sites', 'test-sitesi');
        const siteSnap = await getDoc(siteRef);
        if (!siteSnap.exists() || !siteSnap.data().gemini_keys || siteSnap.data().gemini_keys.length === 0) {
            throw new Error('Kayıtlı Gemini API anahtarı bulunamadı.');
        }
        const apiKeys = siteSnap.data().gemini_keys;

        let successCount = 0;
        let failCount = 0;

        // Seçilen her bir makale için döngü başlat
        for (const articleId of ids) {
            try {
                const articleRef = doc(db, 'articles', articleId);
                const articleSnap = await getDoc(articleRef);

                // Sadece durumu 'çevrildi' olan makaleleri işle
                if (articleSnap.exists() && articleSnap.data().durum === 'çevrildi') {
                    const contentToOptimize = articleSnap.data().ceviri_icerik;
                    const optimizedData = await getOptimizedData(contentToOptimize, apiKeys);

                    await updateDoc(articleRef, {
                        zenginlestirilmis_icerik: optimizedData.enriched_content,
                        seo_data: optimizedData.seo_data,
                        durum: 'zenginleştirildi',
                        optimized_at: new Date().toISOString(),
                    });
                    successCount++;
                } else {
                    // Uygun durumda olmayan makaleler atlanır
                    console.log(`Makale ${articleId} atlandı (durumu 'çevrildi' değil veya bulunamadı).`);
                }
            } catch (error) {
                console.error(`Makale ${articleId} optimize edilirken hata:`, error.message);
                failCount++;
            }
        }

        res.status(200).json({ 
            message: `İşlem tamamlandı. ${successCount} makale zenginleştirildi, ${failCount} makalede hata oluştu.`
        });

    } catch (error) {
        console.error('Toplu optimizasyon hatası:', error);
        res.status(500).json({ error: error.message });
    }
}
