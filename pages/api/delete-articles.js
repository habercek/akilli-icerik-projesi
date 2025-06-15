// pages/api/delete-articles.js

import { db } from '../../firebase';
import { collection, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { ids } = req.body; // Silinecek ID'lerin dizisini al

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Silinecek makale ID listesi boş olamaz.' });
    }

    // Performans için toplu silme işlemi (batch) kullan
    const batch = writeBatch(db);
    
    // Her bir ID için bir silme işlemi oluştur
    ids.forEach(id => {
      const docRef = doc(db, 'articles', id);
      batch.delete(docRef);
    });

    // Toplu silme işlemini gerçekleştir
    await batch.commit();
    
    res.status(200).json({ message: `${ids.length} makale başarıyla silindi.` });

  } catch (error) {
    console.error('Makaleleri silme API Hatası:', error);
    res.status(500).json({ error: 'Makaleler silinirken sunucuda bir hata oluştu.' });
  }
}
