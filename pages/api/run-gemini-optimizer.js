// pages/api/run-gemini-optimizer.js

import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { id, content } = req.body;
    if (!id || !content) {
      return res.status(400).json({ error: 'Makale ID veya içerik eksik.' });
    }

    // --- YENİ: Sabırlı Veritabanı Okuma Mantığı ---
    const siteRef = doc(db, 'sites', 'test-sitesi');
    let docSnap;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            docSnap = await getDoc(siteRef);
            if (docSnap.exists()) {
                console.log(`Attempt ${attempts + 1} successful: Firestore document fetched.`);
                break; // Başarılı, döngüden çık
            }
            throw new Error("Sitelere ait ayar belgesi veritabanında bulunamadı.");
        } catch (error) {
            attempts++;
            // Sadece 'client is offline' hatasında yeniden dene
            if (error.message.includes("client is offline") && attempts < maxAttempts) {
                console.warn(`Attempt ${attempts} failed: client is offline. Retrying in 1 second...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
            } else {
                // Diğer hatalarda veya maksimum deneme sayısına ulaşınca hatayı fırlat
                throw error;
            }
        }
    }
    // --- BİTTİ: Sabırlı Veritabanı Okuma Mantığı ---


    if (!docSnap || !docSnap.exists() || !docSnap.data().gemini_keys || docSnap.data().gemini_keys.length === 0) {
        return res.status(404).json({ error: 'Veritabanında kayıtlı Gemini API anahtarı bulunamadı.' });
    }
    const apiKeys = docSnap.data().gemini_keys;

    let successfulOptimization = false;
    let optimizedData = null;
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

        optimizedData = JSON.parse(text);
        successfulOptimization = true;
        break; 
      } catch (error) {
        if (!firstError) firstError = error.message;
        continue;
      }
    }

    if (!successfulOptimization) {
        return res.status(500).json({ error: `Tüm API anahtarları denendi fakat optimizasyon başarısız oldu. İlk alınan hata: ${firstError || 'Bilinmiyor'}` });
    }

    const articleRef = doc(db, 'articles', id);
    await updateDoc(articleRef, {
      seo_data: optimizedData,
      optimized_at: new Date().toISOString(),
    });

    res.status(200).json({ message: 'Makale başarıyla optimize edildi.', data: optimizedData });

  } catch (error) {
    console.error('Genel Optimizasyon API Hatası:', error);
    res.status(500).json({ error: `Beklenmedik bir sunucu hatası oluştu: ${error.message}` });
  }
}
