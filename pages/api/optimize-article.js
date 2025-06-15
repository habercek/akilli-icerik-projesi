// pages/api/optimize-article.js

import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// API anahtarını ortam değişkeninden al
// Bu anahtarı bir sonraki adımda Vercel'e ekleyeceğiz.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Yapay zeka için prompt'u (talimatı) oluşturan fonksiyon
function getOptimisationPrompt(content) {
  return `Sen SEO ve içerik stratejisi konusunda uzman bir metin yazarısın. Görevin, aşağıda verilen makale metnini analiz ederek SEO için optimize edilmiş içerikler üretmek. Cevabını SADECE geçerli bir JSON formatında ver. JSON objesinden önce veya sonra hiçbir açıklama veya metin ekleme.

  JSON objesi şu anahtarlara sahip olmalıdır:
  - "h1_title": Makale için ilgi çekici, SEO uyumlu bir H1 başlığı.
  - "subheadings": Makaleyi yapılandırmak için ilgili H2 ve H3 alt başlıklarını içeren bir string dizisi (array).
  - "summary": Makalenin kısa ve ilgi çekici bir özeti (2-3 cümle).
  - "meta_description": Arama motorları için optimize edilmiş, en fazla 160 karakterlik bir meta açıklaması.

  Analiz edilecek makale metni:
  ---
  ${content}
  ---
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // API Anahtarının varlığını kontrol et
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY bulunamadı!');
    return res.status(500).json({ error: 'Sunucu yapılandırmasında API anahtarı eksik.' });
  }

  try {
    const { id, content } = req.body;

    if (!id || !content) {
      return res.status(400).json({ error: 'Makale ID veya içerik eksik.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = getOptimisationPrompt(content);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let optimizedData;
    try {
      optimizedData = JSON.parse(text);
    } catch (e) {
      console.error('Gemini AI JSON Parse Hatası:', text);
      throw new Error('Yapay zeka çıktısı anlaşılamadı. Lütfen tekrar deneyin.');
    }

    const docRef = doc(db, 'articles', id);

    // Firebase'deki makaleye yeni seo_data alanını ekle/güncelle
    await updateDoc(docRef, {
      seo_data: optimizedData,
      optimized_at: new Date().toISOString(), // Optimizasyon zamanını kaydet
    });

    res.status(200).json({ message: 'Makale başarıyla optimize edildi.', data: optimizedData });

  } catch (error) {
    console.error('Optimizasyon API Hatası:', error);
    res.status(500).json({ error: `Makale optimize edilirken bir hata oluştu: ${error.message}` });
  }
}
