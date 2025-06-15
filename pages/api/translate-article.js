// pages/api/translate-article.js

import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Bu fonksiyon, DeepL API'sine asıl isteği gönderir.
async function callDeepLApi(text, apiKey) {
  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      target_lang: 'TR', // Hedef dil Türkçe
    }),
  });

  if (!response.ok) {
    // Kota dolduysa (429 veya 456) özel bir hata fırlat
    if (response.status === 429 || response.status === 456) {
      throw new Error('QUOTA_EXCEEDED');
    }
    throw new Error(`DeepL API hatası: ${response.statusText}`);
  }

  const data = await response.json();
  return data.translations[0].text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { id } = req.body; // İşlem yapılacak makalenin ID'sini al

    if (!id) {
      return res.status(400).json({ error: 'Makale ID boş olamaz.' });
    }

    // 1. Kayıtlı API anahtarlarını veritabanından çek
    const siteRef = doc(db, 'sites', 'test-sitesi');
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists() || !siteSnap.data().deepl_keys || siteSnap.data().deepl_keys.length === 0) {
      return res.status(400).json({ error: 'Kayıtlı DeepL API anahtarı bulunamadı. Lütfen admin panelinden ekleyin.' });
    }
    const apiKeys = siteSnap.data().deepl_keys;

    // 2. Çevrilecek makaleyi çek
    const articleRef = doc(db, 'articles', id);
    const articleSnap = await getDoc(articleRef);
    if (!articleSnap.exists()) {
      return res.status(404).json({ error: 'Makale bulunamadı.' });
    }
    const originalContent = articleSnap.data().content || '';

    // 3. Akıllı Anahtar Döngüsü: Sırayla anahtarları dene
    let translatedText = null;
    let success = false;
    for (const key of apiKeys) {
      try {
        translatedText = await callDeepLApi(originalContent, key);
        success = true;
        console.log(`Çeviri başarılı, kullanılan anahtar: ...${key.slice(-5)}`);
        break; // Başarılı olunca döngüden çık
      } catch (error) {
        if (error.message === 'QUOTA_EXCEEDED') {
          console.warn(`API anahtarı ...${key.slice(-5)} için kota doldu. Bir sonraki anahtar denenecek.`);
          continue; // Kota doluysa bir sonraki anahtara geç
        }
        // Başka bir hata varsa döngüyü kır ve hatayı fırlat
        throw error;
      }
    }

    if (!success) {
      return res.status(400).json({ error: 'Tüm API anahtarlarının kotaları dolu veya geçersiz. Lütfen yeni bir anahtar ekleyin.' });
    }

    // 4. Makaleyi veritabanında güncelle
    await updateDoc(articleRef, {
      ceviri_icerik: translatedText,
      durum: 'çevrildi'
    });
    
    res.status(200).json({ message: 'Makale başarıyla çevrildi ve güncellendi.' });

  } catch (error) {
    console.error('Çeviri API Hatası:', error);
    res.status(500).json({ error: `Çeviri sırasında sunucuda bir hata oluştu: ${error.message}` });
  }
}
