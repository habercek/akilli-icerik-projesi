// pages/api/batch-optimize.js

import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Bu fonksiyon, tekil optimizasyon API'sindeki ile aynıdır.
function getOptimisationPrompt(content) {
  const cleanContent = content.replace(/<[^>]*>?/gm, ' ');
  return `Sen SEO ve içerik stratejisi konusunda uzman bir metin yazarısın. Görevin, aşağıda verilen makale metnini analiz ederek SEO için optimize edilmiş içerikler üretmek. Cevabını SADECE geçerli bir JSON formatında ver. JSON objesinden önce veya sonra hiçbir açıklama veya metin ekleme.

  JSON objesi şu anahtarlara sahip olmalıdır:
  - "h1_title": Makale için ilgi çekici, SEO uyumlu bir H1 başlığı.
  - "subheadings": Makaleyi yapılandırmak için en az 3 adet ilgili H2 ve H3 alt başlıklarını içeren bir string dizisi (array).
  - "summary": Makalenin kısa ve ilgi çekici bir özeti (2-3 cümle).
  - "meta_description": Arama motorları için optimize edilmiş, en fazla 160 karakterlik bir meta açıklaması.

  Analiz edilecek makale metni:
  ---
  ${cleanContent}
  ---
  `;
}

// Bu fonksiyon, tekil optimizasyon API'sindeki ile aynıdır.
// Tüm API anahtarlarını dener.
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

            // Başarılı olursa, JSON verisini döndür
            return JSON.parse(text);

        } catch (error) {
            console.warn(`Anahtar ...${key.slice(-4)} ile deneme başarısız:`, error.message);
            if (!firstError) firstError = error.message;
            continue;
        }
    }

    // Hiçbir anahtar çalışmazsa hata fırlat
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
        // Gemini API anahtarlarını veritabanından bir kere çek
        const siteRef = doc(db, 'sites', 'test-sitesi');
        const siteSnap = await getDoc(siteRef);
        if (!siteSnap.exists() || !siteSnap.data().gemini_keys || siteSnap.data().gemini_keys.length === 0) {
            throw new Error('Kayıtlı Gemini API anahtarı bulunamadı.');
        }
        const apiKeys = siteSnap.data().gemini_keys;

        let successCount = 0;
        let failCount = 0;

        for (const articleId of ids) {
            try {
                const articleRef = doc(db, 'articles', articleId);
                const articleSnap = await getDoc(articleRef);

                if (!articleSnap.exists() || articleSnap.data().durum !== 'çevrildi') {
                    console.log(`Makale ${articleId} atlandı: bulunamadı veya durumu 'çevrildi' değil.`);
                    continue;
                }

                const contentToOptimize = articleSnap.data().ceviri_icerik;
                const optimizedData = await getOptimizedData(contentToOptimize, apiKeys);

                await updateDoc(articleRef, {
                    seo_data: optimizedData,
                    durum: 'optimize edildi' // Durumu güncelle
                });
                successCount++;
            } catch (error) {
                console.error(`Makale ${articleId} optimize edilirken hata:`, error.message);
                failCount++;
            }
        }

        res.status(200).json({ 
            message: `İşlem tamamlandı. ${successCount} makale optimize edildi, ${failCount} makalede hata oluştu.`
        });

    } catch (error) {
        console.error('Toplu optimizasyon hatası:', error);
        res.status(500).json({ error: error.message });
    }
}
