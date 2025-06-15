// pages/api/update-article.js

import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { id, content } = req.body; // Güncellenecek makale ID'si ve yeni içerik

    if (!id || content === undefined) {
      return res.status(400).json({ error: 'Makale ID veya içerik eksik.' });
    }

    const docRef = doc(db, 'articles', id);

    // Makale belgesindeki "ceviri_icerik" alanını güncelle
    await updateDoc(docRef, {
      ceviri_icerik: content
    });

    res.status(200).json({ message: 'Makale başarıyla güncellendi.' });

  } catch (error) {
    console.error('Makale Güncelleme API Hatası:', error);
    res.status(500).json({ error: 'Makale güncellenirken sunucuda bir hata oluştu.' });
  }
}
