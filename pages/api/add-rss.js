// pages/api/add-rss.js

import { db } from '../../firebase'; // Veritabanı bağlantımız
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export default async function handler(req, res) {
  // Sadece POST isteklerine izin ver
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url } = req.body; // İstekten yeni URL'yi al

    // URL'nin boş olup olmadığını kontrol et
    if (!url) {
      return res.status(400).json({ error: 'URL boş olamaz.' });
    }

    // Güncellenecek belgeye referans oluştur
    const siteRef = doc(db, 'sites', 'test-sitesi');

    // Belgeyi güncelle: rssKaynaklari dizisine yeni URL'yi ekle
    await updateDoc(siteRef, {
      rssKaynaklari: arrayUnion(url) // arrayUnion, eğer URL zaten varsa tekrar eklemez
    });

    // Başarılı olursa 200 (OK) durumunu ve bir mesaj gönder
    res.status(200).json({ message: 'Kaynak başarıyla eklendi.' });

  } catch (error) {
    // Bir hata olursa, hatayı konsola yaz ve 500 (Internal Server Error) durumunu gönder
    console.error('API Hatası:', error);
    res.status(500).json({ error: 'Kaynak eklenirken sunucuda bir hata oluştu.' });
  }
}
